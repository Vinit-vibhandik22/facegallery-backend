# Phase 1 Research: Clustering Core

## Strategy
Switch from TypeScript-based `dbscan` (currently manual Agglomerative with Complete linkage) to high-performance `scikit-learn` in the Python backend. Use **Average Linkage** and **Cosine Distance** to handle facial variation (angles, lighting) without splitting a single person into multiple clusters.

## Implementation Details
- **Tool**: `sklearn.cluster.AgglomerativeClustering`.
- **Metric**: `cosine`.
- **Linkage**: `average`.
- **Model Compatibility**: FaceNet512 results are L2-normalized.
- **Threshold Calibration**:
  - Native threshold for FaceNet512 + Cosine (DeepFace standard) is `0.3`.
  - User's previous threshold was `0.85` Euclidean L2 (equivalent to `~0.36` Cosine).
  - Target: **0.35 to 0.4** to minimize over-splitting while maintaining separation.

## Proposed API Endpoint: `/cluster`
Move clustering from the Next.js dashboard to a dedicated backend endpoint.
- **Input**: A list of 512D embeddings.
- **Output**: Cluster labels for each embedding.

## Potential Pitfalls
1. **Memory Usage**: For very large datasets (e.g. 5,000+ faces in a project), `AgglomerativeClustering` will require O(N^2) memory for the link matrix. This should be fine within Hugging Face Spaces for typical event photo counts (500-2,000 faces).
2. **Normalized Hypersphere**: Cosine distance is ideal for high-dimensional embeddings as it focuses on the angular difference, ignoring magnitude noise.

## Recommendation
Transition `python_backend/main.py` to include a `/cluster` endpoint using `sklearn`. This consolidates the ML logic and prepares for the Phase 2 post-processing pass.
