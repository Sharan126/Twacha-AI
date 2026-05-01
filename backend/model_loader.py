"""
============================================================
  model_loader.py — Twacha AI Backend  (FIXED)
  Loads / builds the MobileNetV2 skin-disease classifier.
============================================================
"""

import os
import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import MobileNetV2

# ── Disease class labels (must match training folder names) ──────────────────
CLASS_LABELS = [
    "Eczema",
    "Melanoma",
    "Atopic Dermatitis",
    "Basal Cell Carcinoma (BCC)",
    "Melanoma Nevi",
    "Benign Keratosis (BKL)"
]

IMAGE_SIZE      = (224, 224)
NUM_CLASSES     = len(CLASS_LABELS)
SAVED_MODEL_PATH = "twacha_skin_model.h5"


def build_model() -> Model:
    """
    Build a MobileNetV2-based classifier.

    Architecture:
      Input(224,224,3) → MobileNetV2(frozen) → GlobalAvgPool
      → Dense(128, ReLU) → Dropout(0.4) → Dense(6, Softmax)
    """
    print("[model_loader] Building MobileNetV2 model …")

    base = MobileNetV2(
        input_shape=(*IMAGE_SIZE, 3),
        include_top=False,
        weights="imagenet"
    )
    base.trainable = False   # freeze for demo; unfreeze top layers when fine-tuning

    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3))
    x      = base(inputs, training=False)
    x      = layers.GlobalAveragePooling2D()(x)
    x      = layers.Dense(128, activation="relu")(x)
    x      = layers.Dropout(0.4)(x)
    outputs = layers.Dense(NUM_CLASSES, activation="softmax")(x)

    model = Model(inputs, outputs, name="TwachaAI_SkinClassifier")
    model.compile(optimizer="adam",
                  loss="categorical_crossentropy",
                  metrics=["accuracy"])

    print(f"[model_loader] Model built — {NUM_CLASSES} output classes.")
    return model


def load_model() -> Model:
    """Load fine-tuned weights if available, else use the demo model."""
    if os.path.exists(SAVED_MODEL_PATH):
        print(f"[model_loader] Loading saved model: {SAVED_MODEL_PATH}")
        model = tf.keras.models.load_model(SAVED_MODEL_PATH)
        print("[model_loader] Saved model loaded successfully.")
    else:
        print("[model_loader] No saved model found — using ImageNet demo weights.")
        model = build_model()
    return model


def get_last_conv_layer_name(model: Model) -> str:
    """
    Return the name of the last Conv2D layer.

    Searches the model's own layers first, then recurses into any
    nested sub-model (e.g. MobileNetV2) so that gradcam.py can
    locate the layer correctly.
    """
    # Search direct layers (flat models)
    for lyr in reversed(model.layers):
        if isinstance(lyr, layers.Conv2D):
            print(f"[model_loader] Last conv layer (direct): '{lyr.name}'")
            return lyr.name

    # Search inside the first nested sub-model
    for lyr in model.layers:
        if isinstance(lyr, Model):
            for sub in reversed(lyr.layers):
                if isinstance(sub, layers.Conv2D):
                    print(f"[model_loader] Last conv layer (in '{lyr.name}'): '{sub.name}'")
                    return sub.name

    raise ValueError("[model_loader] No Conv2D layer found in the model!")
