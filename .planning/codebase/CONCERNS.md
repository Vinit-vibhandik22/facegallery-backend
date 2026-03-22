# Concerns Reference

## Technical Debt
- **Shared Logic**: Face-API and DeepFace both exist, potential for redundancy and out-of-sync logic.
- **Clustering Performance**: Large photo counts (>10,000) may lead to performance degradation during client-side clustering (`clustering.ts`).
- **Unit Testing**: Lack of automated tests for critical business logic (face matching logic).

## Infrastructure & Runtime
- **Local Server Requirement**: Python backend must be running on port 8000 for full functionality.
- **Windows Integration**: Known encoding issues with DeepFace logs in Windows console (`main.py:81`).
- **Memory Management**: High-resolution image processing in Python can be memory-intensive.

## Known Limitations
- **Confidence Rating**: Minimum thresholds for clusters currently require manual tuning.
- **Manual Review**: No UI for manual review of Low-Confidence clusters.
- **Storage**: Scalability with Supabase Free Tier for high volumes of photo storage.

## Future Risk
- **Dependency Versioning**: Rapid changes in `next` and `deepface` ecosystems.
- **AI Latency**: Request-response time for heavy face analysis may impact perceived UX.
