# Global Features Reference

## Table Stakes (Must-Have)
- **Face Detection**: MTCNN/RetinaFace for reliable face bounding boxes.
- **Embedding Extraction**: FaceNet512 for high-rank (512D) unique vector representation.
- **Automatic Grouping**: Agglomerative clustering (no manual assignment).
- **Cluster Integrity**: Distinct cluster separation (Person A != Person B).

## Differentiators (Competitive Advantage)
- **Zero-fragment Clustering**: Single-person affinity (Person A = Person A across all angles).
- **Post-Clustering Merge**: An extra pass that calculates cluster centroids and merges those meeting a similarity threshold to fix minor fragmentation.

## Anti-features (What NOT to build)
- **Manual "Merge clusters" UI**: Goal is for the system to be smart enough correctly group photos without user intervention.
- **Client-Side Heavy Lifting**: All clustering math done on the CPU/Memory of the Hugging Face Space.
