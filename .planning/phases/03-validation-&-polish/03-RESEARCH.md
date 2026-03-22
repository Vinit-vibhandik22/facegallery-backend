# Phase 3 Research: Validation & Polish

## Strategy
Prove that the changes in Phase 1 (Average Linkage + Cosine) and Phase 2 (Centroid Merge) successfully solve the fragmentation issue. 

## Success Criteria Evaluation
1. **VERI-01 (Automated Validation)**: 
   - We need a script that compares the *Old* logic (Complete Linkage + Euclidean) vs the *New* logic (Average Linkage + Cosine + Refinement).
   - Mock datasets with "Variation" (different angles of the same person) should split in the old system but unify in the new one.
2. **VERI-02 (Dashboard Verification)**:
   - Perform a manual "Re-sort All Photos" in the running dashboard.
   - Observe the number of clusters for a known subject.

## Test Scenarios
- **Scenario A: The "Angle" Case**: 3 photos of Person 1 (Frontal, Left Profile, Right Profile).
  - *Expected Old*: 2-3 clusters.
  - *Expected New*: 1 cluster.
- **Scenario B: The "Different People" Case**: 2 photos of Person 1, 2 photos of Person 2.
  - *Expected Old*: 2-4 clusters.
  - *Expected New*: 2 clusters.

## Implementation Details
- Finalize `python_backend/main.py` if any tweaks are needed for the default `epsilon`. 
- Ensure the frontend correctly displays the refinished results and that confidence scores are still useful.
- Remove temporary test scripts (`tmp/test_refinement.py`, etc.) before completion.
