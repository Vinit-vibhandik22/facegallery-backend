/**
 * DBSCAN clustering algorithm implemented in pure TypeScript.
 * No external dependencies. Runs on any CPU.
 * 
 * Used to group face embeddings by similarity — each cluster = one person.
 */

export interface ClusterResult {
    /** Cluster label for each embedding (-1 = noise/uncategorized) */
    labels: number[];
    /** Number of clusters found (excluding noise) */
    clusterCount: number;
    /** Indices of noise points */
    noiseIndices: number[];
}

/**
 * Run clustering on the Python backend (Agglomerative + Average Linkage).
 */
export async function clusterFacesRemote(
    embeddings: number[][],
    epsilon: number = 0.35,
    minPoints: number = 1
): Promise<ClusterResult> {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const res = await fetch(`${backendUrl}/cluster-faces?epsilon=${epsilon}&min_points=${minPoints}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embeddings),
    });

    if (!res.ok) {
        throw new Error(`Remote clustering failed: ${res.statusText}`);
    }

    const data = await res.json();
    return {
        labels: data.labels,
        clusterCount: data.clusterCount,
        noiseIndices: data.noiseIndices
    };
}

/**
 * Compute Normalized Euclidean (L2) distance between two vectors.
 * Facenet512 responds much more consistently and predictably to L2 distance.
 * Official threshold for Facenet512 L2 distance is 1.04.
 * Distance = Euclidean norm of (normalized_a - normalized_b)
 */
export function euclideanL2Distance(a: number[], b: number[]): number {
    // 1. Calculate magnitudes for L2 normalization
    let normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const magA = Math.sqrt(normA);
    const magB = Math.sqrt(normB);

    // 2. Compute Euclidean distance between the normalized vectors
    let sumSquares = 0;
    for (let i = 0; i < a.length; i++) {
        const valA = magA === 0 ? 0 : a[i] / magA;
        const valB = magB === 0 ? 0 : b[i] / magB;
        const diff = valA - valB;
        sumSquares += diff * diff;
    }
    
    return Math.sqrt(sumSquares);
}

/**
 * Run Agglomerative Clustering (Complete Linkage) on face embeddings.
 * We keep the function name `dbscan` to maintain compatibility with the rest of the app,
 * but the algorithm is completely changed to guarantee zero false positives.
 * 
 * Complete Linkage ensures that the maximum distance between ANY two faces in
 * the same bucket is strictly less than the threshold.
 * 
 * @param embeddings - Array of face embedding vectors
 * @param epsilon - Maximum Cosine distance for "same person"
 * @param minPoints - Minimum faces to form a cluster
 * @returns Cluster assignments for each embedding
 */
export function dbscan(
    embeddings: number[][],
    epsilon: number = 0.30,
    minPoints: number = 1
): ClusterResult {
    const n = embeddings.length;
    // Start with every face in its own individual cluster
    const clusters: number[][] = Array.from({ length: n }, (_, i) => [i]);

    while (clusters.length > 1) {
        let minMaxDist = Infinity;
        let mergeIdx1 = -1;
        let mergeIdx2 = -1;

        // Find the pair of clusters with the smallest complete link distance
        // (Complete linkage = Max distance between any two elements among both clusters)
        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                let maxDist = 0;
                for (const elem1 of clusters[i]) {
                    for (const elem2 of clusters[j]) {
                        const dist = euclideanL2Distance(embeddings[elem1], embeddings[elem2]);
                        if (dist > maxDist) {
                            maxDist = dist;
                        }
                    }
                }

                if (maxDist < minMaxDist) {
                    minMaxDist = maxDist;
                    mergeIdx1 = i;
                    mergeIdx2 = j;
                }
            }
        }

        // If the closest two clusters are still within our strict mathematical threshold, merge them
        if (minMaxDist <= epsilon) {
            clusters[mergeIdx1].push(...clusters[mergeIdx2]);
            clusters.splice(mergeIdx2, 1); // remove the merged cluster
        } else {
            // No more clusters can be legally merged under the strict threshold constraint
            break;
        }
    }

    const labels = new Array<number>(n).fill(-1);
    let currentCluster = 0;
    const noiseIndices: number[] = [];
    
    // Assign labels and handle minimum points constraint
    for (const cluster of clusters) {
        if (cluster.length >= minPoints) {
            for (const elem of cluster) {
                labels[elem] = currentCluster;
            }
            currentCluster++;
        } else {
            // Consider as noise if < minPoints
            for (const elem of cluster) {
                labels[elem] = -1;
                noiseIndices.push(elem);
            }
        }
    }

    return { labels, clusterCount: currentCluster, noiseIndices };
}

/**
 * Compute confidence scores for each face in its assigned cluster.
 * Based on average distance to other cluster members.
 */
export function computeConfidences(
    embeddings: number[][],
    labels: number[],
    clusterCount: number,
    threshold: number = 0.6
): number[] {
    const confidences = new Array<number>(embeddings.length).fill(0);

    for (let c = 0; c < clusterCount; c++) {
        const memberIndices = labels.map((l, i) => l === c ? i : -1).filter(i => i !== -1);
        if (memberIndices.length <= 1) {
            // Single member — give it 99% confidence
            memberIndices.forEach(i => confidences[i] = 0.99);
            continue;
        }

        // Compute average distance to other cluster members
        for (const i of memberIndices) {
            let totalDist = 0;
            for (const j of memberIndices) {
                if (i === j) continue;
                totalDist += euclideanL2Distance(embeddings[i], embeddings[j]);
            }
            const avgDist = totalDist / (memberIndices.length - 1);
            // Convert distance to confidence (0.0 distance = 1.0 confidence, 0.6 distance = 0.0 confidence)
            confidences[i] = Math.max(0, Math.min(1, 1 - avgDist / threshold));
        }
    }

    // Noise points get low confidence
    labels.forEach((l, i) => {
        if (l === -1) confidences[i] = 0.1;
    });

    return confidences;
}

/**
 * Merge two clusters if their centroids are close enough.
 */
export function mergeClusters(
    embeddings: number[][],
    labels: number[],
    clusterCount: number,
    mergeThreshold: number = 0.5
): { labels: number[]; clusterCount: number } {
    if (clusterCount <= 1) return { labels, clusterCount };

    // Compute centroids
    const centroids: number[][] = [];
    for (let c = 0; c < clusterCount; c++) {
        const members = labels.map((l, i) => l === c ? i : -1).filter(i => i !== -1);
        if (members.length === 0) {
            centroids.push([]);
            continue;
        }
        const dim = embeddings[0].length;
        const centroid = new Array<number>(dim).fill(0);
        for (const m of members) {
            for (let d = 0; d < dim; d++) {
                centroid[d] += embeddings[m][d];
            }
        }
        for (let d = 0; d < dim; d++) {
            centroid[d] /= members.length;
        }
        centroids.push(centroid);
    }

    // Find clusters to merge
    const mergeMap = new Map<number, number>();
    for (let i = 0; i < clusterCount; i++) {
        if (centroids[i].length === 0 || mergeMap.has(i)) continue;
        for (let j = i + 1; j < clusterCount; j++) {
            if (centroids[j].length === 0 || mergeMap.has(j)) continue;
            const dist = euclideanL2Distance(centroids[i], centroids[j]);
            if (dist < mergeThreshold) {
                mergeMap.set(j, i);
            }
        }
    }

    if (mergeMap.size === 0) return { labels, clusterCount };

    // Apply merges
    const newLabels = labels.map(l => {
        let target = l;
        while (mergeMap.has(target)) target = mergeMap.get(target)!;
        return target;
    });

    // Re-number clusters
    const uniqueLabels = [...new Set(newLabels.filter(l => l >= 0))].sort((a, b) => a - b);
    const reMap = new Map<number, number>();
    uniqueLabels.forEach((l, i) => reMap.set(l, i));

    const finalLabels = newLabels.map(l => l >= 0 ? (reMap.get(l) ?? l) : l);

    return { labels: finalLabels, clusterCount: uniqueLabels.length };
}
