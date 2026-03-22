# Phase 2 Research: Refinement Engine

## Strategy
Implement a post-clustering refinement step in the Python backend. While **Average Linkage** (Phase 1) is significantly better than Complete Linkage, a centroid-based merge pass can further unify clusters that the initial Agglomerative pass missed—especially when handling variations like lighting or slight profile views where the entire group doesn't satisfy the average link threshold.

## Centroid-Based Merging
- **Logic**:
  1. For each cluster produced by the first pass, calculate its **Centroid** (mean of all embeddings in that cluster).
  2. Perform a second clustering pass (or greedy merge) on these centroids.
  3. If two centroids are closer than a separate `refinement_threshold` (e.g., `0.3-0.4` for Cosine), merge their respective clusters.
- **Why it works**: Centroids represent the "average" face of a cluster, smoothing out noise and individual embedding fluctuations.

## Implementation Details
- **Tool**: Manual centroid calculation + `sklearn.cluster.AgglomerativeClustering` or a simpler distance matrix merge.
- **Threshold**: Needs to be slightly more lenient/conservative than the initial pass to avoid merging distinct people. 
- **Efficiency**: Since N (number of clusters) is much smaller than N (number of faces), this pass is very fast.

## Proposed API Enhancement
Modify `/cluster-faces` or add a refinement logic within it to automatically perform this second pass before returning results.

## Decision
Incorporate the refinement step directly into the backend `/cluster-faces` pipeline as an optional parameter `refine=true`. This keeps the API clean and the logic centralized.
