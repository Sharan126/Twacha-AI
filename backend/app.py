"""
============================================================
  app.py  Twacha AI Backend
  Flask REST API for skin disease classification + Grad-CAM

  RUN:   python app.py
  PORT:  http://localhost:5000

  ENDPOINTS:
    GET  /health    Health check
    POST /predict   Upload image  get prediction + Grad-CAM

============================================================

  ARCHITECTURE OVERVIEW:
  
     React Frontend (Vite, port 5173)                  
            POST /predict (multipart/form-data)       
                                                      
     Flask Backend (port 5000)                         
                                                      
              
        1. predictor.preprocess_image()               
        2. predictor.predict(model, image)            
        3. gradcam.generate_gradcam(...)              
              
                                                      
            JSON Response                             
     { class, confidence, heatmap_image (base64) }     
  
============================================================
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import traceback
import os
from functools import wraps
import jwt

# ============================================================
#  CONFIGURE OPENAI (Fallback if missing)
# ============================================================
try:
    from openai import OpenAI
    from dotenv import load_dotenv
    load_dotenv()
    
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    if OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print("  OpenAI: Configured successfully")
    else:
        openai_client = None
        print("  OpenAI: No valid API key found — AI chat disabled")
except ImportError:
    openai_client = None
    print("  OpenAI: openai package not installed — AI chat disabled")

#  Import our modular components 
from model_loader import load_model, get_last_conv_layer_name
from predictor import preprocess_image, predict
from gradcam import generate_gradcam
from skin_validator import is_valid_skin, is_confident_prediction
from report_generator import generate_report, generate_pdf

# ============================================================
#  INITIALIZE FLASK APP
# ============================================================
app = Flask(__name__)

# Enable CORS so our React frontend (localhost:5173) can call this API
# Without CORS, browsers block cross-origin requests
CORS(app, resources={r"/*": {"origins": "*"}})

# JWT Configuration for Supabase
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "your-supabase-jwt-secret")

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized. Missing or invalid token"}), 401
        
        token = auth_header.split(' ')[1]
        try:
            # Verify the JWT using the Supabase JWT secret
            decoded = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
            request.user = decoded
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Unauthorized. Token has expired"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": f"Unauthorized. Invalid token: {str(e)}"}), 401
            
        return f(*args, **kwargs)
    return decorated

# ============================================================
#  LOAD MODEL AT STARTUP (not per request  expensive operation!)
# ============================================================
print("=" * 60)
print("  Twacha AI Backend  Starting up...")
print("=" * 60)

model = load_model()                              # Load the CNN model once
last_conv_layer = get_last_conv_layer_name(model) # Detect last conv layer for Grad-CAM

print(f"  Last conv layer for Grad-CAM: '{last_conv_layer}'")
print("=" * 60)
print("  Server ready at http://localhost:5000")
print("=" * 60)


# ============================================================
#  ROUTE: GET /
#  Built-in HTML test page — open http://localhost:5000 in browser
# ============================================================
@app.route("/", methods=["GET"])
def index():
    html = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twacha AI Backend</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #1a1a2e; border: 1px solid #2d2d4e; border-radius: 16px; padding: 40px; width: 560px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    h1 { font-size: 1.8rem; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 6px; }
    .sub { color: #94a3b8; font-size: 0.9rem; margin-bottom: 28px; }
    .status { display: flex; align-items: center; gap: 8px; background: #0d2a1a; border: 1px solid #22c55e; border-radius: 8px; padding: 10px 14px; margin-bottom: 28px; font-size: 0.85rem; color: #86efac; }
    .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .05em; }
    input[type=file] { width: 100%; padding: 12px; background: #0f0f1a; border: 2px dashed #2d2d4e; border-radius: 10px; color: #94a3b8; cursor: pointer; font-size: 0.9rem; margin-bottom: 16px; }
    input[type=file]:hover { border-color: #667eea; }
    button { width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity .2s; }
    button:hover { opacity: 0.88; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    #result { margin-top: 24px; display: none; }
    .result-label { font-size: 0.78rem; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
    .result-value { font-size: 1.3rem; font-weight: 700; color: #c4b5fd; margin-bottom: 16px; }
    .conf { font-size: 2rem; font-weight: 800; color: #86efac; }
    img#heatmap { width: 100%; border-radius: 10px; margin-top: 12px; border: 1px solid #2d2d4e; }
    .error-box { background: #2a0a0a; border: 1px solid #ef4444; border-radius: 8px; padding: 12px; color: #fca5a5; font-size: 0.85rem; margin-top: 16px; }
    .endpoints { margin-top: 24px; border-top: 1px solid #2d2d4e; padding-top: 18px; }
    .ep { font-size: 0.78rem; color: #64748b; margin-bottom: 4px; }
    .ep span { color: #a5b4fc; font-family: monospace; }
  </style>
</head>
<body>
<div class="card">
  <h1>Twacha AI Backend</h1>
  <p class="sub">Skin Disease Classification + Grad-CAM Explainability</p>

  <div class="status">
    <div class="dot"></div>
    Server is running &mdash; Model loaded (MobileNetV2)
  </div>

  <form id="form">
    <label>Upload Skin Image</label>
    <input type="file" id="fileInput" accept="image/*" required>
    <button type="submit" id="btn">Analyze with AI</button>
  </form>

  <div id="result">
    <div class="result-label">Predicted Condition</div>
    <div class="result-value" id="cls">-</div>
    <div class="result-label">Confidence</div>
    <div class="conf" id="conf">-</div>
    <div class="result-label" style="margin-top:16px">Grad-CAM Heatmap</div>
    <img id="heatmap" alt="Heatmap will appear here">
  </div>
  <div id="errBox" class="error-box" style="display:none"></div>

  <div class="endpoints">
    <div class="ep">POST <span>/predict</span> &mdash; multipart/form-data, key: <span>file</span></div>
    <div class="ep">GET  <span>/health</span> &mdash; server health check</div>
    <div class="ep">GET  <span>/classes</span> &mdash; list all disease classes</div>
  </div>
</div>

<script>
document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn');
  const file = document.getElementById('fileInput').files[0];
  if (!file) return;

  btn.disabled = true;
  btn.textContent = 'Analyzing...';
  document.getElementById('result').style.display = 'none';
  document.getElementById('errBox').style.display = 'none';

  const fd = new FormData();
  fd.append('file', file);

  try {
    const res  = await fetch('/predict', { method: 'POST', body: fd });
    const data = await res.json();

    if (res.status === 422) {
      // Validation failed: not a skin image or low confidence
      throw new Error(data.message || data.error);
    }
    if (data.error) throw new Error(data.error);

    document.getElementById('cls').textContent  = data.class;
    document.getElementById('conf').textContent = data.confidence + '%';

    if (data.heatmap_image) {
      document.getElementById('heatmap').src = 'data:image/jpeg;base64,' + data.heatmap_image;
    }
    document.getElementById('result').style.display = 'block';
  } catch (err) {
    const box = document.getElementById('errBox');
    box.textContent = 'Error: ' + err.message;
    box.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Analyze with AI';
  }
});
</script>
</body>
</html>
"""
    from flask import make_response
    resp = make_response(html)
    resp.headers["Content-Type"] = "text/html"
    return resp


# ============================================================
#  ROUTE: GET /health
#  Simple health check — useful for frontend to check if backend is alive
# ============================================================
@app.route("/health", methods=["GET"])
def health_check():
    """
    Health Check Endpoint.
    Returns 200 OK with a simple JSON message.
    Test: GET http://localhost:5000/health
    """
    return jsonify({
        "status": "ok",
        "message": "Twacha AI backend is running!",
        "model_loaded": model is not None,
        "last_conv_layer": last_conv_layer
    }), 200


# ============================================================
#  ROUTE: POST /predict
#  Main AI endpoint  accepts image, returns prediction + Grad-CAM
# ============================================================
@app.route("/predict", methods=["POST"])
@require_auth
def predict_skin_disease():
    """
    Skin Disease Prediction Endpoint.

    Request (multipart/form-data):
        file : image file (JPEG, PNG, WEBP)

    Response (JSON):
        {
            "class": "Eczema",
            "confidence": "92.43",
            "heatmap_image": "<base64 JPEG string>",
            "all_predictions": [
                { "class": "Eczema", "percentage": 92.43 },
                ...
            ]
        }

    Error Response:
        { "error": "description" }

    Test with Postman:
        Method  : POST
        URL     : http://localhost:5000/predict
        Body    : form-data  key: "file", type: File, value: <your image>
    """

    #  STEP 1: Validate that a file was provided 
    if "file" not in request.files:
        return jsonify({"error": "No file provided. Send an image with key 'file'."}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty filename. Please upload a valid image file."}), 400

    lang = request.form.get("language", "en")

    #  STEP 2: Read image bytes
    try:
        image_bytes = file.read()
        print(f"[app] Received image: '{file.filename}' ({len(image_bytes)} bytes)")
    except Exception as e:
        return jsonify({"error": f"Failed to read image: {str(e)}"}), 400

    #  STEP 2b: Validate that the image looks like skin  CHECK 1
    valid_skin, skin_msg = is_valid_skin(image_bytes)
    if not valid_skin:
        return jsonify({
            "error": "invalid_image",
            "message": skin_msg
        }), 422

    #  STEP 3: Preprocess image
    try:
        image_array = preprocess_image(image_bytes)
    except Exception as e:
        return jsonify({"error": f"Image preprocessing failed: {str(e)}"}), 400

    #  STEP 4: Run prediction
    try:
        prediction_result = predict(model, image_array)
    except Exception as e:
        return jsonify({"error": f"Model prediction failed: {str(e)}"}), 500

    #  STEP 4b: Validate confidence  CHECK 2
    confident, conf_msg = is_confident_prediction(prediction_result["confidence"])
    if not confident:
        return jsonify({
            "error": "low_confidence",
            "message": conf_msg,
            "confidence": str(round(prediction_result["confidence"], 2))
        }), 422

    #  STEP 5: Generate Grad-CAM heatmap 
    try:
        heatmap_base64 = generate_gradcam(
            model=model,
            image_array=image_array,
            last_conv_layer_name=last_conv_layer,
            class_index=prediction_result["class_index"]
        )
    except Exception as e:
        # Grad-CAM failure is non-critical  return prediction without heatmap
        print(f"[app]   Grad-CAM generation failed: {e}")
        print(traceback.format_exc())
        heatmap_base64 = None

    #  STEP 6: Generate Structured Report and PDF
    try:
        report_dict = generate_report(prediction_result["class_name"], lang=lang)
        pdf_base64 = generate_pdf(
            disease_class=prediction_result["class_name"],
            confidence=str(round(prediction_result["confidence"], 2)),
            report_dict=report_dict
        )
    except Exception as e:
        print(f"[app]   Report/PDF generation failed: {e}")
        report_dict = {}
        pdf_base64 = None

    #  STEP 7: Build and return JSON response 
    response = {
        "class": prediction_result["class_name"],
        "confidence": str(round(prediction_result["confidence"], 2)),
        "heatmap_image": heatmap_base64,       # Base64-encoded JPEG string
        "report": report_dict,                 # Structured JSON report
        "pdf_base64": pdf_base64,              # Base64-encoded PDF string
        "all_predictions": [
            {
                "className": p["class"],
                "probability": p["probability"]
            }
            for p in prediction_result["all_scores"]
        ]
    }

    print(f"[app]  Response sent: class='{response['class']}', confidence={response['confidence']}%")
    return jsonify(response), 200


# ============================================================
#  ROUTE: GET /classes
#  Returns list of all disease classes the model can detect
# ============================================================
@app.route("/classes", methods=["GET"])
def get_classes():
    """
    Returns the list of skin disease classes the model is trained on.
    Useful for the frontend to display labels.
    """
    from model_loader import CLASS_LABELS
    return jsonify({
        "classes": CLASS_LABELS,
        "total": len(CLASS_LABELS)
    }), 200


# ============================================================
#  OPENAI STREAMING HELPERS
# ============================================================
# Keywords that signal a harmful/diagnosis request
HARMFUL_KEYWORDS = [
    "diagnose", "diagnosis", "medical advice", "prescription",
    "prescribe", "cure", "disease treatment", "medication for",
    "medicine for", "drug for"
]

def get_system_prompt(lang="en"):
    lang_instruction = "Respond in Kannada." if lang == "kn" else "Respond in English."
    return f"""
IMPORTANT INSTRUCTION: {lang_instruction}

You are Twacha AI — a friendly, expert skincare assistant built into the Twacha skin health platform.

Your role:
- Help users understand skincare concepts and routines
- Explain common skin conditions (acne, eczema, rosacea, etc.) in simple language
- Guide users on how to use the Twacha app features (skin scan, doctor consultation, etc.)
- Provide general wellness and prevention tips

Formatting rules:
- Use bullet points and numbered steps where helpful
- Keep responses concise and easy to read (max 5-6 sentences or steps)
- Use section headers like **Causes:**, **Tips:**, **Steps:** when relevant
- Be warm, encouraging, and supportive

Strict safety rules (CRITICAL — never break these):
- NEVER make medical diagnoses or claim to diagnose any condition
- NEVER prescribe medications or suggest specific drugs
- If asked for a diagnosis or prescription, ALWAYS respond with:
  "⚠️ I can't provide medical diagnoses or prescriptions. Please consult a certified dermatologist for professional advice."
- Always clarify: "I'm an AI assistant, not a medical professional."
- Encourage users to use the Twacha scan feature and consult doctors within the app
"""


def stream_ai_response(user_message: str, history: list, lang: str = "en"):
    """Generator that yields OpenAI response chunks for streaming."""
    if openai_client is None:
        yield "OpenAI is not configured. Please add your OPENAI_API_KEY to the backend .env file."
        return

    # Check for harmful keywords (medical diagnosis)
    safe_msg = user_message.lower()
    if any(kw in safe_msg for kw in HARMFUL_KEYWORDS):
        yield "⚠️ I cannot provide medical diagnoses or prescriptions. Please use the Twacha Skin Scan feature or consult a certified dermatologist for professional medical advice."
        return

    system_prompt = get_system_prompt(lang)
    
    # Format history for OpenAI
    messages = [{"role": "system", "content": system_prompt}]
    for turn in history:
        if turn.get("user"):
            messages.append({"role": "user", "content": turn["user"]})
        if turn.get("ai"):
            messages.append({"role": "assistant", "content": turn["ai"]})
    
    messages.append({"role": "user", "content": user_message})

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=True
        )
        for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                yield content
    except Exception as e:
        error_str = str(e)
        print(f"[OpenAI] Streaming error: {error_str}")
        if "429" in error_str or "quota" in error_str.lower():
            yield "It looks like my AI brain has reached its free usage limit for today! Please check your OpenAI API key billing and quota details."
        else:
            yield f"Sorry, I encountered an error. Please try again. ({error_str[:80]})"


# ============================================================
#  ROUTE: POST /api/ai-stream
#  OpenAI streaming chat endpoint
# ============================================================
@app.route("/api/ai-stream", methods=["POST"])
def ai_stream():
    """
    Streams a response from the Gemini AI model.
    """
    data = request.json
    if not data or not data.get("message"):
        return jsonify({"error": "No message provided"}), 400

    user_message = data["message"].strip()
    history = data.get("history", [])
    lang = data.get("language", "en")

    safe_msg = user_message[:60].encode('ascii', 'replace').decode('ascii')
    print(f"[ai-stream] User: '{safe_msg}...' | History turns: {len(history)}")

    return Response(
        stream_ai_response(user_message, history, lang),
        mimetype="text/plain",
        headers={
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-cache"
        }
    )


# ============================================================
#  MAIN ENTRY POINT
# ============================================================
if __name__ == "__main__":
    # debug=True enables hot reload during development
    # host='0.0.0.0' makes the server accessible on the local network
    # port=5000 is the default Flask port
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
