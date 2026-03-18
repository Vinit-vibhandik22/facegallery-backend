'use client';
import { useState } from 'react';
import { Save, Eye, Palette, Globe, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { updateStudioSettings } from '@/lib/db';

export default function SettingsPage() {
    const { studio, refreshStudio } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        name: studio?.name || '',
        brand_color: studio?.brand_color || '#6C5CE7',
        brand_color_secondary: studio?.brand_color_secondary || '#A29BFE',
        gallery_title: studio?.gallery_title || 'Your Photos Are Ready',
        gallery_subtitle: studio?.gallery_subtitle || 'Browse and download your personalized gallery',
        show_powered_by: studio?.show_powered_by ?? true,
        allow_downloads: studio?.allow_downloads ?? true,
        allow_social_share: studio?.allow_social_share ?? false,
        default_link_expiry_days: studio?.default_link_expiry_days || 30,
    });

    const update = (key: string, value: string | boolean | number) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStudioSettings(form);
            await refreshStudio();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save settings:', err);
        }
        setSaving(false);
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>White-Label Settings</h1>
                    <div className="breadcrumb">Customize your client gallery experience</div>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                    {saved ? '✓ Saved!' : 'Save Changes'}
                </button>
            </div>
            <div className="page-body">
                <div className="grid grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Palette size={18} style={{ color: 'var(--color-primary-light)' }} />
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>Branding</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Studio Name</label>
                                    <input className="input" value={form.name} onChange={e => update('name', e.target.value)} />
                                </div>
                                <div className="grid grid-2">
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Primary Color</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input type="color" value={form.brand_color} onChange={e => update('brand_color', e.target.value)} style={{ width: 44, height: 38, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }} />
                                            <input className="input" value={form.brand_color} onChange={e => update('brand_color', e.target.value)} style={{ flex: 1 }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Secondary Color</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input type="color" value={form.brand_color_secondary} onChange={e => update('brand_color_secondary', e.target.value)} style={{ width: 44, height: 38, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }} />
                                            <input className="input" value={form.brand_color_secondary} onChange={e => update('brand_color_secondary', e.target.value)} style={{ flex: 1 }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Eye size={18} style={{ color: 'var(--color-primary-light)' }} />
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>Gallery Content</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Gallery Title</label>
                                    <input className="input" value={form.gallery_title} onChange={e => update('gallery_title', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Gallery Subtitle</label>
                                    <input className="input" value={form.gallery_subtitle} onChange={e => update('gallery_subtitle', e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Clock size={18} style={{ color: 'var(--color-primary-light)' }} />
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>Options</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {[
                                    { key: 'allow_downloads', label: 'Allow Downloads', desc: 'Let clients download photos' },
                                    { key: 'allow_social_share', label: 'Social Sharing', desc: 'Show share buttons' },
                                    { key: 'show_powered_by', label: '"Powered by FaceGallery"', desc: 'Show attribution' },
                                ].map(opt => (
                                    <div key={opt.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{opt.label}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{opt.desc}</div>
                                        </div>
                                        <label className="toggle">
                                            <input type="checkbox" checked={form[opt.key as keyof typeof form] as boolean} onChange={e => update(opt.key, e.target.checked)} />
                                            <span className="toggle-slider" />
                                        </label>
                                    </div>
                                ))}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Link Expiry (days)</label>
                                    <input className="input" type="number" value={form.default_link_expiry_days} onChange={e => update('default_link_expiry_days', parseInt(e.target.value) || 30)} style={{ maxWidth: 120 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Preview */}
                    <div>
                        <div className="card" style={{ position: 'sticky', top: 100 }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: 16 }}>Gallery Preview</h3>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-dark)' }}>
                                <div style={{ padding: '32px 24px', textAlign: 'center', background: `linear-gradient(180deg, ${form.brand_color}15, transparent)`, borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>{form.name}</div>
                                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: 6 }}>{form.gallery_title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{form.gallery_subtitle}</p>
                                </div>
                                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                                    {[10, 11, 12, 13, 14, 15].map(id => (
                                        <div key={id} style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden' }}>
                                            <img src={`https://picsum.photos/id/${id}/200/200`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                                {form.show_powered_by && (
                                    <div style={{ textAlign: 'center', padding: 12, fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
                                        Powered by FaceGallery
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
