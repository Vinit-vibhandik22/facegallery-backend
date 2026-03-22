# Requirements: FaceGallery Accuracy Upgrade

**Defined:** 2026-03-22
**Core Value:** Zero-fragmentation face clustering — ensuring a single person consistently maps to a single cluster without manual intervention.

## v1 Requirements

### Clustering Engine
- [ ] **CLUS-01**: Update `AgglomerativeClustering` to use `average` linkage instead of `complete`.
- [ ] **CLUS-02**: Transition distance metric to `cosine` similarity for vector comparison.
- [ ] **CLUS-03**: Calibrate and lock the similarity threshold (target: `0.35` - `0.45` for FaceNet512).
- [ ] **CLUS-04**: Implement a post-processing merge step using cluster centroids to unify fragments.
- [ ] **CLUS-05**: Ensure "one-shot" clustering occurs entirely on the FastAPI backend.

### Integration
- [ ] **INTG-01**: Refactor `python_backend/main.py` processing pipeline to include the refinement pass.
- [ ] **INTG-02**: Maintain compatibility with existing Supabase schema for face and cluster storage.

### Verification
- [ ] **VERI-01**: Automated script validation using `test_thresholds.py` or equivalent to prove accuracy improvement.
- [ ] **VERI-02**: Manual verification in the Next.js Dashboard that a subject with multiple angles is correctly unified.

## v2 Requirements
- **CLUS-06**: Integrate `HDBSCAN` for more advanced density-based clustering.
- **UIV-02**: Manual "Merge Clusters" UI for extreme edge cases.
- **PERF-01**: Caching layer for embeddings to speed up re-sorting.

## Out of Scope
| Feature | Reason |
|---------|--------|
| Client-Side clustering | Performance: Next.js should remain light, AI math belongs in Python. |
| Manual Merge UI | Focus is on "one-shot" automatic accuracy for v1. |
| Real-time detection | Latency: Photo processing is currently batch/individual on upload. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLUS-01 | Phase 1 | Pending |
| CLUS-02 | Phase 1 | Pending |
| CLUS-03 | Phase 1 | Pending |
| CLUS-04 | Phase 2 | Pending |
| CLUS-05 | Phase 1 | Pending |
| INTG-01 | Phase 1 | Pending |
| INTG-02 | Phase 1 | Pending |
| VERI-01 | Phase 3 | Pending |
| VERI-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
