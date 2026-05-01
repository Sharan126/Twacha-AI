"""
============================================================
  gradcam.py  Twacha AI Backend  (FIXED)
  Implements Grad-CAM for MobileNetV2 nested inside an outer model.

  HOW GRAD-CAM WORKS (Simple Explanation for Judges):
  
  1. FORWARD PASS  : Image  CNN  feature maps at last conv layer.
  2. ASK "WHY?"   : Use GradientTape to compute how much each spatial
                    location in the last conv layer influenced the final
                    predicted class score (gradient of class w.r.t. feature maps).
  3. POOL          : Average the gradients spatially  one importance
                    weight per feature-map channel.
  4. WEIGHTED SUM  : Multiply each channel's feature map by its weight,
                    sum  a single saliency map.
  5. ReLU          : Keep only positive influences (suppress negatives).
  6. COLORISE      : Normalise  apply JET colormap (red = important).
  7. OVERLAY       : Blend 60% original + 40% heatmap.
============================================================
"""

import numpy as np
import tensorflow as tf
import cv2
import base64
from PIL import Image
import io


def generate_gradcam(
    model: tf.keras.Model,
    image_array: np.ndarray,
    last_conv_layer_name: str,
    class_index: int
) -> str:
    """
    Generate a Grad-CAM heatmap overlaid on the input image.

    Args:
        model                : Full Keras model
        image_array          : Preprocessed (1, 224, 224, 3) float32 in [0,1]
        last_conv_layer_name : Name of last Conv2D (inside MobileNetV2 sub-model)
        class_index          : Predicted class index

    Returns:
        Base64-encoded JPEG string of the heatmap overlay.
    """

    #  Build a grad-model that produces TWO outputs in ONE forward pass 
    # Both outputs must share the same computation graph so GradientTape can
    # differentiate final_predictions w.r.t. conv_outputs.
    grad_model = _build_grad_model(model, last_conv_layer_name)

    #  GradientTape: record operations during forward pass 
    with tf.GradientTape() as tape:
        image_tensor = tf.cast(image_array, tf.float32)
        # Single forward pass  (conv feature maps, final class probabilities)
        conv_outputs, predictions = grad_model(image_tensor, training=False)
        # Score for the predicted class only (scalar)
        class_score = predictions[:, class_index]

    #  Gradients of class score w.r.t. each conv feature map location 
    # Shape: (1, H, W, Filters)
    grads = tape.gradient(class_score, conv_outputs)

    #  Global Average Pool  one importance weight per channel 
    # Shape: (Filters,)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    #  Weighted sum of feature maps 
    conv_outputs = conv_outputs[0]  # Remove batch dim  (H, W, Filters)
    # Multiply each channel by its importance weight and sum  (H, W)
    heatmap = tf.reduce_sum(conv_outputs * pooled_grads, axis=-1)

    #  ReLU: keep only features that positively drive the prediction 
    heatmap = tf.nn.relu(heatmap).numpy()

    #  Normalise to [0, 1] 
    max_val = np.max(heatmap)
    heatmap = heatmap / (max_val + 1e-8)   # avoid division by zero

    #  Resize to input image size 
    heatmap_resized = cv2.resize(heatmap, (224, 224))

    #  Apply JET colormap (0blue, 0.5green, 1red) 
    heatmap_uint8  = np.uint8(255 * heatmap_resized)
    colored        = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

    #  Overlay heatmap on original image 
    original = np.uint8(255 * image_array[0])      # floatuint8
    blended  = cv2.addWeighted(original, 0.6, colored, 0.4, 0)

    #  Encode to Base64 JPEG 
    blended_rgb = cv2.cvtColor(blended, cv2.COLOR_BGR2RGB)
    pil_img     = Image.fromarray(blended_rgb)
    buf         = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    print("[gradcam]  Heatmap generated.")
    return b64


#  Helpers 

def _build_grad_model(model: tf.keras.Model, last_conv_layer_name: str):
    """
    Build a model with TWO outputs that share a single forward pass:
      output_1 : activations of the last conv layer
      output_2 : final softmax predictions

    Works for both:
      a) flat models where the conv layer is a direct child
      b) nested models (e.g. MobileNetV2 wrapped inside an outer Keras Model)
    """

    #  Case A: conv layer is a direct layer in the outer model 
    direct = _find_direct_layer(model, last_conv_layer_name)
    if direct is not None:
        return tf.keras.Model(
            inputs=model.inputs,
            outputs=[direct.output, model.output]
        )

    #  Case B: conv layer is inside a sub-model (MobileNetV2) 
    base_model = _find_sub_model(model)
    if base_model is None:
        raise ValueError("[gradcam] Could not locate last conv layer or sub-model.")

    # Find the target conv layer inside the sub-model
    conv_layer = _find_direct_layer(base_model, last_conv_layer_name)
    if conv_layer is None:
        # Fallback: use the last Conv2D in the sub-model
        for lyr in reversed(base_model.layers):
            if isinstance(lyr, tf.keras.layers.Conv2D):
                conv_layer = lyr
                print(f"[gradcam] Fallback conv layer: '{lyr.name}'")
                break
    if conv_layer is None:
        raise ValueError(f"[gradcam] Layer '{last_conv_layer_name}' not found.")

    # Build inner model: sub-model-input  [conv_output, sub-model-output]
    # Both outputs share the SAME forward pass through sub-model layers,
    # so gradients will flow from sub-model-output back through conv_output.
    inner = tf.keras.Model(
        inputs=base_model.inputs,
        outputs=[conv_layer.output, base_model.output],
        name="inner_grad_model"
    )

    # Collect the classification-head layers that come AFTER the sub-model
    head_layers = _get_head_layers(model, base_model)

    # Build combined functional model:
    # outer-input  inner  [conv_out, base_out]  head  predictions
    outer_inp             = tf.keras.Input(shape=model.input_shape[1:])
    conv_out, base_out    = inner(outer_inp)
    x = base_out
    for lyr in head_layers:
        x = lyr(x)

    return tf.keras.Model(inputs=outer_inp, outputs=[conv_out, x])


def _find_direct_layer(model, name):
    """Return a layer by name if it is a direct (non-nested) child of model."""
    for lyr in model.layers:
        if lyr.name == name:
            return lyr
    return None


def _find_sub_model(model):
    """Return the first nested Keras Model found among the model's layers."""
    for lyr in model.layers:
        if isinstance(lyr, tf.keras.Model):
            return lyr
    return None


def _get_head_layers(outer_model, sub_model):
    """
    Return layers that come AFTER the sub-model in the outer model's layer list.
    These form the classification head (GlobalAvgPool, Dense, Dropout, ).
    """
    head, seen = [], False
    for lyr in outer_model.layers:
        if lyr is sub_model:
            seen = True
            continue
        if seen and not isinstance(lyr, tf.keras.layers.InputLayer):
            head.append(lyr)
    return head
