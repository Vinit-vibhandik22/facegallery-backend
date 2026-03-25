from deepface import DeepFace
import os
import numpy as np

# This script forces DeepFace to download the model weights during the Docker build process
# so they are baked into the image.

def pre_download():
    print("[ClustR AI] Pre-downloading model weights...")
    
    # Create a dummy image (black square)
    dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
    
    try:
        # Force model loading and weight download
        # Facenet512 for embeddings
        # MTCNN for detection
        print("Loading Facenet512 and MTCNN...")
        DeepFace.represent(
            img_path=dummy_img,
            model_name="Facenet512",
            detector_backend="mtcnn",
            enforce_detection=False
        )
        print("[ClustR AI] Successfully pre-downloaded weights for Facenet512 and MTCNN.")
    except Exception as e:
        print(f"[ClustR AI] Warning: Pre-download failed: {e}")

if __name__ == "__main__":
    pre_download()
