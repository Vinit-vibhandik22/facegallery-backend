# Common Pitfalls

## Avoid Fragmentation (Current Issue)
- **Problem**: Linkage is too rigid (Complete).
- **Prevention**: Use `average` linkage for better flexibility on variation.
- **Prevention**: Use a post-clustering merge step for fragment cleanup.

## False Positives (Over-merging)
- **Problem**: Threshold is too loose, merging distinct people (even strangers).
- **Prevention**: Use `average` linkage instead of `single` for robustness.
- **Prevention**: Threshold 0.35-0.4 for FaceNet512 results (Cosine). 

## Performance Bottlenecks
- **Problem**: Agglomerative clustering with 10k faces is O(N^2 log N).
- **Prevention**: Ensure distances are calculated via pre-computed matrix (vectorized scikit-learn approach).
- **Prevention**: Calculate centroids for the merge step instead of all inter-cluster pairs.

## Model Bias
- **Problem**: Profile shots and occluded faces have lower confidence.
- **Prevention**: Use `MTCNN` which is reliable for frontal and profile views.
- **Prevention**: Assign confidence scores to all detections to filter out garbage faces.
