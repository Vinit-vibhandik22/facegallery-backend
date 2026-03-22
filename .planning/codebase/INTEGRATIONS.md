# Integrations Reference

## External Services
### Supabase
- **Role**: Primary database, authentication, and file storage.
- **Client**: `src/lib/supabase.ts`
- **Operations**: `src/lib/db.ts`
- **Usage**: Data persistence, user management, photo metadata.

## Local Services
### FaceGallery AI Engine (Python Backend)
- **Role**: High-performance face embedding extraction and detection.
- **Address**: `http://127.0.0.1:8000`
- **Endpoint**: `/analyze-photo` (POST)
- **Model**: `Facenet512` (provided via `deepface`)
- **Integration**: `src/lib/face-processing.ts`

## Libraries
### Face-API.js
- **Role**: Suggested by `package.json` for client-side detection.
- **Library**: `@vladmandic/face-api`
- **Status**: Likely a fallback or alternative to the Python engine.
