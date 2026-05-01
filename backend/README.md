# 🧠 Twacha AI — Python Backend (Explainable Skin Disease Classifier)

A **hackathon-ready** backend that classifies skin diseases from images using a **fine-tuned MobileNetV2 CNN** and explains predictions with **Grad-CAM** heatmaps.

---

## 📁 File Structure

```
backend/
├── app.py            # Main Flask server (entry point)
├── model_loader.py   # Builds/loads MobileNetV2 model
├── predictor.py      # Image preprocessing + inference
├── gradcam.py        # Grad-CAM heatmap generation
├── fine_tune.py      # (Optional) Fine-tune on your dataset
├── requirements.txt  # Python dependencies
└── README.md         # This file
```

---

## 🚀 Quick Start

### 1. Create and activate a virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> ⚠️ TensorFlow installation may take a few minutes. Requires Python 3.9–3.11.

### 3. Run the server

```bash
python app.py
```

You should see:
```
============================================================
  Twacha AI Backend — Starting up...
============================================================
[model_loader] Building MobileNetV2 model...
[model_loader] Last conv layer: 'Conv_1'
  Server ready at http://localhost:5000
============================================================
```

---

## 📡 API Endpoints

### `GET /health`
Check if the server is alive.

**Response:**
```json
{
  "status": "ok",
  "message": "Twacha AI backend is running!",
  "model_loaded": true,
  "last_conv_layer": "Conv_1"
}
```

---

### `POST /predict`
Upload a skin image → get prediction + Grad-CAM heatmap.

**Request:** `multipart/form-data`
| Key | Type | Description |
|-----|------|-------------|
| `file` | File | Image file (JPEG, PNG, WEBP) |

**Response:**
```json
{
  "class": "Eczema",
  "confidence": "87.43",
  "heatmap_image": "/9j/4AAQSkZJRgABAQAA...",
  "all_predictions": [
    { "className": "Eczema", "probability": 0.8743 },
    { "className": "Melanoma", "probability": 0.0612 },
    ...
  ]
}
```

> `heatmap_image` is a **base64-encoded JPEG string**. Display with:
> ```html
> <img src="data:image/jpeg;base64,{heatmap_image}" />
> ```

---

### `GET /classes`
Returns all detectable skin condition classes.

**Response:**
```json
{
  "classes": ["Eczema", "Melanoma", "Atopic Dermatitis", "BCC", "Melanoma Nevi", "BKL"],
  "total": 6
}
```

---

## 🔬 Testing with Postman

1. Open Postman
2. Create a new **POST** request
3. URL: `http://localhost:5000/predict`
4. Go to **Body** → **form-data**
5. Add a key: `file` → change type to **File**
6. Upload any skin image
7. Click **Send**

You'll receive the prediction JSON with the base64 heatmap image.

---

## 🧩 Testing with cURL

```bash
curl -X POST http://localhost:5000/predict \
  -F "file=@/path/to/skin_image.jpg"
```

---

## 🎨 How Grad-CAM Works (Presentation Summary)

> **"Which part of the image made the AI decide this?"**

| Step | What Happens |
|------|-------------|
| 1. Forward Pass | Image goes through CNN → last conv layer produces feature maps |
| 2. Gradient Computation | GradientTape records: **how does changing each pixel affect the class score?** |
| 3. Global Average Pooling | Average gradients across space → one weight per feature map |
| 4. Weighted Sum | Multiply each feature map by its importance weight, sum together |
| 5. ReLU | Keep only features that POSITIVELY support the prediction |
| 6. Normalize + Colorize | Scale to [0,1] → apply COLORMAP_JET (red = important, blue = not) |
| 7. Overlay | Blend heatmap over original image at 40% opacity |

**The result:** A visual explanation of WHERE in the image the AI was looking — critical for medical AI trust.

---

## 🏋️ Training Your Own Model (Optional)

If you have a labeled dataset of skin images:

```
dataset/
  train/
    Eczema/       ← 500+ images
    Melanoma/     ← 500+ images
    ...
  val/
    Eczema/       ← 100+ images
    ...
```

Run:
```bash
python fine_tune.py --data_dir ./dataset --epochs 20
```

This saves `twacha_skin_model.h5`, which `app.py` automatically loads on next startup.

---

## 🔗 Connecting to the React Frontend

In your React `Scan.jsx`, replace the TensorFlow.js inference with a fetch call:

```javascript
const response = await fetch("http://localhost:5000/predict", {
  method: "POST",
  body: formData,  // FormData with the image file
});
const data = await response.json();

// data.class       → "Eczema"
// data.confidence  → "87.43"
// data.heatmap_image → base64 string → display as <img>
// data.all_predictions → array for bar chart
```

---

## ⚙️ Environment Notes

| Requirement | Version |
|-------------|---------|
| Python | 3.9 – 3.11 |
| TensorFlow | 2.16.1 |
| Flask | 3.0.3 |
| OpenCV | 4.9.0 |

> On Windows with GPU: Install `tensorflow-gpu` instead and install CUDA Toolkit 11.8.

---

## 🏆 Hackathon Talking Points

- **Transfer Learning**: MobileNetV2 was pre-trained on 1.2M ImageNet images — we leverage those visual features for skin analysis.
- **Explainability**: Grad-CAM makes the AI "show its work" — essential for medical AI credibility.
- **Modular Design**: `model_loader`, `predictor`, `gradcam` are independent modules — easy to swap model or explanation method.
- **REST API**: Any frontend (React, mobile app, Postman) can query the backend.
