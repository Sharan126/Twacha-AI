"""
============================================================
  predictor.py  Twacha AI Backend
  Handles image preprocessing and model inference.
============================================================

  PIPELINE:
    1. Receive raw image bytes / PIL Image
    2. Resize to 224x224 (MobileNetV2 input requirement)
    3. Normalize pixel values to [0, 1]
    4. Run model.predict()  get softmax probabilities
    5. Pick the class with highest probability (argmax)
    6. Return class name + confidence score
============================================================
"""

import numpy as np
from PIL import Image
import io
from model_loader import CLASS_LABELS

#  Constants 
IMAGE_SIZE = (224, 224)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Convert raw image bytes into a preprocessed numpy array.

    Steps:
      1. Decode bytes  PIL Image (handles JPEG, PNG, WEBP, etc.)
      2. Convert to RGB (handles RGBA / grayscale images)
      3. Resize to 224x224 using Lanczos (high quality downscaling)
      4. Convert to float32 numpy array
      5. Normalize pixel values from [0, 255]  [0.0, 1.0]
      6. Add batch dimension: (224, 224, 3)  (1, 224, 224, 3)

    Args:
        image_bytes : Raw bytes of the uploaded image file.

    Returns:
        image_array : Shape (1, 224, 224, 3), dtype float32, values in [0, 1]
    """
    print("[predictor] Preprocessing image...")

    # Step 1 & 2: Decode and convert to RGB
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Step 3: Resize to model's expected input size
    image = image.resize(IMAGE_SIZE, Image.LANCZOS)

    # Step 4 & 5: Convert to float32 and normalize
    image_array = np.array(image, dtype=np.float32) / 255.0

    # Step 6: Add batch dimension (model expects batches of images)
    image_array = np.expand_dims(image_array, axis=0)  # (1, 224, 224, 3)

    print(f"[predictor] Image preprocessed. Shape: {image_array.shape}, Range: [{image_array.min():.2f}, {image_array.max():.2f}]")
    return image_array


def predict(model, image_array: np.ndarray) -> dict:
    """
    Run the model on a preprocessed image and return prediction results.

    Args:
        model        : Loaded Keras model
        image_array  : Preprocessed image (1, 224, 224, 3)

    Returns:
        dict with keys:
            'class_name'  : String  the predicted disease name
            'class_index' : Int  index of the predicted class
            'confidence'  : Float  confidence percentage (0-100)
            'all_scores'  : List of dicts with all class probabilities
    """
    print("[predictor] Running model inference...")

    #  Forward Pass 
    # model.predict() returns shape (1, NUM_CLASSES)  softmax probabilities
    predictions = model.predict(image_array, verbose=0)

    # predictions[0] is the single image's probability vector
    probabilities = predictions[0]   # Shape: (NUM_CLASSES,)

    #  Get the top prediction 
    # argmax finds the index of the highest probability
    predicted_index = int(np.argmax(probabilities))
    predicted_class = CLASS_LABELS[predicted_index]
    confidence = float(probabilities[predicted_index]) * 100  # Convert to percentage

    #  All class scores (useful for frontend bar charts) 
    all_scores = [
        {
            "class": CLASS_LABELS[i],
            "probability": float(probabilities[i]),
            "percentage": round(float(probabilities[i]) * 100, 2)
        }
        for i in range(len(CLASS_LABELS))
    ]
    # Sort by probability (highest first)
    all_scores.sort(key=lambda x: x["probability"], reverse=True)

    result = {
        "class_name": predicted_class,
        "class_index": predicted_index,
        "confidence": round(confidence, 2),
        "all_scores": all_scores
    }

    print(f"[predictor]  Prediction: '{predicted_class}' ({confidence:.1f}% confidence)")
    return result
