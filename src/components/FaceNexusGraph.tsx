'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ZoomIn, ZoomOut, Maximize2, Share2 } from 'lucide-react';

interface Node {
    id: string;
    label: string;
    thumbnail: string;
    photoCount: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface Link {
    source: string;
    target: string;
    shares: number;
}

export default function FaceNexusGraph({ projectId, clusters }: { projectId: string, clusters: any[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [links, setLinks] = useState<Link[]>([]);
    const [loadingLinks, setLoadingLinks] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Fetch link data (shared photos)
    useEffect(() => {
        async function fetchLinks() {
            setLoadingLinks(true);
            try {
                // Fetch all mappings for this project
                // In a large project, we might need a more optimized query or view
                const { data: mappings, error } = await supabase
                    .from('photo_cluster_map')
                    .select('photo_id, cluster_id')
                    .in('cluster_id', clusters.map(c => c.id));
                
                if (error) throw error;

                // Group clusters by photo
                const photoGroups: Record<string, string[]> = {};
                mappings?.forEach(m => {
                    if (!photoGroups[m.photo_id]) photoGroups[m.photo_id] = [];
                    photoGroups[m.photo_id].push(m.cluster_id);
                });

                // Count co-occurrences
                const coCounts: Record<string, number> = {};
                Object.values(photoGroups).forEach(group => {
                    if (group.length < 2) return;
                    for (let i = 0; i < group.length; i++) {
                        for (let j = i + 1; j < group.length; j++) {
                            const pair = [group[i], group[j]].sort().join('-');
                            coCounts[pair] = (coCounts[pair] || 0) + 1;
                        }
                    }
                });

                const linkArray = Object.entries(coCounts).map(([pair, shares]) => {
                    const [source, target] = pair.split('-');
                    return { source, target, shares };
                });

                setLinks(linkArray);
            } catch (err) {
                console.error('Failed to fetch nexus links:', err);
            } finally {
                setLoadingLinks(false);
            }
        }
        if (clusters.length > 0) fetchLinks();
    }, [projectId, clusters]);

    // Force Simulation logic
    const nodesRef = useRef<Node[]>([]);
    
    useEffect(() => {
        if (clusters.length === 0) return;

        // Initialize nodes with random positions if not already set
        const initialNodes: Node[] = clusters.map((c, i) => ({
            id: c.id,
            label: c.label || `Person #${i + 1}`,
            thumbnail: c.thumbnail_url,
            photoCount: c.photo_count,
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: 0,
            vy: 0,
        }));
        nodesRef.current = initialNodes;

        let animationFrame: number;
        
        const simulation = () => {
            const nodes = nodesRef.current;
            const width = canvasRef.current?.width || 800;
            const height = canvasRef.current?.height || 600;

            // Simple Force Simulation
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                
                // 1. Center force
                node.vx += (width / 2 - node.x) * 0.001;
                node.vy += (height / 2 - node.y) * 0.001;

                // 2. Repulsion (Charge)
                for (let j = 0; j < nodes.length; j++) {
                    if (i === j) continue;
                    const other = nodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const distSq = dx * dx + dy * dy + 1;
                    const force = 500 / distSq;
                    node.vx += (dx / Math.sqrt(distSq)) * force;
                    node.vy += (dy / Math.sqrt(distSq)) * force;
                }

                // 3. Link forces
                links.forEach(link => {
                    if (link.source === node.id || link.target === node.id) {
                        const otherId = link.source === node.id ? link.target : link.source;
                        const other = nodes.find(n => n.id === otherId);
                        if (other) {
                            const dx = other.x - node.x;
                            const dy = other.y - node.y;
                            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                            const strength = 0.05 * link.shares;
                            const desiredDist = 150;
                            const f = (dist - desiredDist) * strength;
                            node.vx += (dx / dist) * f;
                            node.vy += (dy / dist) * f;
                        }
                    }
                });

                // Apply velocity and drag
                node.x += node.vx;
                node.y += node.vy;
                node.vx *= 0.9;
                node.vy *= 0.9;
            }

            draw();
            animationFrame = requestAnimationFrame(simulation);
        };

        const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(offset.x, offset.y);
            ctx.scale(zoom, zoom);

            // Draw Links
            ctx.strokeStyle = 'rgba(108, 92, 231, 0.2)';
            ctx.lineWidth = 1;
            links.forEach(link => {
                const s = nodesRef.current.find(n => n.id === link.source);
                const t = nodesRef.current.find(n => n.id === link.target);
                if (s && t) {
                    ctx.beginPath();
                    ctx.lineWidth = Math.min(link.shares, 5);
                    ctx.moveTo(s.x, s.y);
                    ctx.lineTo(t.x, t.y);
                    ctx.stroke();
                }
            });

            // Draw Nodes
            nodesRef.current.forEach(node => {
                const isHovered = hoveredNode === node.id;
                
                // Glow effect for hovered node
                if (isHovered) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = 'var(--color-primary)';
                }

                // Node Circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
                ctx.fillStyle = 'var(--bg-card)';
                ctx.fill();
                ctx.strokeStyle = isHovered ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw Label
                ctx.fillStyle = 'var(--text-primary)';
                ctx.font = 'bold 12px Inter, system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(node.label, node.x, node.y + 45);

                // Reset shadow
                ctx.shadowBlur = 0;
            });

            ctx.restore();
        };

        animationFrame = requestAnimationFrame(simulation);
        return () => cancelAnimationFrame(animationFrame);
    }, [clusters, links, zoom, offset, hoveredNode]);

    // Handle interactions
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5));
    };

    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current) {
            const dx = e.clientX - lastPos.current.x;
            const dy = e.clientY - lastPos.current.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastPos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        // Check for node hover
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left - offset.x) / zoom;
        const my = (e.clientY - rect.top - offset.y) / zoom;

        let found: string | null = null;
        nodesRef.current.forEach(node => {
            const dx = mx - node.x;
            const dy = my - node.y;
            if (Math.sqrt(dx * dx + dy * dy) < 30) {
                found = node.id;
            }
        });
        setHoveredNode(found);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    if (loadingLinks) {
        return (
            <div style={{ height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Mapping relationships...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: 600, background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: 8 }}>
                <div style={{ background: 'var(--bg-card)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Share2 size={12} /> INTERACTIVE NEXUS
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ padding: 8 }} onClick={() => setZoom(prev => prev * 1.2)}><ZoomIn size={16} /></button>
                <button className="btn btn-secondary btn-sm" style={{ padding: 8 }} onClick={() => setZoom(prev => prev * 0.8)}><ZoomOut size={16} /></button>
                <button className="btn btn-secondary btn-sm" style={{ padding: 8 }} onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}><Maximize2 size={16} /></button>
            </div>

            <canvas
                ref={canvasRef}
                width={1200}
                height={800}
                style={{ width: '100%', height: '100%', cursor: isDragging.current ? 'grabbing' : 'crosshair' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { handleMouseUp(); setHoveredNode(null); }}
            />

            {hoveredNode && (
                <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)', boxShadow: 'var(--shadow-lg)', pointerEvents: 'none', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{nodesRef.current.find(n => n.id === hoveredNode)?.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}> Shared {links.filter(l => l.source === hoveredNode || l.target === hoveredNode).length} connections</div>
                </div>
            )}
        </div>
    );
}
