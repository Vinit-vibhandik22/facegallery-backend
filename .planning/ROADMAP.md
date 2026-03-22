# Roadmap: FaceGallery Accuracy Upgrade

## Overview
This roadmap covers the transition from a rigid "complete linkage" clustering system to a more adaptive "average linkage" model with a post-processing merge step. The goal is to eliminate fragmented identity clusters while maintaining distinct boundaries between different individuals.

## Phases
- [x] **Phase 1: Clustering Core** - Transition to average linkage and cosine distance in the backend. (completed 2026-03-22)
- [ ] **Phase 2: Refinement Engine** - Implement the centroid-based post-processor merge.
- [ ] **Phase 3: Validation & Polish** - Prove accuracy improvements and verify in the dashboard.

## Phase Details

### Phase 1: Clustering Core
**Goal**: Establish a more stable grouping baseline using average linkage and cosine similarity.
**Depends on**: Nothing
**Requirements**: CLUS-01, CLUS-02, CLUS-03, CLUS-05, INTG-01, INTG-02
**Success Criteria**:
  1. Backend uses `cosine` metric for all face comparisons.
  2. Agglomerative clustering uses `average` linkage.
  3. API returns clustered results using the new logic.
**Plans**: 1 plan

Plans:
- [ ] 01-01: Update `main.py` clustering configuration and similarity metric.

### Phase 2: Refinement Engine
**Goal**: Unify any leftover fragmented clusters that satisfy inter-cluster similarity.
**Depends on**: Phase 1
**Requirements**: CLUS-04, INTG-01
**Success Criteria**:
  1. System calculates centroids for all generated clusters.
  2. Clusters with centroid distance <= threshold are merged into single identities.
**Plans**: 1 plan

Plans:
- [ ] 02-01: Implement centroid-based merge logic in the FastAPI processing pipeline.

### Phase 3: Validation & Polish
**Goal**: Confirm accuracy gains and ensure the dashboard correctly displays unified clusters.
**Depends on**: Phase 2
**Requirements**: VERI-01, VERI-02
**Success Criteria**:
  1. Automated test script confirms zero-fragmentation on a known set of multi-angle photos.
  2. Dashboard displays a single cluster for a person previously split across multiple ones.
**Plans**: 1 plan

Plans:
- [ ] 03-01: Run verification tests and perform manual visual audit in the UI.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Clustering Core | 0/1 | Complete    | 2026-03-22 |
| 2. Refinement Engine | 0/1 | Not started | - |
| 3. Validation & Polish | 0/1 | Not started | - |

---
*Roadmap defined: 2026-03-22*
*Last updated: 2026-03-22 After initial planning*
