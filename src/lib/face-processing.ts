/**
 * Backend-based face detection and embedding extraction.
 * Uses local Python FastAPI server with DeepFace ArcFace + RetinaFace.
 */

export interface DetectedFace {
    embedding: number[];
    bbox: { x: number; y: number; width: number; height: number };
    confidence: number;
    thumbnailDataUrl: string;
}

export interface PhotoProcessingResult {
    photoFile: File;
    photoId?: string;
    faces: DetectedFace[];
    width: number;
    height: number;
}

export type ProgressCallback = (processed: number, total: number, currentFile: string) => void;

/**
 * We don't need to load models in the browser anymore, backend does it.
 */
export async function loadModels(): Promise<void> {
    console.log('[ClustR AI] Using Python backend for face detection');
}

/**
 * Call Python backend for highly accurate processing.
 */
export async function processPhoto(file: File): Promise<PhotoProcessingResult> {
    const formData = new FormData();
    formData.append('file', file);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const res = await fetch(`${backendUrl}/analyze-photo`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        throw new Error(`Backend processing failed for ${file.name}: ${res.statusText}`);
    }

    const data = await res.json();
    return {
        photoFile: file,
        faces: data.faces,
        width: data.width,
        height: data.height,
    };
}

/**
 * Process multiple photos sequentially with progress tracking.
 */
export async function processPhotos(
    files: File[],
    onProgress?: ProgressCallback
): Promise<PhotoProcessingResult[]> {
    const results: PhotoProcessingResult[] = [];
    let totalFaces = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(i, files.length, file.name);

        try {
            const result = await processPhoto(file);
            totalFaces += result.faces.length;
            results.push(result);
            console.log(`[ClustR AI] ${file.name}: ${result.faces.length} faces found (${result.width}x${result.height})`);
        } catch (err) {
            console.error(`[ClustR AI] FAILED to process ${file.name}:`, err);
            results.push({
                photoFile: file,
                faces: [],
                width: 0,
                height: 0,
            });
        }
    }

    console.log(`[ClustR AI] Done! Processed ${files.length} photos, found ${totalFaces} total faces`);
    onProgress?.(files.length, files.length, 'Done');
    return results;
}

export function isModelsLoaded(): boolean {
    return true; // We assume backend is running
}
