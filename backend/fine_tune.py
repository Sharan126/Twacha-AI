"""
============================================================
  fine_tune.py — Twacha AI Backend
  Script to fine-tune MobileNetV2 on your skin disease dataset.
  Run ONCE to train and save the model before starting the server.

  Usage:
    python fine_tune.py --data_dir ./dataset --epochs 20
============================================================

  DATASET FOLDER STRUCTURE EXPECTED:
    dataset/
      train/
        Eczema/          ← folder name = class label
          img001.jpg
          img002.jpg
        Melanoma/
          img001.jpg
          ...
      val/
        Eczema/
          img001.jpg
        ...

  AFTER TRAINING:
    A file 'twacha_skin_model.h5' is saved.
    app.py will automatically load this file on startup.
============================================================
"""

import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import argparse
import os

from model_loader import build_model, IMAGE_SIZE, SAVED_MODEL_PATH, NUM_CLASSES


def train(data_dir: str, epochs: int = 20, batch_size: int = 32):
    """
    Fine-tune MobileNetV2 on the skin disease dataset.

    Phase 1: Train only the classification head (base model frozen)
    Phase 2: Unfreeze top layers of MobileNetV2 and fine-tune together
    """

    train_dir = os.path.join(data_dir, "train")
    val_dir = os.path.join(data_dir, "val")

    if not os.path.exists(train_dir):
        raise FileNotFoundError(f"Training directory not found: {train_dir}")

    print(f"\n[fine_tune] Loading dataset from: {data_dir}")

    # ── Data Augmentation ──────────────────────────────────────
    # Augmentation artificially increases dataset size and variety.
    # We apply random flips, rotations, zooms, and brightness changes.
    # This makes the model more robust to real-world variation.
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255.0,         # Normalize to [0, 1]
        rotation_range=20,            # Random rotation ±20°
        width_shift_range=0.15,       # Horizontal shift
        height_shift_range=0.15,      # Vertical shift
        horizontal_flip=True,         # Mirror images
        zoom_range=0.15,              # Zoom in/out
        brightness_range=[0.8, 1.2],  # Brightness variation
        fill_mode="nearest"           # Fill empty pixels
    )

    # Validation data: only normalize, NO augmentation
    val_datagen = ImageDataGenerator(rescale=1.0 / 255.0)

    # Load images from folders — folder names become class labels
    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=IMAGE_SIZE,
        batch_size=batch_size,
        class_mode="categorical"
    )

    val_generator = val_datagen.flow_from_directory(
        val_dir,
        target_size=IMAGE_SIZE,
        batch_size=batch_size,
        class_mode="categorical"
    )

    print(f"[fine_tune] Classes found: {train_generator.class_indices}")
    print(f"[fine_tune] Training samples: {train_generator.n}")
    print(f"[fine_tune] Validation samples: {val_generator.n}")

    # ── Build Model ────────────────────────────────────────────
    model = build_model()

    # ── Callbacks ─────────────────────────────────────────────
    callbacks = [
        # Save the best model based on validation accuracy
        ModelCheckpoint(
            filepath=SAVED_MODEL_PATH,
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1
        ),
        # Stop early if val_loss doesn't improve for 5 epochs
        EarlyStopping(
            monitor="val_loss",
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        # Reduce learning rate if plateau detected
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        )
    ]

    # ── PHASE 1: Train Classification Head Only ────────────────
    print("\n[fine_tune] === PHASE 1: Training classification head ===")
    model.fit(
        train_generator,
        epochs=epochs // 2,
        validation_data=val_generator,
        callbacks=callbacks,
        verbose=1
    )

    # ── PHASE 2: Unfreeze Top Layers for Fine-tuning ──────────
    # Unfreeze the last 30 layers of the MobileNetV2 base
    # and fine-tune with a lower learning rate
    print("\n[fine_tune] === PHASE 2: Fine-tuning top MobileNetV2 layers ===")
    base_model_layer = model.layers[1]  # The MobileNetV2 sub-model
    base_model_layer.trainable = True

    # Freeze all layers EXCEPT the last 30
    for layer in base_model_layer.layers[:-30]:
        layer.trainable = False

    # Recompile with a smaller learning rate for fine-tuning
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    model.fit(
        train_generator,
        epochs=epochs // 2,
        validation_data=val_generator,
        callbacks=callbacks,
        verbose=1
    )

    print(f"\n[fine_tune] ✅ Training complete! Model saved to: {SAVED_MODEL_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune MobileNetV2 for skin disease classification.")
    parser.add_argument("--data_dir", type=str, default="./dataset", help="Path to dataset directory")
    parser.add_argument("--epochs", type=int, default=20, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    args = parser.parse_args()

    train(
        data_dir=args.data_dir,
        epochs=args.epochs,
        batch_size=args.batch_size
    )
