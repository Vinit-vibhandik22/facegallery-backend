'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Image, Users, Link2, Upload, CheckCircle2, BarChart3, Loader2, Sparkles, Copy, ExternalLink, Tag, RefreshCcw, LayoutGrid, Share2 } from 'lucide-react';
import FaceNexusGraph from '@/components/FaceNexusGraph';
import { getProject, getPhotos, getClusters, getGalleryLinks, uploadPhoto, updateProject, createCluster, createPhotoClusterMapping, createGalleryLink, updateCluster, updatePhotoFaceCount, deleteAllProjectClusters, mergeClusters } from '@/lib/db';
import { processPhotos, type PhotoProcessingResult } from '@/lib/face-processing';
import { dbscan, computeConfidences } from '@/lib/clustering';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [project, setProject] = useState<Record<string, unknown> | null>(null);
    const [photos, setPhotos] = useState<Record<string, unknown>[]>([]);
    const [clusters, setClusters] = useState<Record<string, unknown>[]>([]);
    const [links, setLinks] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'clusters' | 'links'>('overview');
    const [clusterViewMode, setClusterViewMode] = useState<'grid' | 'nexus' | 'list'>('grid');

    // Upload & Processing State
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, file: '' });
    const [processing, setProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState({ current: 0, total: 0, file: '' });
    const [clusteringStatus, setClusteringStatus] = useState('');

    // Label modal
    const [labelModal, setLabelModal] = useState<{ clusterId: string; currentLabel: string } | null>(null);
    const [labelInput, setLabelInput] = useState('');
    const [copied, setCopied] = useState('');

    // Cluster photo previews
    const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
    const [clusterPhotos, setClusterPhotos] = useState<Record<string, Record<string, unknown>[]>>({});
    const [loadingClusterPhotos, setLoadingClusterPhotos] = useState<string | null>(null);
    const [selectedModalPhoto, setSelectedModalPhoto] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [proj, phots, clust, lnks] = await Promise.all([
                getProject(projectId),
                getPhotos(projectId),
                getClusters(projectId),
                getGalleryLinks(projectId).catch(() => []),
            ]);
            setProject(proj);
            setPhotos(phots || []);
            setClusters(clust || []);
            setLinks(lnks || []);
        } catch (err) {
            console.error('Failed to load project data:', err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { loadData(); }, [loadData]);

    // Load photos for a cluster when expanded
    const toggleClusterExpand = async (clusterId: string) => {
        if (expandedCluster === clusterId) {
            setExpandedCluster(null);
            return;
        }
        setExpandedCluster(clusterId);

        if (clusterPhotos[clusterId]) return;

        setLoadingClusterPhotos(clusterId);
        try {
            const { data, error } = await supabase
                .from('photo_cluster_map')
                .select('*, photos(*)')
                .eq('cluster_id', clusterId)
                .order('confidence', { ascending: false })
                .limit(20);

            if (!error && data) {
                const mapped = data.map((mapping: Record<string, unknown>) => {
                    const photo = mapping.photos as Record<string, unknown>;
                    return {
                        ...photo,
                        confidence: mapping.confidence,
                        publicUrl: supabase.storage.from('photos').getPublicUrl(photo.storage_path as string).data.publicUrl,
                    };
                });
                setClusterPhotos(prev => ({ ...prev, [clusterId]: mapped }));
            }
        } catch (err) {
            console.error('Failed to load cluster photos:', err);
        } finally {
            setLoadingClusterPhotos(null);
        }
    };

    // ========== UPLOAD + PROCESS PIPELINE ==========
    const [uploadError, setUploadError] = useState('');

    const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        setUploadError('');
        setUploadProgress({ current: 0, total: files.length, file: '' });
        const uploadedPhotos: { file: File; dbRecord: Record<string, unknown> }[] = [];
        let failCount = 0;
        let lastError = '';

        for (let i = 0; i < files.length; i++) {
            setUploadProgress({ current: i + 1, total: files.length, file: files[i].name });
            try {
                const record = await uploadPhoto(projectId, files[i]);
                uploadedPhotos.push({ file: files[i], dbRecord: record });
            } catch (err: unknown) {
                failCount++;
                lastError = err instanceof Error ? err.message : (err as Record<string, string>)?.message || String(err);
                console.error(`Upload failed for ${files[i].name}:`, lastError);
            }
        }

        if (failCount > 0) {
            setUploadError(`${failCount} of ${files.length} uploads failed: ${lastError}`);
        }
        console.log(`[FaceGallery] Upload complete: ${uploadedPhotos.length} succeeded, ${failCount} failed out of ${files.length} total`);
        setUploading(false);

        if (uploadedPhotos.length === 0) {
            setClusteringStatus('No photos were uploaded successfully.');
            return;
        }

        await updateProject(projectId, {
            photo_count: (project?.photo_count as number || 0) + uploadedPhotos.length,
            status: 'processing',
        });

        setProcessing(true);
        const results = await processPhotos(
            uploadedPhotos.map(u => u.file),
            (current, total, file) => setProcessProgress({ current, total, file })
        );

        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            const dbRec = uploadedPhotos[i]?.dbRecord;
            if (dbRec) {
                await updatePhotoFaceCount(dbRec.id as string, r.faces.length);
            }
        }
        setProcessing(false);

        setClusteringStatus('Clustering faces...');
        const allEmbeddings: { embedding: number[]; photoIdx: number; faceIdx: number; bbox: object; thumbnail: string }[] = [];

        results.forEach((result, photoIdx) => {
            result.faces.forEach((face, faceIdx) => {
                allEmbeddings.push({
                    embedding: face.embedding,
                    photoIdx,
                    faceIdx,
                    bbox: face.bbox,
                    thumbnail: face.thumbnailDataUrl,
                });
            });
        });

        if (allEmbeddings.length === 0) {
            setClusteringStatus('No faces detected.');
            await updateProject(projectId, { status: 'ready' });
            await loadData();
            return;
        }

        const embeddings = allEmbeddings.map(e => e.embedding);

        // Log L2 Normalized Euclidean distance between all face pairs
        console.log(`[FaceGallery] Computing L2 Euclidean distances between ${embeddings.length} faces:`);
        for (let i = 0; i < embeddings.length; i++) {
            for (let j = i + 1; j < embeddings.length; j++) {
                let normA = 0, normB = 0;
                for (let k = 0; k < embeddings[i].length; k++) {
                    normA += embeddings[i][k] ** 2;
                    normB += embeddings[j][k] ** 2;
                }
                const magA = Math.sqrt(normA);
                const magB = Math.sqrt(normB);
                
                let sumSquares = 0;
                for (let k = 0; k < embeddings[i].length; k++) {
                    const valA = magA === 0 ? 0 : embeddings[i][k] / magA;
                    const valB = magB === 0 ? 0 : embeddings[j][k] / magB;
                    sumSquares += (valA - valB) ** 2;
                }
                const dist = Math.sqrt(sumSquares);
                console.log(`  Face ${i} vs Face ${j}: dist=${dist.toFixed(3)} (${dist < 0.85 ? 'SAME ✅' : 'DIFFERENT ❌'})`);
            }
        }

        // Extremely tight industrial-level L2 Euclidean threshold set to 0.85
        const { labels, clusterCount } = dbscan(embeddings, 0.85, 1);
        const confidences = computeConfidences(embeddings, labels, clusterCount, 0.85);
        console.log(`[FaceGallery] Clustering: ${clusterCount} clusters, labels:`, labels);

        setClusteringStatus(`Found ${clusterCount} face groups. Saving...`);

        for (let c = 0; c < clusterCount; c++) {
            const memberIndices = labels.map((l, i) => l === c ? i : -1).filter(i => i !== -1);
            if (memberIndices.length === 0) continue;

            const bestIdx = memberIndices.reduce((best, idx) =>
                confidences[idx] > confidences[best] ? idx : best, memberIndices[0]);
            const thumbnailUrl = allEmbeddings[bestIdx].thumbnail;
            const avgConf = memberIndices.reduce((sum, idx) => sum + confidences[idx], 0) / memberIndices.length;
            const uniquePhotos = new Set(memberIndices.map(idx => allEmbeddings[idx].photoIdx));

            const cluster = await createCluster(projectId, null, thumbnailUrl, uniquePhotos.size, avgConf);

            for (const idx of memberIndices) {
                const emb = allEmbeddings[idx];
                const dbRec = uploadedPhotos[emb.photoIdx]?.dbRecord;
                if (dbRec) {
                    await createPhotoClusterMapping(dbRec.id as string, cluster.id, confidences[idx], emb.bbox);
                }
            }
        }

        const noiseIndices = labels.map((l, i) => l === -1 ? i : -1).filter(i => i !== -1);
        if (noiseIndices.length > 0) {
            const uniqueNoisePhotos = new Set(noiseIndices.map(idx => allEmbeddings[idx].photoIdx));
            const noiseCluster = await createCluster(projectId, 'Uncategorized', allEmbeddings[noiseIndices[0]].thumbnail, uniqueNoisePhotos.size, 0);
            for (const idx of noiseIndices) {
                const emb = allEmbeddings[idx];
                const dbRec = uploadedPhotos[emb.photoIdx]?.dbRecord;
                if (dbRec) {
                    await createPhotoClusterMapping(dbRec.id as string, noiseCluster.id, 0, emb.bbox);
                }
            }
        }

        await updateProject(projectId, { status: 'ready', cluster_count: clusterCount + (noiseIndices.length > 0 ? 1 : 0) });
        setClusteringStatus('Done!');
        await loadData();
        setActiveTab('clusters');
        setTimeout(() => setClusteringStatus(''), 2000);
    };

    // ========== RE-SORT EXISTING PHOTOS ==========
    const handleResortPhotos = async () => {
        if (photos.length === 0) return;
        
        const confirmMsg = "This will delete all existing face clusters and re-analyze all photos. This may take a while. Are you sure?";
        if (!window.confirm(confirmMsg)) return;

        setUploading(false);
        setUploadError('');
        setProcessing(true);
        setProcessProgress({ current: 0, total: photos.length, file: 'Initializing...' });
        setClusteringStatus('Preparing to re-process photos...');

        try {
            console.log(`[FaceGallery] Starting Re-sort for project ${projectId}...`);
            await deleteAllProjectClusters(projectId);
            await updateProject(projectId, { status: 'processing', cluster_count: 0 });
            
            const photoFiles: { file: File; dbRecord: Record<string, unknown> }[] = [];
            for (let i = 0; i < photos.length; i++) {
                const p = photos[i] as any;
                const statusStr = `Fetching asset ${i+1}/${photos.length}: ${p.original_filename}`;
                setProcessProgress({ current: i + 1, total: photos.length, file: statusStr });
                console.log(`[FaceGallery] ${statusStr}`);
                
                try {
                    // Use cache: 'no-cache' and mode: 'cors' to handle potential stale CORS headers
                    const res = await fetch(p.publicUrl, { cache: 'no-cache', mode: 'cors' });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const blob = await res.blob();
                    const file = new File([blob], p.original_filename, { type: blob.type });
                    photoFiles.push({ file, dbRecord: p });
                } catch (fetchErr) {
                    console.error(`[FaceGallery] Failed to fetch ${p.original_filename} from storage:`, fetchErr);
                    // Continue with other photos instead of crashing
                }
            }

            if (photoFiles.length === 0) {
                throw new Error("Could not retrieve any photos from storage for re-processing.");
            }

            setClusteringStatus(`Analyzing ${photoFiles.length} photos...`);
            const results = await processPhotos(
                photoFiles.map(u => u.file),
                (current, total, file) => {
                    setProcessProgress({ current, total, file });
                    console.log(`[FaceGallery] Processing ${file}: ${current}/${total}`);
                }
            );

            for (let i = 0; i < results.length; i++) {
                const r = results[i];
                const dbRec = photoFiles[i]?.dbRecord;
                if (dbRec) {
                    await updatePhotoFaceCount(dbRec.id as string, r.faces.length);
                }
            }
            setProcessing(false);

            setClusteringStatus('Clustering faces...');
            const allEmbeddings: { embedding: number[]; photoIdx: number; faceIdx: number; bbox: object; thumbnail: string }[] = [];

            results.forEach((result, photoIdx) => {
                result.faces.forEach((face, faceIdx) => {
                    allEmbeddings.push({
                        embedding: face.embedding,
                        photoIdx,
                        faceIdx,
                        bbox: face.bbox,
                        thumbnail: face.thumbnailDataUrl,
                    });
                });
            });

            if (allEmbeddings.length === 0) {
                setClusteringStatus('No faces detected.');
                await updateProject(projectId, { status: 'ready' });
                await loadData();
                return;
            }

            const embeddings = allEmbeddings.map(e => e.embedding);

            console.log(`[FaceGallery] Computing L2 Euclidean distances between ${embeddings.length} faces...`);
            const { labels, clusterCount } = dbscan(embeddings, 0.85, 1);
            const confidences = computeConfidences(embeddings, labels, clusterCount, 0.85);

            setClusteringStatus(`Found ${clusterCount} face groups. Saving...`);

            for (let c = 0; c < clusterCount; c++) {
                const memberIndices = labels.map((l, i) => l === c ? i : -1).filter(i => i !== -1);
                if (memberIndices.length === 0) continue;

                const bestIdx = memberIndices.reduce((best, idx) =>
                    confidences[idx] > confidences[best] ? idx : best, memberIndices[0]);
                const thumbnailUrl = allEmbeddings[bestIdx].thumbnail;
                const avgConf = memberIndices.reduce((sum, idx) => sum + confidences[idx], 0) / memberIndices.length;
                const uniquePhotos = new Set(memberIndices.map(idx => allEmbeddings[idx].photoIdx));

                const cluster = await createCluster(projectId, null, thumbnailUrl, uniquePhotos.size, avgConf);

                for (const idx of memberIndices) {
                    const emb = allEmbeddings[idx];
                    const dbRec = photoFiles[emb.photoIdx]?.dbRecord;
                    if (dbRec) {
                        await createPhotoClusterMapping(dbRec.id as string, cluster.id, confidences[idx], emb.bbox);
                    }
                }
            }

            const noiseIndices = labels.map((l, i) => l === -1 ? i : -1).filter(i => i !== -1);
            if (noiseIndices.length > 0) {
                const uniqueNoisePhotos = new Set(noiseIndices.map(idx => allEmbeddings[idx].photoIdx));
                const noiseCluster = await createCluster(projectId, 'Uncategorized', allEmbeddings[noiseIndices[0]].thumbnail, uniqueNoisePhotos.size, 0);
                for (const idx of noiseIndices) {
                    const emb = allEmbeddings[idx];
                    const dbRec = photoFiles[emb.photoIdx]?.dbRecord;
                    if (dbRec) {
                        await createPhotoClusterMapping(dbRec.id as string, noiseCluster.id, 0, emb.bbox);
                    }
                }
            }

            await updateProject(projectId, { status: 'ready', cluster_count: clusterCount + (noiseIndices.length > 0 ? 1 : 0) });
            setClusteringStatus('Done!');
            await loadData();
            setActiveTab('clusters');
            setTimeout(() => setClusteringStatus(''), 2000);

        } catch (err: unknown) {
            console.error('Re-sort error:', err);
            const msg = err instanceof Error ? err.message : String(err);
            setUploadError(`Failed to re-sort photos: ${msg}`);
            setProcessing(false);
            setClusteringStatus('');
            await updateProject(projectId, { status: 'ready' });
            await loadData();
        }
    };

    // ========== CLUSTER ACTIONS ==========
    const handleLabel = async () => {
        if (!labelModal) return;
        await updateCluster(labelModal.clusterId, { label: labelInput });
        setLabelModal(null);
        setLabelInput('');
        await loadData();
    };

    const handleGenerateLink = async (clusterId: string) => {
        try {
            const link = await createGalleryLink(clusterId);
            setCopied(link.token);
            await navigator.clipboard.writeText(`${window.location.origin}/gallery/${link.token}`);
            await loadData();
            setTimeout(() => setCopied(''), 3000);
        } catch (err) {
            console.error('Failed to generate link:', err);
        }
    };

    const handleCopyLink = async (token: string) => {
        await navigator.clipboard.writeText(`${window.location.origin}/gallery/${token}`);
        setCopied(token);
        setTimeout(() => setCopied(''), 2000);
    };

    const handleMergeDrop = async (e: React.DragEvent<HTMLDivElement>, targetClusterId: string) => {
        e.preventDefault();
        const sourceClusterId = e.dataTransfer.getData('sourceClusterId');
        if (sourceClusterId && sourceClusterId !== targetClusterId) {
            const source = clusters.find(c => c.id === sourceClusterId);
            const target = clusters.find(c => c.id === targetClusterId);
            if (!source || !target) return;

            if (window.confirm(`Merge ${(source.label as string) || 'this person'} into ${(target.label as string) || 'that person'}?`)) {
                try {
                    setClusteringStatus('Merging clusters...');
                    await mergeClusters(sourceClusterId, targetClusterId);
                    await loadData();
                    setClusteringStatus('Merged successfully!');
                    setTimeout(() => setClusteringStatus(''), 2000);
                } catch (err) {
                    console.error('Merge failed:', err);
                    alert('Failed to merge clusters.');
                    setClusteringStatus('');
                }
            }
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
            </div>
        );
    }

    if (!project) return (
        <div className="page-body" style={{ textAlign: 'center', padding: 60 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 12 }}>Project not found</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>This project may have been deleted or you don&apos;t have access.</p>
            <Link href="/dashboard/projects" className="btn btn-primary">← Back to Projects</Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 16 }}>Check browser console (F12) for details</p>
        </div>
    );

    const tabs = [
        { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
        { key: 'clusters', label: `Face Clusters (${clusters.length})`, icon: <Users size={16} /> },
        { key: 'links', label: `Gallery Links (${links.length})`, icon: <Link2 size={16} /> },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <div className="breadcrumb"><Link href="/dashboard/projects">← Projects</Link> / {project.name as string}</div>
                    <h1>{project.name as string}</h1>
                </div>
                <span className={`badge badge-${project.status === 'ready' ? 'success' : project.status === 'processing' ? 'warning' : 'info'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                    {project.status === 'ready' && <CheckCircle2 size={14} />} {project.status as string}
                </span>
            </div>
            <div className="page-body">
                {/* Processing Status */}
                {(uploading || processing || clusteringStatus) && (
                    <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(108,92,231,0.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <Sparkles size={18} style={{ color: 'var(--color-primary-light)' }} />
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
                                {uploading ? 'Uploading Photos...' : processing ? 'Detecting Faces...' : clusteringStatus}
                            </h3>
                        </div>
                        {uploading && (
                            <>
                                <div className="progress-bar" style={{ marginBottom: 8 }}>
                                    <div className="progress-bar-fill" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {uploadProgress.current}/{uploadProgress.total} — {uploadProgress.file}
                                </div>
                            </>
                        )}
                        {processing && (
                            <>
                                <div className="progress-bar" style={{ marginBottom: 8 }}>
                                    <div className="progress-bar-fill" style={{ width: `${(processProgress.current / processProgress.total) * 100}%` }} />
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {processProgress.current}/{processProgress.total} — {processProgress.file}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                    <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(255,71,87,0.4)', background: 'rgba(255,71,87,0.05)' }}>
                        <div style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: 4 }}>⚠️ Upload Error</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{uploadError}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                            Make sure the &quot;photos&quot; storage bucket exists in Supabase (Dashboard → Storage → New Bucket → Name: photos, Public: ON)
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border-color)' }}>
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '0.875rem', fontWeight: activeTab === tab.key ? 600 : 400, color: activeTab === tab.key ? 'var(--color-primary-light)' : 'var(--text-secondary)', transition: 'var(--transition)', background: 'none', cursor: 'pointer', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: activeTab === tab.key ? 'var(--color-primary)' : 'transparent', fontFamily: 'var(--font-body)' }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in">
                        <div className="grid grid-4" style={{ marginBottom: 32 }}>
                            <div className="stat-card"><div className="stat-value">{(project.photo_count as number || 0).toLocaleString()}</div><div className="stat-label">Photos</div></div>
                            <div className="stat-card"><div className="stat-value">{project.cluster_count as number || 0}</div><div className="stat-label">Face Clusters</div></div>
                            <div className="stat-card"><div className="stat-value">{links.length}</div><div className="stat-label">Gallery Links</div></div>
                            <div className="stat-card"><div className="stat-value">{project.event_date ? formatDate(project.event_date as string) : '—'}</div><div className="stat-label" style={{ fontSize: '0.75rem' }}>Event Date</div></div>
                        </div>
                        <div className="card" style={{ marginBottom: 24 }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Upload Photos</h3>
                            <label style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 48, textAlign: 'center', cursor: 'pointer', display: 'block', transition: 'var(--transition)' }}>
                                <input type="file" multiple accept="image/*" onChange={handleFileDrop} style={{ display: 'none' }} disabled={uploading || processing} />
                                <Upload size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                                <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop photos here or click to browse</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supports JPG, PNG, HEIC · Select multiple files</p>
                            </label>
                        </div>
                        {photos.length > 0 && (
                            <div className="card">
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                                    <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Uploaded Photos ({photos.length})</h3>
                                    <button 
                                        className="btn btn-secondary btn-sm" 
                                        onClick={handleResortPhotos} 
                                        disabled={processing || uploading}
                                        style={{ borderColor: 'var(--color-primary-dark)' }}
                                    >
                                        <RefreshCcw size={16} className={processing ? 'spin' : ''} /> 
                                        {processing ? 'Re-sorting...' : 'Re-sort All Photos'}
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                                    {photos.slice(0, 50).map((photo) => (
                                        <div key={photo.id as string} style={{ aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                            <img src={(photo as Record<string, unknown>).publicUrl as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                                        </div>
                                    ))}
                                    {photos.length > 50 && (
                                        <div style={{ aspectRatio: '1', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                            +{photos.length - 50} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CLUSTERS TAB */}
                {/* CLUSTERS TAB */}
                {activeTab === 'clusters' && (() => {
                    const confidentClusters = clusters.filter(c => (c.avg_confidence as number || 0) >= 0.50);
                    const manualInterventionClusters = clusters.filter(c => (c.avg_confidence as number || 0) < 0.50);

                    const renderClusterGrid = (clusterGroup: any[]) => (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                            {clusterGroup.map((cluster, i) => {
                                const isExpanded = expandedCluster === cluster.id;
                                const clPhotos = clusterPhotos[cluster.id as string];
                                const isLoadingPhotos = loadingClusterPhotos === cluster.id;
                                const confidencePct = Math.round((cluster.avg_confidence as number || 0) * 100);
                                const isWarning = confidencePct < 50;

                                return (
                                    <div 
                                        key={cluster.id as string} 
                                        className="card animate-fade-in" 
                                        style={{ animationDelay: `${i * 0.05}s`, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'grab' }}
                                        draggable="true"
                                        onDragStart={(e) => e.dataTransfer.setData('sourceClusterId', cluster.id as string)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => handleMergeDrop(e, cluster.id as string)}
                                    >
                                        {/* Cluster Header & Main Info */}
                                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                {cluster.thumbnail_url ? (
                                                    <img
                                                        src={String(cluster.thumbnail_url)}
                                                        alt=""
                                                        style={{ width: 64, height: 64, borderRadius: 'var(--radius-full)', objectFit: 'cover', border: `3px solid ${isWarning ? 'var(--color-danger)' : 'var(--color-primary)'}`, flexShrink: 0, cursor: 'pointer', transition: 'transform 0.2s' }}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedModalPhoto(String(cluster.thumbnail_url)); }}
                                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    />
                                                ) : <div style={{width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'var(--border-color)'}} />}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {(cluster.label as string) || `Person #${clusters.indexOf(cluster) + 1}`}
                                                    </h4>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {cluster.photo_count as number} photos indexed
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Confidence UI */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', fontWeight: 600, color: isWarning ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                                    <span>Confidence: {confidencePct}%</span>
                                                </div>
                                                <div style={{ height: 8, background: 'var(--bg-document)', borderRadius: 4, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${confidencePct}%`, background: isWarning ? 'var(--color-danger)' : 'var(--color-success)', borderRadius: 4, transition: 'width 1s ease-out' }} />
                                                </div>
                                                {isWarning && <div style={{fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4}}>⚠️ Insufficient facial data</div>}
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                                                <button className="btn btn-secondary btn-sm" style={{flex: 1, justifyContent: 'center'}} onClick={(e) => { e.stopPropagation(); setLabelModal({ clusterId: cluster.id as string, currentLabel: (cluster.label as string) || '' }); setLabelInput((cluster.label as string) || ''); }}>
                                                    <Tag size={14} /> Label
                                                </button>
                                                <button className="btn btn-primary btn-sm" style={{flex: 1, justifyContent: 'center'}} onClick={(e) => { e.stopPropagation(); handleGenerateLink(cluster.id as string); }}>
                                                    <Link2 size={14} /> {copied === cluster.id ? 'Copied!' : 'Link'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expand Toggle */}
                                        <div 
                                            style={{ padding: '12px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', textAlign: 'center', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                                            onClick={() => toggleClusterExpand(cluster.id as string)}
                                        >
                                            {isExpanded ? 'Hide Photos' : 'View Photos'}
                                            <div style={{ transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</div>
                                        </div>

                                        {/* Expanded Photo Previews */}
                                        {isExpanded && (
                                            <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px', background: 'var(--bg-surface)' }}>
                                                {isLoadingPhotos ? (
                                                    <div style={{ textAlign: 'center', padding: 20 }}>
                                                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                                                    </div>
                                                ) : clPhotos && clPhotos.length > 0 ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 }}>
                                                        {clPhotos.map((photo, j) => (
                                                            <div key={photo.id as string || j} style={{ aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative' }}>
                                                                <img 
                                                                    src={photo.publicUrl as string} 
                                                                    alt="" 
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                                                                    loading="lazy" 
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedModalPhoto(photo.publicUrl as string); }}
                                                                />
                                                                <div style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.60rem', padding: '2px 4px', borderRadius: 4 }}>
                                                                    {Math.round((photo.confidence as number || 0) * 100)}%
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 12 }}>No photos in this cluster yet.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );

                    return (
                        <div className="animate-fade-in">
                            {clusters.length === 0 ? (
                                <div className="empty-state">
                                    <Users size={48} />
                                    <h3>No face clusters yet</h3>
                                    <p>Upload photos in the Overview tab to start face detection.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                                    {/* View Mode Switcher */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '12px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                                        <div>
                                            <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1rem' }}>Face Distribution View</h3>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toggle how you explore detected people in this project.</p>
                                        </div>
                                        <div style={{ display: 'flex', background: 'var(--bg-document)', padding: 4, borderRadius: 'var(--radius-md)', gap: 4 }}>
                                            <button 
                                                onClick={() => setClusterViewMode('grid')}
                                                className={clusterViewMode === 'grid' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                            >
                                                <LayoutGrid size={14} /> Grid
                                            </button>
                                            <button 
                                                onClick={() => setClusterViewMode('nexus')}
                                                className={clusterViewMode === 'nexus' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                            >
                                                <Share2 size={14} /> Nexus Graph
                                            </button>
                                        </div>
                                    </div>

                                    {clusterViewMode === 'nexus' ? (
                                        <FaceNexusGraph projectId={projectId} clusters={clusters} />
                                    ) : (
                                        <>
                                            {confidentClusters.length > 0 && (
                                        <div>
                                            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ color: 'var(--color-success)' }}>●</span> Validated Face Clusters ({confidentClusters.length})
                                            </h3>
                                            {renderClusterGrid(confidentClusters)}
                                        </div>
                                    )}

                                            {manualInterventionClusters.length > 0 && (
                                                <div>
                                                    <div style={{ padding: '16px 24px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                                                        <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-danger)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            ⚠️ Requiring Manual Intervention ({manualInterventionClusters.length})
                                                        </h3>
                                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                            The facial data for these clusters is insufficient or blurry, and could not reach the minimum 50% AI Confidence threshold.
                                                        </p>
                                                    </div>
                                                    {renderClusterGrid(manualInterventionClusters)}
                                                </div>
                                            )}
                                        </>
                                    )}

                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* LINKS TAB */}
                {activeTab === 'links' && (
                    <div className="animate-fade-in">
                        {links.length === 0 ? (
                            <div className="empty-state">
                                <Link2 size={48} />
                                <h3>No gallery links yet</h3>
                                <p>Go to Face Clusters and generate links for each person.</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr><th>Recipient</th><th>Gallery Link</th><th>Views</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {links.map((link) => {
                                            const fc = link.face_clusters as Record<string, unknown> | null;
                                            const isExpired = new Date(link.expires_at as string) < new Date();
                                            return (
                                                <tr key={link.id as string}>
                                                    <td style={{ fontWeight: 600 }}>{fc?.label as string || 'Unlabeled'}</td>
                                                    <td>
                                                        <code style={{ fontSize: '0.75rem', background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: 4 }}>
                                                            /gallery/{link.token as string}
                                                        </code>
                                                    </td>
                                                    <td>{link.view_count as number}</td>
                                                    <td>
                                                        <span className={`badge ${!isExpired && link.is_active ? 'badge-success' : 'badge-muted'}`}>
                                                            {!isExpired && link.is_active ? 'Active' : 'Expired'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(link.expires_at as string)}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => handleCopyLink(link.token as string)} title="Copy link">
                                                                {copied === link.token ? '✓' : <Copy size={14} />}
                                                            </button>
                                                            <Link href={`/gallery/${link.token}`} className="btn btn-ghost btn-sm" target="_blank" title="Preview">
                                                                <ExternalLink size={14} />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Label Modal */}
            {labelModal && (
                <div className="modal-overlay" onClick={() => setLabelModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Label Face Cluster</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>Give this person a name so you can identify them easily.</p>
                        <input className="input" placeholder="e.g., Emma Smith (Bride)" value={labelInput} onChange={e => setLabelInput(e.target.value)} autoFocus />
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setLabelModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleLabel}>Save Label</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Preview Modal */}
            {selectedModalPhoto && (
                <div className="modal-overlay" onClick={() => setSelectedModalPhoto(null)} style={{ background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedModalPhoto(null)} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        <img src={selectedModalPhoto} alt="Full screen preview" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
                    </div>
                </div>
            )}
        </>
    );
}
