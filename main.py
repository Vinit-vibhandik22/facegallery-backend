import os
import io
import base64
import cv2
import numpy as np
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
from sklearn.cluster import AgglomerativeClustering

# Suppress TF logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3" 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
async def root():
    return {"status": "ok", "service": "FaceGallery AI Engine"}

@app.get("/health")
async def health():
    return {"status": "ready"}

def extract_face_thumbnail(img, x, y, w, h, size=150):
    # original image might be BGR, so keep that in mind
    pad = int(min(w, h) * 0.3)
    sy = max(0, y - pad)
    sx = max(0, x - pad)
    ey = min(img.shape[0], y + h + pad)
    ex = min(img.shape[1], x + w + pad)
    face_img = img[sy:ey, sx:ex]
    
    if face_img.size == 0:
        return ""
    
    face_img = cv2.resize(face_img, (size, size))
    # encode as jpeg
    success, buffer = cv2.imencode('.jpg', face_img, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    if not success:
        return ""
        
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

@app.post("/analyze-photo")
async def analyze_photo(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        # DeepFace expects BGR for CV2 format
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file or format")

        h, w = img.shape[:2]
        max_dim = 1600
        scale = 1.0
        
        if h > max_dim or w > max_dim:
            scale = max_dim / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            img_resized = cv2.resize(img, (new_w, new_h))
        else:
            img_resized = img

        # Facenet512 provides extremely robust 512D embeddings (>99.6% accuracy LFW)
        # mtcnn provides highly reliable face detection
        try:
            faces_data = DeepFace.represent(img_path=img_resized,
                                            model_name="Facenet512",
                                            detector_backend="mtcnn",
                                            enforce_detection=True)
        except Exception as e:
            # DeepFace throws ValueError if enforce_detection=True and no faces found
            # Sometimes exceptions contain emojis (e.g. gdown errors) which crash Windows console `print`
            err_str = str(e).encode('ascii', 'ignore').decode('ascii')
            print(f"[FaceGallery Backend] No faces found in {file.filename} (or detection error): {err_str}")
            faces_data = []
        
        detected_faces = []
        for face in faces_data:
            # Default confidence to 1.0 if not provided
            confidence = face.get("face_confidence", 1.0)
                
            emb = face["embedding"]
            box = face["facial_area"]
            
            x = int(box["x"] / scale)
            y = int(box["y"] / scale)
            bw = int(box["w"] / scale)
            bh = int(box["h"] / scale)
            
            thumb = extract_face_thumbnail(img, x, y, bw, bh)
            
            detected_faces.append({
                "embedding": emb,
                "bbox": {"x": x, "y": y, "width": bw, "height": bh},
                "confidence": confidence,
                "thumbnailDataUrl": thumb
            })

        print(f"[FaceGallery Backend] Processed {file.filename}: found {len(detected_faces)} faces")

        return {
            "width": w,
            "height": h,
            "faces": detected_faces
        }
    except Exception as e:
        print(f"[FaceGallery Backend] Error processing {file.filename}: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"width": 0, "height": 0, "faces": []}

def refine_labels_by_centroids(embeddings: np.ndarray, labels: List[int], threshold: float = 0.35):
    """
    Post-process labels by merging clusters whose centroids are within threshold.
    Uses Cosine distance to identify similar centroids.
    """
    labels_np = np.array(labels)
    unique_labels = [l for l in np.unique(labels_np) if l >= 0]
    
    if len(unique_labels) <= 1:
        return labels, len(unique_labels)
        
    # Calculate centroids
    centroids = []
    for l in unique_labels:
        mask = labels_np == l
        cluster_embeddings = embeddings[mask]
        centroid = np.mean(cluster_embeddings, axis=0)
        # Re-normalize centroid to unit length for cosine distance
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm
        centroids.append(centroid)
        
    centroids_np = np.array(centroids)
    
    # Second pass: Cluster the centroids themselves
    # If two centroids are close, we merge their entire clusters.
    refine_clustering = AgglomerativeClustering(
        n_clusters=None,
        metric='cosine',
        linkage='average',
        distance_threshold=threshold
    )
    
    centroid_labels = refine_clustering.fit_predict(centroids_np)
    
    # Map old labels to refined labels
    old_to_refined = {old: new for old, new in zip(unique_labels, centroid_labels)}
    
    refined_labels_raw = [old_to_refined[l] if l >= 0 else -1 for l in labels]
    
    # Re-sequentialize final labels (0, 1, 2...)
    final_unique = sorted([l for l in set(refined_labels_raw) if l >= 0])
    final_map = {old: i for i, old in enumerate(final_unique)}
    final_labels = [final_map[l] if l >= 0 else -1 for l in refined_labels_raw]
    
    return final_labels, len(final_unique)

@app.post("/cluster-faces")
async def cluster_faces(
    embeddings: List[List[float]], 
    epsilon: float = Query(0.35), 
    min_points: int = Query(1), 
    linkage: str = Query("average"),
    refine: bool = Query(True)
):
    """
    Perform Agglomerative Clustering on face embeddings.
    Default: Average Linkage + Cosine Distance (0.35 threshold).
    """
    try:
        if not embeddings:
            return {"labels": [], "cluster_count": 0, "noise_indices": []}

        X = np.array(embeddings)
        
        # Agglomerative clustering with cosine distance and average linkage
        # distance_threshold is epsilon in scikit-learn when n_clusters=None
        clustering = AgglomerativeClustering(
            n_clusters=None,
            metric='cosine',
            linkage=linkage,
            distance_threshold=epsilon
        )
        
        raw_labels = clustering.fit_predict(X)
        
        # Post-process for min_points (noise handling)
        unique, counts = np.unique(raw_labels, return_counts=True)
        counts_dict = dict(zip(unique, counts))
        
        labels = []
        noise_indices = []
        
        # Map raw labels to sequential cluster IDs, filtering for noise
        label_map = {}
        next_id = 0
        
        for i, raw_label in enumerate(raw_labels):
            if counts_dict[raw_label] >= min_points:
                if raw_label not in label_map:
                    label_map[raw_label] = next_id
                    next_id += 1
                labels.append(label_map[raw_label])
            else:
                labels.append(-1)
                noise_indices.append(i)
        
        # --- PHASE 2: REFINEMENT ENGINE ---
        final_labels = labels
        final_cluster_count = next_id
        
        if refine and next_id > 1:
            print(f"[FaceGallery Backend] Running centroid-based refinement pass...")
            # Use same epsilon or dedicated refine_epsilon if provided
            final_labels, final_cluster_count = refine_labels_by_centroids(
                X, labels, threshold=epsilon
            )
            print(f"[FaceGallery Backend] Refinement: {next_id} -> {final_cluster_count} clusters")

        return {
            "labels": final_labels,
            "clusterCount": final_cluster_count,
            "noiseIndices": noise_indices
        }
    except Exception as e:
        print(f"[FaceGallery Backend] Clustering error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting FaceGallery Python Backend on port 8000...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
