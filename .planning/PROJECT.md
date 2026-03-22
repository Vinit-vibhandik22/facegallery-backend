# FaceGallery Accuracy Upgrade

## What This Is

FaceGallery is an AI-powered photo delivery platform that automatically groups faces to help users find their photos instantly. It uses a Next.js frontend and a FastAPI backend on Hugging Face Spaces to process large collections of event photos.

## Core Value

Zero-fragmentation face clustering — ensuring a single person consistently maps to a single cluster without manual intervention.

## Requirements

### Validated

- ✓ Next.js 16.1.6 App Router frontend — existing
- ✓ FastAPI backend on Hugging Face Spaces — existing
- ✓ Supabase persistence and authentication — existing
- ✓ MTCNN-based face detection in Python — existing
- ✓ FaceNet512-based 512D embedding extraction — existing
- ✓ Complete-linkage agglomerative clustering — existing

### Active

- [ ] **Linkage Strategy**: Switch from `complete` to `average` linkage to handle facial variation (profiles, glasses) without over-splitting.
- [ ] **Distance Metric**: Explicitly transition to `cosine` distance for more stable similarity scoring on L2-normalized embeddings.
- [ ] **Clustering Post-Processor**: Implement a centroid-based merge step to unify fragmented clusters after the initial pass.
- [ ] **Backend Consolidation**: Ensure all clustering logic remains on the FastAPI backend for performance and simplicity.

### Out of Scope

- **Client-Side Clustering**: Processing remains on the backend; Next.js only receives final results — Performance.
- **Manual Merge UI**: Focus is on improving the "one-shot" automatic accuracy for v1 — Simplicity.
- **HDBSCAN Integration**: Deferred to v2; sticking with improved Agglomerative for now — Complexity control.

## Context

The current system suffers from "identity fragmentation" where the same person is split into 2-3 clusters when the threshold is tightened to prevent false positives. Using `complete` linkage makes the clusters too rigid for natural variations in photos. FaceNet512 provides high-quality 512D embeddings that should support better grouping with the right linkage and distance metric.

## Constraints

- **Tech Stack**: Python (DeepFace/FastAPI) for AI logic, Next.js for UI.
- **Environment**: Hugging Face Spaces for backend hosting.
- **Performance**: Clustering must be fast enough for "one-shot" results in the dashboard.
- **Embedding Format**: 512D L2-normalized vectors from FaceNet512.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Switch to Average Linkage | Handles variation better than rigid Complete linkage | — Pending |
| Add Post-Processing Merge | Handles "leftover" fragments that satisfy similarity but missed the initial group | — Pending |
| Explicit Cosine Metric | Mathematically stable for normalized hyperspheres | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after Project Initialization*
