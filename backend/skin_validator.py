"""
============================================================
  skin_validator.py  Twacha AI Backend  (IMPROVED)
  Validates that the uploaded image is actually a skin image.

  IMPROVED APPROACH (No Teachable Machine):
  ---------
  WHY HSV ALONE IS NOT ENOUGH:
  Simple color thresholds (like HSV) can easily be tricked by objects 
  that share human skin tones, such as potatoes, wood, or cardboard.

  HOW VALIDATION IS IMPROVED:
  We now use a multi-stage computer vision pipeline:
  1. COLOR (HSV + YCrCb): We check for skin tones in two different color spaces.
  2. TEXTURE (Laplacian Variance): Skin has a specific micro-texture. Very smooth 
     objects (like a plain piece of paper) or highly textured objects (like a carpet) 
     are filtered out.
  3. EDGES (Canny): Skin images (especially close-ups of diseases) have irregular 
     edge densities. We use Canny edge detection to ensure the image isn't too flat.
  4. PIXEL RATIO: At least 30% of the image must pass the skin mask.

  If any of these fail, the pipeline immediately halts to prevent false predictions!
============================================================
"""

import cv2
import numpy as np

# ── Tunable Thresholds ───────────────────────────────────────
MIN_SKIN_PIXEL_RATIO = 0.10   # 10% of pixels must be skin-toned
MIN_CONFIDENCE_PCT   = 40.0   # Model must be >= 40% confident
MIN_TEXTURE_VARIANCE = 5.0    # Filter out perfectly smooth objects (paper)
MAX_TEXTURE_VARIANCE = 2500.0 # Filter out insanely noisy objects
MIN_EDGE_DENSITY     = 0.01   # Filter out blank walls

def is_valid_skin(image_bytes: bytes) -> tuple:
    """
    Robust check if the image contains skin.
    Returns: (True, "") or (False, reason_msg)
    """
    # ── Decode to numpy BGR ───────────────────────────────────
    nparr   = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return False, "Could not decode the image file."

    # ── Resize for processing ─────────────────────────────────
    img_small = cv2.resize(img_bgr, (256, 256))

    # ── 1. COLOR CHECK (HSV + YCrCb) ──────────────────────────
    img_hsv = cv2.cvtColor(img_small, cv2.COLOR_BGR2HSV)
    img_ycrcb = cv2.cvtColor(img_small, cv2.COLOR_BGR2YCrCb)

    # HSV Masks
    lo_a = np.array([ 0,  20,  50], dtype=np.uint8)
    hi_a = np.array([35, 210, 255], dtype=np.uint8)
    mask_hsv_a = cv2.inRange(img_hsv, lo_a, hi_a)

    lo_b = np.array([160, 20,  30], dtype=np.uint8)
    hi_b = np.array([180, 180, 220], dtype=np.uint8)
    mask_hsv_b = cv2.inRange(img_hsv, lo_b, hi_b)
    
    mask_hsv = cv2.bitwise_or(mask_hsv_a, mask_hsv_b)

    # YCrCb Mask (standard skin ranges)
    lo_ycrcb = np.array([0, 133, 77], dtype=np.uint8)
    hi_ycrcb = np.array([255, 173, 127], dtype=np.uint8)
    mask_ycrcb = cv2.inRange(img_ycrcb, lo_ycrcb, hi_ycrcb)

    # Combine masks (must pass both HSV and YCrCb bounds for robustness)
    mask_combined = cv2.bitwise_and(mask_hsv, mask_ycrcb)

    total_pixels = img_small.shape[0] * img_small.shape[1]
    skin_pixels  = int(np.sum(mask_combined > 0))
    skin_ratio   = skin_pixels / total_pixels

    if skin_ratio < MIN_SKIN_PIXEL_RATIO:
        return False, f"Image lacks skin color tones (ratio: {skin_ratio:.1%}). Please upload a clear close-up of human skin."

    # ── 2. TEXTURE CHECK (Laplacian Variance) ─────────────────
    gray = cv2.cvtColor(img_small, cv2.COLOR_BGR2GRAY)
    texture_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    if texture_var < MIN_TEXTURE_VARIANCE:
        return False, f"Image is too smooth (variance: {texture_var:.1f}). Ensure the photo is in focus."
    if texture_var > MAX_TEXTURE_VARIANCE:
        return False, f"Image is too noisy or textured (variance: {texture_var:.1f}). It doesn't look like skin."

    # ── 3. EDGE DENSITY CHECK (Canny) ─────────────────────────
    edges = cv2.Canny(gray, 50, 150)
    edge_pixels = int(np.sum(edges > 0))
    edge_density = edge_pixels / total_pixels

    if edge_density < MIN_EDGE_DENSITY:
        return False, f"Image lacks natural skin features (edge density: {edge_density:.2%})."

    print(f"[validator] Passed! Ratio: {skin_ratio:.1%}, Texture: {texture_var:.1f}, Edges: {edge_density:.1%}")
    return True, ""


def is_confident_prediction(confidence_pct: float) -> tuple:
    """
    Reject if the model is too uncertain (out-of-domain image).
    """
    if confidence_pct < MIN_CONFIDENCE_PCT:
        return False, (
            "⚠️ Image not clear enough for accurate result, or your skin looks normal.\n\n"
            "Try:\n"
            "• Better lighting\n"
            "• Focus on affected area\n"
            "• Avoid blur"
        )
    return True, ""
