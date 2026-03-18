'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Camera, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [studioName, setStudioName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const { signIn, signUp } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (mode === 'login') {
            const { error: err } = await signIn(email, password);
            if (err) setError(err);
            else router.push('/dashboard');
        } else {
            if (!studioName.trim()) { setError('Studio name is required'); setLoading(false); return; }
            const { error: err } = await signUp(email, password, studioName);
            if (err) setError(err);
            else setSuccess('Account created! Check your email to confirm, then log in.');
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-dark)', position: 'relative', overflow: 'hidden' }}>
            {/* Background glow */}
            <div style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle, rgba(108,92,231,0.15), transparent 70%)', top: '20%', left: '30%', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Link href="/" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700, background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ⬡ FaceGallery
                    </Link>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.9rem' }}>
                        {mode === 'login' ? 'Welcome back to your studio' : 'Create your studio account'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="card" style={{ padding: 32 }}>
                    {/* Mode Toggle */}
                    <div style={{ display: 'flex', marginBottom: 28, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
                        <button
                            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem', background: mode === 'login' ? 'var(--color-primary)' : 'transparent', color: mode === 'login' ? 'white' : 'var(--text-secondary)', transition: 'var(--transition)', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)' }}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem', background: mode === 'signup' ? 'var(--color-primary)' : 'transparent', color: mode === 'signup' ? 'white' : 'var(--text-secondary)', transition: 'var(--transition)', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)' }}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {mode === 'signup' && (
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                                        <User size={14} /> Studio Name
                                    </label>
                                    <input className="input" placeholder="e.g., Luminance Studios" value={studioName} onChange={e => setStudioName(e.target.value)} required />
                                </div>
                            )}
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                                    <Mail size={14} /> Email
                                </label>
                                <input className="input" type="email" placeholder="you@studio.com" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                                    <Lock size={14} /> Password
                                </label>
                                <input className="input" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
                            </div>
                        </div>

                        {error && (
                            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,118,117,0.1)', border: '1px solid rgba(255,118,117,0.3)', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,184,148,0.1)', border: '1px solid rgba(0,184,148,0.3)', color: 'var(--color-success)', fontSize: '0.85rem' }}>
                                {success}
                            </div>
                        )}

                        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
                            {loading ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
                            {mode === 'login' ? 'Log In' : 'Create Account'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
