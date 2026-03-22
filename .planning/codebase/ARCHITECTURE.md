# Architecture Reference

## Overview
FaceGallery is built as a split-architecture system:
- **Frontend Layer**: Next.js App Router for UI, routing, and user interaction.
- **Service Layer**: Python-based AI Engine for compute-heavy face processing.
- **Persistence Layer**: Supabase for relational data and auth state.

## Core Patterns
### Routing (App Router)
- `/`: Landing page and project overview.
- `/auth`: Login and registration.
- `/dashboard`: Project-specific metrics, face nexus graph, and cluster management.
- `/gallery`: Photo browsing and detailed view.

### State Management
- **Auth State**: Centralized in `src/lib/auth-context.tsx`.
- **UI State**: Framer Motion and GSAP for fluid Transitions.
- **Domain State**: Clustering results and confidence ratings.

## Data Flow
1. **Photo Upload**: User selects photos via Next.js UI.
2. **Analysis**: Photo sent to Python `analyze-photo` FastAPI endpoint.
3. **Detection**: MTCNN/Facenet512 extracts 512D embeddings.
4. **Integration**: Embeddings and thumbnails returned to Next.js.
5. **Persistence**: Face and photo metadata saved to Supabase via `src/lib/db.ts`.
6. **Clustering**: Faces grouped using algorithms in `src/lib/clustering.ts`.
