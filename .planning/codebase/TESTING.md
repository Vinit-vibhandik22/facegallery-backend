# Testing Reference

## Overview
FaceGallery currently relies on manual testing and functional scripts.

## Automated Testing (Planned)
- No formal testing framework configured (e.g. `Jest` or `Vitest`).
- Suggested framework: `Vitest` for business logic and `Playwright` for E2E.

## Manual Testing Scripts
### Python AI Engine
- `test_df.py`: Basic DeepFace integration.
- `test_df_real.py`: DeepFace against real image data.
- `test_thresholds.py`: Threshold calibration for face matching.
- `threshold_check.py`: Validation tool for embedding similarity.

## Development Tools
- `src/lib/mock-data.ts`: Mock data for UI development and testing.
- `.env.local`: Configuration for local test database access.

## Next Steps
- Implement frontend unit tests for `clustering.ts`.
- Integrate CI/CD with `gh-actions` for linting and build checks.
