# Research Summary

## Key Findings
- **Stack**: `scikit-learn` with `AgglomerativeClustering`.
- **Metric**: Use `cosine` distance for FaceNet512 results.
- **Linkage**: Use `average` linkage to handle facial variation (profiles, etc.) without over-splitting.
- **Post-Processor**: Add a centroid-based merge step to unify clusters meeting a 0.35-0.4 threshold.
- **Accuracy**: Complete linkage (current) is the likely source of fragmentation.

## Next Steps
1. **Define Requirements**: Solidify the clustering logic v1 in `REQUIREMENTS.md`.
2. **Phase Breakdown**: Map out the backend changes (linkage, metric, post-processor) and frontend display updates in `ROADMAP.md`.

*Last updated: 2026-03-22 after Project Research*
