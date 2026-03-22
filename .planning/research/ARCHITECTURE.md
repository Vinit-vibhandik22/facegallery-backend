# Architecture Patterns

## Recommended Workflow
1. **Identification Phase**:
   - Detect faces with MTCNN/RetinaFace on the uploaded photo.
   - Crop and extract 512D embeddings using FaceNet512.
2. **First-Pass Clustering**:
   - Use `scikit-learn` `AgglomerativeClustering`.
   - Metric: `cosine`. Linkage: `average`.
3. **Refinement Phase (Post-processing Merge)**:
   - For every cluster, calculate the centroid of all embeddings.
   - For every pair of cluster centroids, calculate cosine distance.
   - If distance <= threshold (0.35-0.4), merge clusters C1 and C2.
4. **Resolution Phase**:
   - Assign final labels to each face box.
   - Return group list to Next.js via `/analyze-photo` or `/re-sort-all`.

## Component Boundaries
- **FastAPI**: Main orchestrator of the detection and clustering pipeline.
- **Scikit-learn**: Performs the heavy numeric clustering logic.
- **Supabase**: Final persistence of labeled faces and photo-to-cluster mapping.
- **Next.js**: Visual display and status updates for the user.
