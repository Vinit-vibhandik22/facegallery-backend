'use client';
import { useEffect, useState } from 'react';
import { Eye, Download, Link2, TrendingUp, ArrowUpRight, Loader2, FolderOpen, Image, Users } from 'lucide-react';
import { getProjects } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';

interface LinkData {
    id: string;
    view_count: number;
    download_count: number;
    is_active: boolean;
    expires_at: string;
    created_at: string;
    face_clusters: {
        label: string | null;
        photo_count: number;
        project_id: string;
    };
}

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
    const [links, setLinks] = useState<LinkData[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [projectData, linkData] = await Promise.all([
                    getProjects(),
                    supabase
                        .from('gallery_links')
                        .select('*, face_clusters!inner(label, photo_count, project_id)')
                        .order('view_count', { ascending: false }),
                ]);
                setProjects(projectData || []);
                setLinks((linkData.data as LinkData[]) || []);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Compute real stats
    const totalViews = links.reduce((sum, l) => sum + (l.view_count || 0), 0);
    const totalDownloads = links.reduce((sum, l) => sum + (l.download_count || 0), 0);
    const activeLinks = links.filter(l => l.is_active && new Date(l.expires_at) > new Date()).length;
    const totalPhotos = projects.reduce((sum, p) => sum + ((p.photo_count as number) || 0), 0);
    const totalClusters = projects.reduce((sum, p) => sum + ((p.cluster_count as number) || 0), 0);
    const engagement = totalViews > 0 ? Math.round((totalDownloads / totalViews) * 100) : 0;

    // Top galleries (sorted by views)
    const topGalleries = links
        .filter(l => l.face_clusters)
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 6);
    const maxViews = topGalleries.length > 0 ? Math.max(...topGalleries.map(g => g.view_count || 1)) : 1;

    // Generate "last 7 days" chart data from link creation dates
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return {
            date: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        };
    });

    // Distribute views/downloads proportionally across days based on link creation
    const dailyData = last7Days.map(day => {
        const dayLinks = links.filter(l => {
            const created = l.created_at?.split('T')[0];
            return created && created <= day.date;
        });
        const views = dayLinks.reduce((s, l) => s + Math.round((l.view_count || 0) / 7), 0);
        const downloads = dayLinks.reduce((s, l) => s + Math.round((l.download_count || 0) / 7), 0);
        return { ...day, views: views || 0, downloads: downloads || 0 };
    });
    const chartMax = Math.max(...dailyData.map(d => d.views), 1);

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <div>
                        <h1>Analytics</h1>
                        <div className="breadcrumb">Track engagement across all projects</div>
                    </div>
                </div>
                <div className="page-body" style={{ textAlign: 'center', padding: 60 }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Analytics</h1>
                    <div className="breadcrumb">Track engagement across all projects</div>
                </div>
            </div>
            <div className="page-body">
                {/* Top Stats */}
                <div className="grid grid-4" style={{ marginBottom: 32 }}>
                    {[
                        { label: 'Total Views', value: formatNumber(totalViews), icon: <Eye size={20} />, color: 'var(--color-primary-light)' },
                        { label: 'Total Downloads', value: formatNumber(totalDownloads), icon: <Download size={20} />, color: 'var(--color-accent)' },
                        { label: 'Active Links', value: activeLinks, icon: <Link2 size={20} />, color: 'var(--color-success)' },
                        { label: 'Engagement', value: `${engagement}%`, icon: <TrendingUp size={20} />, color: 'var(--color-warning)' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div className="stat-value">{s.value}</div>
                                    <div className="stat-label">{s.label}</div>
                                </div>
                                <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Project Overview */}
                <div className="grid grid-3" style={{ marginBottom: 32 }}>
                    {[
                        { label: 'Projects', value: projects.length, icon: <FolderOpen size={18} />, color: 'var(--color-primary)' },
                        { label: 'Photos Uploaded', value: formatNumber(totalPhotos), icon: <Image size={18} />, color: 'var(--color-accent)' },
                        { label: 'Face Clusters', value: formatNumber(totalClusters), icon: <Users size={18} />, color: 'var(--color-success)' },
                    ].map((s, i) => (
                        <div key={i} className="card animate-fade-in" style={{ animationDelay: `${(i + 4) * 0.1}s`, padding: '20px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                    {s.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{s.value}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-2">
                    {/* Bar Chart */}
                    <div className="card">
                        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 20, fontSize: '1rem' }}>Views & Downloads (7 Days)</h3>
                        {totalViews === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                <Eye size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                                <p style={{ fontSize: '0.85rem' }}>No gallery views yet. Share some gallery links!</p>
                            </div>
                        ) : (
                            <>
                                <div className="chart-bar-group" style={{ height: 180 }}>
                                    {dailyData.map((d, i) => (
                                        <div key={i} style={{ flex: 1, display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%' }}>
                                            <div className="chart-bar primary" style={{ height: `${Math.max((d.views / chartMax) * 100, 2)}%`, flex: 1 }} title={`${d.views} views`} />
                                            <div className="chart-bar accent" style={{ height: `${Math.max((d.downloads / chartMax) * 100, 2)}%`, flex: 1 }} title={`${d.downloads} downloads`} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                    {dailyData.map((d, i) => (
                                        <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>
                                            {d.label}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-primary)' }} /> Views
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-accent)' }} /> Downloads
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Top Galleries */}
                    <div className="card">
                        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 20, fontSize: '1rem' }}>Top Galleries</h3>
                        {topGalleries.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                <Link2 size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                                <p style={{ fontSize: '0.85rem' }}>No gallery links created yet.</p>
                            </div>
                        ) : (
                            topGalleries.map((g, i) => (
                                <div key={g.id} style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: 500 }}>{g.face_clusters?.label || 'Unlabeled'}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{g.view_count || 0} views · {g.download_count || 0} downloads</span>
                                    </div>
                                    <div className="progress-bar" style={{ height: 8 }}>
                                        <div className="progress-bar-fill" style={{ width: `${((g.view_count || 0) / maxViews) * 100}%` }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Per-Project Breakdown */}
                {projects.length > 0 && (
                    <div className="card" style={{ marginTop: 32 }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 20, fontSize: '1rem' }}>Project Breakdown</h3>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Project</th>
                                        <th>Photos</th>
                                        <th>Clusters</th>
                                        <th>Status</th>
                                        <th>Links</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map(p => {
                                        const projectLinks = links.filter(l => l.face_clusters?.project_id === p.id);
                                        const pViews = projectLinks.reduce((s, l) => s + (l.view_count || 0), 0);
                                        const statusClass = p.status === 'ready' ? 'badge-success' : p.status === 'processing' ? 'badge-warning' : 'badge-info';
                                        return (
                                            <tr key={p.id as string}>
                                                <td style={{ fontWeight: 600 }}>{p.name as string}</td>
                                                <td>{((p.photo_count as number) || 0).toLocaleString()}</td>
                                                <td>{(p.cluster_count as number) || 0}</td>
                                                <td><span className={`badge ${statusClass}`}>{p.status as string}</span></td>
                                                <td>{projectLinks.length} links · {pViews} views</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
