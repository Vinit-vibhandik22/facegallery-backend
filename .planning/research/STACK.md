# Ecosystem Stack

## Recommended Components
- **Framework**: `scikit-learn` for AgglomerativeClustering.
- **Metric**: `cosine` distance for better stability on L2-normalized embeddings.
- **Linkage**: `average` linkage to handle facial variation (different angles/lighting) without over-fragmenting people.
- **Threshold**: Standard range for FaceNet512 + Cosine is `0.35` to `0.45`, but needs dynamic testing per image set.

## What NOT to use
- **Euclidean (unnormalized)**: Distances can vary wildly with lighting.
- **Complete Linkage**: Too sensitive to outliers and edge cases (causes the splitting problem).
- **HDBSCAN**: More complex to calibrate for simple face grouping v1 (deferred).

## Rationale
Average linkage considers all pairwise distances between clusters, reducing the "split identity" problem where a profile-view photo doesn't perfectly match a front-view photo of the same person.
