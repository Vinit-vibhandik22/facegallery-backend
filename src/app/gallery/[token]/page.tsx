'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, X, ChevronLeft, ChevronRight, Calendar, Image, Loader2, AlertCircle, Check } from 'lucide-react';
import { getGalleryByToken } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export default function GalleryPage() {
    const params = useParams();
    const token = params.token as string;

    const [data, setData] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [downloadingAll, setDownloadingAll] = useState(false);
    const [downloadAllProgress, setDownloadAllProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        getGalleryByToken(token)
            .then(result => {
                if (!result) setError('This gallery link is invalid or has expired.');
                else setData(result);
            })
            .catch(() => setError('Failed to load gallery.'))
            .finally(() => setLoading(false));
    }, [token]);

    // Download a single photo
    const downloadPhoto = async (photo: Record<string, unknown>, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const photoId = photo.id as string;
        setDownloading(photoId);

        try {
            const url = photo.publicUrl as string;
            const response = await fetch(url);
            const blob = await response.blob();

            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (photo.original_filename as string) || `photo-${photoId}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);

            // Increment download count
            const linkData = data?.link as Record<string, unknown>;
            if (linkData?.id) {
                await supabase
                    .from('gallery_links')
                    .update({ download_count: ((linkData.download_count as number) || 0) + 1 })
                    .eq('id', linkData.id);
            }
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setDownloading(null);
        }
    };

    // Download all photos as individual files (no ZIP library needed)
    const downloadAll = async () => {
        if (!data) return;
        const photos = data.photos as Record<string, unknown>[];
        setDownloadingAll(true);
        setDownloadAllProgress({ current: 0, total: photos.length });

        for (let i = 0; i < photos.length; i++) {
            setDownloadAllProgress({ current: i + 1, total: photos.length });
            try {
                const url = photos[i].publicUrl as string;
                const response = await fetch(url);
                const blob = await response.blob();

                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = (photos[i].original_filename as string) || `photo-${i + 1}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);

                // Small delay between downloads to avoid browser throttling
                await new Promise(r => setTimeout(r, 300));
            } catch (err) {
                console.error(`Download failed for photo ${i + 1}:`, err);
            }
        }

        // Increment download count
        const linkData = data.link as Record<string, unknown>;
        if (linkData?.id) {
            await supabase
                .from('gallery_links')
                .update({ download_count: ((linkData.download_count as number) || 0) + photos.length })
                .eq('id', linkData.id);
        }

        setDownloadingAll(false);
    };

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (lightboxIdx === null) return;
        const photos = (data?.photos as Record<string, unknown>[]) || [];
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxIdx(null);
            if (e.key === 'ArrowLeft') setLightboxIdx(i => i !== null ? (i > 0 ? i - 1 : photos.length - 1) : null);
            if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? (i < photos.length - 1 ? i + 1 : 0) : null);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIdx, data]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', padding: 20, textAlign: 'center' }}>
                <AlertCircle size={48} style={{ color: 'var(--color-danger)', marginBottom: 16 }} />
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Gallery Not Available</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>{error || 'This link may have expired or been removed.'}</p>
            </div>
        );
    }

    const studio = data.studio as Record<string, unknown>;
    const cluster = data.cluster as Record<string, unknown>;
    const project = data.project as Record<string, unknown>;
    const photos = data.photos as Record<string, unknown>[];
    const brandColor = (studio.brand_color as string) || '#6C5CE7';

    const openLightbox = (idx: number) => setLightboxIdx(idx);
    const closeLightbox = () => setLightboxIdx(null);
    const prevPhoto = () => setLightboxIdx(i => i !== null ? (i > 0 ? i - 1 : photos.length - 1) : null);
    const nextPhoto = () => setLightboxIdx(i => i !== null ? (i < photos.length - 1 ? i + 1 : 0) : null);

    return (
        <div className="gallery-page">
            {/* Header */}
            <header className="gallery-header" style={{ background: `linear-gradient(180deg, ${brandColor}12, transparent)` }}>
                <div className="gallery-logo">{studio.name as string}</div>
                <h1 style={{ fontFamily: 'var(--font-heading)' }}>{studio.gallery_title as string || 'Your Photos Are Ready'}</h1>
                <p>{studio.gallery_subtitle as string || 'Browse and download your personalized gallery'}</p>
                <div className="gallery-meta">
                    {project.event_date ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} /> {new Date(String(project.event_date)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    ) : null}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Image size={14} /> {photos.length} photos
                    </span>
                    {cluster.label ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${brandColor}20`, color: brandColor, padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                            {String(cluster.label)}
                        </span>
                    ) : null}
                </div>
                {studio.allow_downloads && photos.length > 0 ? (
                    <button
                        className="btn btn-primary btn-lg"
                        style={{ marginTop: 24, background: `linear-gradient(135deg, ${brandColor}, ${String(studio.brand_color_secondary || brandColor)})` }}
                        onClick={downloadAll}
                        disabled={downloadingAll}
                    >
                        {downloadingAll ? (
                            <>
                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                Downloading {downloadAllProgress.current}/{downloadAllProgress.total}...
                            </>
                        ) : (
                            <>
                                <Download size={18} /> Download All Photos
                            </>
                        )}
                    </button>
                ) : null}
            </header>

            {/* Download All Progress Bar */}
            {downloadingAll && (
                <div style={{ padding: '0 24px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
                    <div className="progress-bar" style={{ height: 6, marginBottom: 24 }}>
                        <div className="progress-bar-fill" style={{ width: `${(downloadAllProgress.current / downloadAllProgress.total) * 100}%`, transition: 'width 0.3s ease' }} />
                    </div>
                </div>
            )}

            {/* Photo Grid */}
            <div className="gallery-grid">
                {photos.map((photo, i) => (
                    <div key={photo.id as string || i} className="gallery-photo animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }} onClick={() => openLightbox(i)}>
                        <img src={photo.publicUrl as string} alt={`Photo ${i + 1}`} loading="lazy" />
                        <div className="gallery-photo-overlay">
                            {studio.allow_downloads ? (
                                <button
                                    className="btn btn-sm"
                                    style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}
                                    onClick={e => downloadPhoto(photo, e)}
                                    disabled={downloading === photo.id}
                                >
                                    {downloading === photo.id ? (
                                        <Check size={14} />
                                    ) : (
                                        <Download size={14} />
                                    )}
                                </button>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <footer style={{ textAlign: 'center', padding: '32px 20px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {cluster.label ? <p>Gallery for <strong>{String(cluster.label)}</strong> · {String(project.name)}</p> : null}
                {studio.show_powered_by ? (
                    <p style={{ marginTop: 6, fontSize: '0.75rem' }}>Powered by <span style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>FaceGallery</span></p>
                ) : null}
            </footer>

            {/* Lightbox */}
            {lightboxIdx !== null && (
                <div className="lightbox" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}><X size={20} /></button>
                    <button className="lightbox-nav lightbox-prev" onClick={e => { e.stopPropagation(); prevPhoto(); }}><ChevronLeft size={24} /></button>
                    <img src={photos[lightboxIdx].publicUrl as string} alt={`Photo ${lightboxIdx + 1}`} onClick={e => e.stopPropagation()} />
                    <button className="lightbox-nav lightbox-next" onClick={e => { e.stopPropagation(); nextPhoto(); }}><ChevronRight size={24} /></button>
                    <div className="lightbox-counter">
                        {lightboxIdx + 1} / {photos.length}
                        {studio.allow_downloads ? (
                            <button
                                className="btn btn-sm"
                                style={{ marginLeft: 16, background: 'rgba(255,255,255,0.15)', color: 'white' }}
                                onClick={e => { e.stopPropagation(); downloadPhoto(photos[lightboxIdx]); }}
                                disabled={downloading === photos[lightboxIdx].id}
                            >
                                {downloading === photos[lightboxIdx].id ? (
                                    <><Check size={14} /> Downloaded</>
                                ) : (
                                    <><Download size={14} /> Download</>
                                )}
                            </button>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
