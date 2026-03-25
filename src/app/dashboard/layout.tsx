'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LayoutDashboard, FolderOpen, Settings, BarChart3, Zap, LogOut, Bell, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import NeuralNodeLoader from '@/components/ui/NeuralNodeLoader';
import { useEffect, useState } from 'react';

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview', exact: true },
    { href: '/dashboard/projects', icon: FolderOpen, label: 'Projects' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/dashboard/settings', icon: Settings, label: 'White-Label' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, studio, loading, signOut } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [notificationsActive, setNotificationsActive] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key.toLowerCase() === 'n') {
                e.preventDefault();
                router.push('/dashboard/projects?new=1');
            } else if (e.key.toLowerCase() === 'p') {
                e.preventDefault();
                router.push('/dashboard/projects');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-obsidian)' }}>
                <NeuralNodeLoader size={48} />
            </div>
        );
    }

    if (!user) return null;

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    const initials = studio?.name
        ? studio.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : 'CR';

    return (
        <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-document)' }}>
            <aside className="sidebar" style={{ width: isCollapsed ? 80 : 250, transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', borderBottom: '1px solid var(--border-color)' }}>
                    {!isCollapsed && <div className="sidebar-logo" style={{ margin: 0 }}>⬡ ClustR AI</div>}
                    {isCollapsed && <div className="sidebar-logo" style={{ margin: 0, fontSize: '1.5rem' }}>⬡</div>}
                    <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <nav className="sidebar-nav" style={{ flex: 1, padding: '20px 10px' }}>
                    {!isCollapsed && <div className="sidebar-section" style={{ paddingLeft: 10, marginBottom: 8 }}>Main</div>}
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive(item.href, item.exact) ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 'var(--radius-md)', justifyContent: isCollapsed ? 'center' : 'flex-start', marginBottom: 4 }}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon size={18} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    ))}

                    <div style={{ marginTop: 24, paddingLeft: isCollapsed ? 0 : 10, marginBottom: 8 }}>
                        {!isCollapsed && <div className="sidebar-section">Quick Actions</div>}
                    </div>
                    <Link href="/dashboard/projects?new=1" className="sidebar-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 'var(--radius-md)', justifyContent: isCollapsed ? 'center' : 'flex-start' }} title={isCollapsed ? "New Project (N)" : undefined}>
                        <Zap size={18} />
                        {!isCollapsed && <span>New Project <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>[N]</span></span>}
                    </Link>
                </nav>

                <div className="sidebar-footer" style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
                    <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div className="sidebar-avatar" style={{ minWidth: 32 }}>{initials}</div>
                        {!isCollapsed && (
                            <div className="sidebar-user-info" style={{ overflow: 'hidden' }}>
                                <div className="name" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{studio?.name || 'My Studio'}</div>
                                <div className="plan" style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{studio?.plan || 'starter'} Plan</div>
                            </div>
                        )}
                    </div>
                    <button onClick={signOut} className="sidebar-link" style={{ color: 'var(--text-muted)', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '8px', borderRadius: 'var(--radius-md)', justifyContent: isCollapsed ? 'center' : 'flex-start', background: 'none', border: 'none', cursor: 'pointer' }} title={isCollapsed ? "Sign Out" : undefined}>
                        <LogOut size={16} />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Header Context */}
                <header style={{ height: 64, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px', background: 'var(--bg-document)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12, marginRight: 16 }}>
                            <span title="Press N for New Project">kbd: N</span>
                            <span title="Press P for Projects">kbd: P</span>
                        </div>
                        <button onClick={() => setNotificationsActive(!notificationsActive)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <Bell size={20} className={notificationsActive ? "animate-bounce" : ""} />
                            <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--color-danger)', borderRadius: '50%' }} />
                        </button>
                    </div>
                </header>

                <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
