import cv2
import numpy as np
from deepface import DeepFace

# create a dummy image
img = np.zeros((300, 300, 3), dtype=np.uint8)

try:
    results = DeepFace.represent(img_path=img, model_name="ArcFace", detector_backend="retinaface", enforce_detection=True)
    print("Found faces:", len(results))
    print(results)
except ValueError as e:
    print("No faces found handled correctly:", e)
