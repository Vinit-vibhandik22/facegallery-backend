# Structure Reference

## Directory Layout

### `.planning/`
- **codebase/**: Project documentation and reference.
- **phases/**: Component/task breakdown (future).
- **milestones/**: Milestone archive (future).

### `python_backend/`
- **main.py**: FastAPI server entry point.
- **requirements.txt**: Python dependencies.
- **Dockerfile**: Containerization (optional).
- **test_*.py**: Manual testing and scripts for face analysis.

### `src/`
- **app/**: Routes, layouts, and page-specific styles.
- **components/**: React components (UI kits, project cards, etc.).
- **lib/**: Core logic and support.
  - **auth-context.tsx**: Authentication logic.
  - **clustering.ts**: Face grouping algorithms.
  - **db.ts**: Supabase operations interface.
  - **face-processing.ts**: Python API client.
  - **mock-data.ts**: Testing and development data.
  - **supabase.ts**: Supabase client initialization.
  - **types.ts**: Global TypeScript interfaces.
  - **utils.ts**: Shared helper functions (dates, formatting).

### `supabase/`
- **config/**: Supabase-specific configuration and migrations.

## Key Files
- `package.json`: Frontend dependencies and scripts.
- `tsconfig.json`: TypeScript compiler configuration.
- `.env.local`: Application environment variables (Supabase keys).
- `next.config.ts`: Next.js build configuration.
