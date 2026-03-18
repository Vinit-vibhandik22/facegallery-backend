'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Image as ImageIcon, Users, Calendar, Filter, Loader2, Trash2, Edit2, CheckSquare } from 'lucide-react';
import { getProjects, createProject, deleteProject, updateProject } from '@/lib/db';
import { formatDate } from '@/lib/utils';

function ProjectCard({ 
    project, 
    onDelete, 
    delay, 
    isSelected, 
    onToggleSelect,
    topClusters = []
}: { 
    project: any, 
    onDelete: (id: string, e: React.MouseEvent) => void, 
    delay: number,
    isSelected: boolean,
    onToggleSelect: (id: string, e: React.MouseEvent) => void,
    topClusters?: any[]
}) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(project.name as string);
    const [isHovered, setIsHovered] = useState(false);

    const handleRenameSubmit = async (e?: React.FormEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!renameValue.trim() || renameValue === project.name) {
            setIsRenaming(false);
            setRenameValue(project.name);
            return;
        }
        try {
            await updateProject(project.id, { name: renameValue });
            project.name = renameValue; // Optimistic update
        } catch (err) {
            console.error(err);
        }
        setIsRenaming(false);
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = { ready: 'success', processing: 'warning', uploading: 'info', archived: 'muted' };
        return `badge badge-${map[status] || 'muted'}`;
    };

    return (
        <div 
            className={`project-card animate-fade-in ${isSelected ? 'selected' : ''}`} 
            style={{ animationDelay: `${delay}s`, position: 'relative', border: isSelected ? '2px solid var(--color-primary)' : undefined }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/dashboard/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="project-card-cover" style={{ background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {project.cover_photo_url ? (
                        <img src={project.cover_photo_url as string} alt={project.name as string} />
                    ) : (
                        <ImageIcon size={40} style={{ color: 'var(--text-muted)' }} />
                    )}
                    
                    <span className={statusBadge(project.status as string)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                        {project.status as string}
                    </span>
                    
                    <button onClick={(e) => onDelete(project.id as string, e)} className="btn btn-icon" style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', color: 'var(--color-danger)', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', zIndex: 10 }}>
                        <Trash2 size={14} />
                    </button>

                    {/* Hover Cluster Previews */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: -8, opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s ease', transform: isHovered ? 'translateY(0)' : 'translateY(10px)' }}>
                        {topClusters.length > 0 ? (
                            topClusters.map((c, i) => (
                                <div key={c.id} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-document)', border: '2px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -12 : 0, zIndex: 4 - i, position: 'relative', overflow: 'hidden' }}>
                                    <img src={c.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))
                        ) : (
                            [1,2,3].map(i => (
                                <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-document)', border: '2px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 1 ? -12 : 0, zIndex: 4 - i, position: 'relative' }}>
                                    <Users size={14} style={{ color: 'var(--text-secondary)' }} />
                                </div>
                            ))
                        )}
                        <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600, marginLeft: 8 }}>{topClusters.length > 0 ? 'Face Previews' : 'No clusters'}</span>
                    </div>
                </div>
            </Link>

            {/* Checkbox for Multi-select */}
            <div style={{ position: 'absolute', top: 12, left: 48, zIndex: 10, opacity: (isHovered || isSelected) ? 1 : 0, transition: 'opacity 0.2s' }}>
                <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={(e) => {
                        // Prevent click from navigating if clicking the checkbox directly
                        // But onChange is better handled via onClick on a wrapper to prevent Link
                    }}
                    onClick={(e) => onToggleSelect(project.id, e)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
            </div>

            <div className="project-card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    {isRenaming ? (
                        <form onSubmit={handleRenameSubmit} style={{ flex: 1, marginRight: 8 }}>
                            <input 
                                autoFocus 
                                className="input" 
                                style={{ padding: '4px 8px', fontSize: '1rem', height: 'auto', marginBottom: 0 }} 
                                value={renameValue} 
                                onChange={e => setRenameValue(e.target.value)} 
                                onBlur={() => handleRenameSubmit()}
                                onClick={e => e.stopPropagation()}
                            />
                        </form>
                    ) : (
                        <h3 
                            title="Click to rename"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsRenaming(true); }}
                            style={{ margin: 0, cursor: 'text', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                            {project.name as string}
                        </h3>
                    )}
                    {!isRenaming && <Edit2 size={14} style={{ opacity: isHovered ? 0.5 : 0, cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsRenaming(true); }} />}
                </div>

                <Link href={`/dashboard/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div className="meta">
                        {project.event_date ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={13} /> {formatDate(String(project.event_date))}
                            </span>
                        ) : null}
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ImageIcon size={13} /> {((project.photo_count as number) || 0).toLocaleString()} photos
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={13} /> {(project.cluster_count as number) || 0} clusters
                        </span>
                    </div>
                    {project.status === 'processing' && (
                        <div style={{ marginTop: 12 }}>
                            <div className="progress-bar">
                                <div className="progress-bar-fill" style={{ width: `${(project.processing_progress as number) || 0}%` }} />
                            </div>
                        </div>
                    )}
                </Link>
            </div>
        </div>
    );
}

export default function ProjectsPage() {
    const searchParams = useSearchParams();
    const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [showNewModal, setShowNewModal] = useState(searchParams.get('new') === '1');
    const [newName, setNewName] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    
    // Multi-select state
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

    const [projectClusters, setProjectClusters] = useState<Record<string, any[]>>({});

    const loadProjects = async () => {
        try {
            const data = await getProjects();
            setProjects(data || []);
            
            // Batch fetch top 3 clusters for all projects
            if (data && data.length > 0) {
                const { data: clusters, error } = await (await import('@/lib/supabase')).supabase
                    .from('face_clusters')
                    .select('id, project_id, thumbnail_url')
                    .in('project_id', data.map(p => p.id))
                    .order('photo_count', { ascending: false });
                
                if (!error && clusters) {
                    const mapped: Record<string, any[]> = {};
                    clusters.forEach(c => {
                        if (!mapped[c.project_id]) mapped[c.project_id] = [];
                        if (mapped[c.project_id].length < 3) mapped[c.project_id].push(c);
                    });
                    setProjectClusters(mapped);
                }
            }
        } catch (err) {
            console.error('Failed to load projects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProjects(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        setCreateError('');
        try {
            await createProject(newName, newDate, newDesc);
            setShowNewModal(false);
            setNewName('');
            setNewDate('');
            setNewDesc('');
            await loadProjects();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : (err as Record<string, string>)?.message || String(err);
            console.error('Failed to create project:', msg);
            setCreateError(msg || 'Failed to create project. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!confirm('Delete this project and all its photos?')) return;
        try {
            await deleteProject(id);
            await loadProjects();
            setSelectedProjects(prev => { const n = new Set(prev); n.delete(id); return n; });
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedProjects.size} selected projects and all their photos?`)) return;
        try {
            for (const id of selectedProjects) {
                await deleteProject(id);
            }
            setSelectedProjects(new Set());
            await loadProjects();
        } catch (err) {
            console.error('Bulk delete failed', err);
        }
    };

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedProjects(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filtered = projects.filter(p => {
        if (filter !== 'all' && p.status !== filter) return false;
        if (search && !(p.name as string).toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Projects</h1>
                    <div className="breadcrumb">Manage your photo projects</div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
                    <Plus size={16} /> New Project
                </button>
            </div>
            <div className="page-body">
                {/* Bulk Actions Bar */}
                {selectedProjects.size > 0 && (
                    <div className="card animate-fade-in" style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-primary-light)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600 }}>
                            <CheckSquare size={18} />
                            {selectedProjects.size} project{selectedProjects.size !== 1 ? 's' : ''} selected
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }} onClick={() => setSelectedProjects(new Set())}>Cancel</button>
                            <button className="btn btn-sm" style={{ background: 'var(--color-danger)', color: 'white', border: 'none' }} onClick={handleBulkDelete}>
                                <Trash2 size={14} /> Bulk Delete
                            </button>
                        </div>
                    </div>
                )}
                
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
                        <Search size={16} />
                        <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['all', 'ready', 'processing', 'uploading', 'archived'].map(f => (
                            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <Filter size={48} />
                        <h3>{projects.length === 0 ? 'No projects yet' : 'No projects found'}</h3>
                        <p>{projects.length === 0 ? 'Create your first project to get started.' : 'Try adjusting your search or filter.'}</p>
                        {projects.length === 0 && (
                            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowNewModal(true)}>
                                <Plus size={16} /> Create First Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-3">
                        {filtered.map((project, i) => (
                            <ProjectCard 
                                key={project.id as string} 
                                project={project} 
                                onDelete={handleDelete} 
                                delay={i * 0.05} 
                                isSelected={selectedProjects.has(project.id as string)}
                                onToggleSelect={toggleSelect}
                                topClusters={projectClusters[project.id as string]}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showNewModal && (
                <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Create New Project</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Project Name *</label>
                                    <input className="input" placeholder="e.g., Smith Wedding – June 2026" value={newName} onChange={e => setNewName(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Event Date</label>
                                    <input className="input" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Description</label>
                                    <textarea className="input" rows={3} placeholder="Optional details..." value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ resize: 'vertical' }} />
                                </div>
                                {createError && (
                                    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                                        {createError}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={creating}>
                                        {creating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                                        Create Project
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
