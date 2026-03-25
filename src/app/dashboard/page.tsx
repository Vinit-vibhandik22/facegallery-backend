'use client';
import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderOpen, Image, Users, Link2, ArrowRight, UploadCloud, Bell, CheckCircle2 } from 'lucide-react';
import NeuralNodeLoader from '@/components/ui/NeuralNodeLoader';
import { useAuth } from '@/lib/auth-context';
import { getProjects } from '@/lib/db';
import { formatDate, formatNumber } from '@/lib/utils';

// Helper component for Progress Ring
function ProgressRing({ percentage, label, value, color, icon }: { percentage: number, label: string, value: string, color: string, icon: React.ReactNode }) {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(percentage), 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="stat-card card-glass" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24, border: '1px solid var(--glass-border)' }}>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                    <circle 
                        cx="40" cy="40" r={radius} 
                        stroke={color} 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        strokeLinecap="round"
                    />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, filter: 'drop-shadow(0 0 8px ' + color + '44)' }}>
                    {icon}
                </div>
            </div>
            <div>
                <div className="stat-value" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}>{value}</div>
                <div className="stat-label" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</div>
            </div>
        </div>
    );
}

export default function DashboardOverview() {
    const { studio } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [showWarmupToast, setShowWarmupToast] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProjects()
            .then(data => setProjects(data || []))
            .catch(console.error)
            .finally(() => setLoading(false));

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
        const toastTimer = setTimeout(() => {
            if (backendStatus === 'loading') setShowWarmupToast(true);
        }, 1500);

        fetch(`${backendUrl}/health`)
            .then(res => {
                if (res.ok) {
                    setBackendStatus('ready');
                    setShowWarmupToast(false);
                } else {
                    setBackendStatus('error');
                }
            })
            .catch(() => setBackendStatus('error'))
            .finally(() => clearTimeout(toastTimer));
    }, []);

    // GSAP Stagger Entrance
    useLayoutEffect(() => {
        if (!loading && projects.length > 0) {
            gsap.fromTo(".project-list-item", 
                { opacity: 0, y: 30, filter: 'blur(10px)' }, 
                { 
                    opacity: 1, y: 0, filter: 'blur(0px)',
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power3.out",
                    delay: 0.2
                }
            );
        }
    }, [loading, projects.length]);

    const totalPhotos = projects.reduce((sum, p) => sum + ((p.photo_count as number) || 0), 0);
    const totalClusters = projects.reduce((sum, p) => sum + ((p.cluster_count as number) || 0), 0);
    const readyProjects = projects.filter(p => p.status === 'ready').length;

    const dragCounter = useRef(0);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current += 1;
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Quick redirect to new project with intent to upload
            router.push('/dashboard/projects?new=1');
        }
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = { ready: 'success', processing: 'warning', uploading: 'info', archived: 'muted' };
        return `badge badge-${map[status] || 'muted'}`;
    };

    return (
        <div 
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{ position: 'relative', minHeight: '100%' }}
        >
            {isDragging && (
                <div style={{ position: 'absolute', inset: -20, background: 'rgba(108,92,231,0.1)', border: '2px dashed var(--color-primary)', zIndex: 50, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <UploadCloud size={64} style={{ color: 'var(--color-primary)' }} className="animate-bounce" />
                    <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: 16 }}>Drop photos to create new project</h2>
                </div>
            )}

            {showWarmupToast && (
                <div className="card-glass" style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 100, border: '1px solid var(--color-warning)', padding: '16px 24px', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 14, animation: 'fadeIn 0.5s ease' }}>
                    <NeuralNodeLoader size={20} color="var(--color-warning)" />
                    <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>AI Engine Warming Up</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>HF Spaces cold-start (30-40s)</div>
                    </div>
                </div>
            )}
            
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <div className="breadcrumb">Welcome back, {studio?.name || 'Studio'}</div>
                </div>
                <Link href="/dashboard/projects?new=1" className="btn btn-primary">
                    New Project <ArrowRight size={16} />
                </Link>
            </div>
            
            <div className="page-body">
                {/* Stats Rings */}
                <div className="grid grid-4" style={{ marginBottom: 40 }}>
                    <ProgressRing percentage={100} label="Projects" value={String(projects.length)} color="var(--color-primary)" icon={<FolderOpen size={24} />} />
                    <ProgressRing percentage={totalPhotos > 0 ? 100 : 0} label="Processed" value={formatNumber(totalPhotos)} color="var(--color-accent)" icon={<Image size={24} />} />
                    <ProgressRing percentage={totalClusters > 0 ? 100 : 0} label="Clusters" value={formatNumber(totalClusters)} color="var(--color-success)" icon={<Users size={24} />} />
                    <ProgressRing percentage={projects.length ? (readyProjects / projects.length) * 100 : 0} label="Ready" value={String(readyProjects)} color="var(--color-warning)" icon={<Link2 size={24} />} />
                </div>

                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    <div style={{ flex: '2 1 500px' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 60 }}>
                                <NeuralNodeLoader size={48} />
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border-color)', background: 'transparent' }}>
                                <UploadCloud size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
                                <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Drag & drop photos here</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
                                    Or click the button below to start your first project manually.
                                </p>
                                <Link href="/dashboard/projects?new=1" className="btn btn-primary">
                                    Create First Project <ArrowRight size={16} />
                                </Link>
                            </div>
                        ) : (
                            <div className="card-glass" style={{ padding: 28 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600 }}>Recent Projects</h3>
                                    <Link href="/dashboard/projects" className="btn btn-ghost btn-sm" style={{ fontWeight: 500 }}>View All →</Link>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {projects.slice(0, 5).map((project) => (
                                        <Link
                                            key={project.id as string}
                                            href={`/dashboard/projects/${project.id}`}
                                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border-color)', textDecoration: 'none', transition: 'padding 0.2s', opacity: 0 }}
                                            className="hover-reveal project-list-item"
                                        >
                                            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <FolderOpen size={20} style={{ color: 'var(--color-primary)' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{project.name as string}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                                    {(project.photo_count as number) || 0} photos · {(project.cluster_count as number) || 0} clusters
                                                    {project.event_date ? ` · ${formatDate(String(project.event_date))}` : ''}
                                                </div>
                                            </div>
                                            <span className={statusBadge(project.status as string)}>{project.status as string}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Real-time Activity Feed Panel */}
                    <div style={{ flex: '1 1 300px' }}>
                        <div className="card-glass" style={{ height: '100%', padding: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Bell size={18} style={{ color: 'var(--color-primary)' }} />
                                </div>
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Activity</h3>
                                <div style={{ width: 8, height: 8, background: 'var(--color-success)', borderRadius: '50%', marginLeft: 'auto', boxShadow: '0 0 10px var(--color-success)' }} className="animate-pulse" />
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {[
                                    { msg: "Client downloaded ZIP from Smith Wedding", time: "2m ago", icon: <CheckCircle2 size={16} color="var(--color-success)" /> },
                                    { msg: "New link generated for Person #4", time: "15m ago", icon: <Link2 size={16} color="var(--color-primary)" /> },
                                    { msg: "Processed 500 photos in Corporate Event", time: "1h ago", icon: <Users size={16} color="var(--color-accent)" /> },
                                    { msg: "Project 'Graduation 2026' created", time: "3h ago", icon: <FolderOpen size={16} color="var(--text-muted)" /> },
                                ].map((activity, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 16, fontSize: '0.875rem', position: 'relative' }}>
                                        {i < 3 && <div style={{ position: 'absolute', left: 8, top: 24, bottom: -16, width: 1, background: 'var(--border-color)' }} />}
                                        <div style={{ marginTop: 2, background: 'var(--bg-dark)', borderRadius: '50%', zIndex: 1 }}>{activity.icon}</div>
                                        <div>
                                            <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>{activity.msg}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{activity.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
