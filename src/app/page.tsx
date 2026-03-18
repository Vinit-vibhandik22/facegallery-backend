'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Users, Link2, BarChart3, Shield, Zap, ArrowRight, CheckCircle2, Sparkles, Globe, Eye, UploadCloud, Cpu, Share2 } from 'lucide-react';

function CountUp({ end, suffix = '', duration = 2000 }: { end: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return <span>{count}{suffix}</span>;
}

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);

  const stepperData = [
    { icon: <UploadCloud size={32} />, title: "1. Upload Projects", description: "Drag & drop your event photos. Works with 10k+ images. We create a secure project workspace automatically." },
    { icon: <Cpu size={32} />, title: "2. AI Face Clustering", description: "Our AI analyzes faces in seconds, generating private clusters for each person without manual tagging." },
    { icon: <Share2 size={32} />, title: "3. Deliver & Impress", description: "Send private gallery links via email or SMS. Clients see only their photos in a beautiful web app." }
  ];

  return (
    <div>
      {/* NAV */}
      <nav className="landing-nav">
        <div className="logo">⬡ FaceGallery</div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(108,92,231,0.12)', border: '1px solid rgba(108,92,231,0.25)', borderRadius: 'var(--radius-full)', padding: '6px 18px', marginBottom: 24, fontSize: '0.85rem', color: 'var(--color-primary-light)' }}>
            <Sparkles size={14} /> AI-Powered Photo Delivery Platform
          </div>
          <h1 className="hero-title">
            Deliver the Right Photos<br />to the Right People
          </h1>
          <p className="hero-subtitle">
            Upload thousands of event photos. Our AI automatically groups them by face. Generate unique gallery links for each person — no client accounts needed.
          </p>
          <div className="hero-cta">
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Try the Dashboard <ArrowRight size={18} />
            </Link>
            <Link href="/gallery/a1b2-c3d4-e5f6" className="btn btn-secondary btn-lg">
              <Eye size={18} /> See Client Gallery
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 48, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}><CountUp end={50} suffix="K+" /></strong> Photos Processed</span>
            <span><strong style={{ color: 'var(--text-primary)' }}><CountUp end={200} suffix="+" /></strong> Studios</span>
            <span><strong style={{ color: 'var(--text-primary)' }}><CountUp end={92} suffix="%+" /></strong> Accuracy</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="landing-section">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything Studios Need</h2>
        <p className="section-subtitle">Built for professional photographers who handle thousands of photos per event.</p>
        <div className="grid grid-3">
          {[
            { icon: <Camera size={22} />, title: 'Bulk Upload', desc: 'Upload up to 100,000 photos per project. Drag and drop or connect your S3, Google Drive, or Dropbox.' },
            { icon: <Users size={22} />, title: 'AI Face Clustering', desc: 'Automatically detect and group photos by face. Group photos appear in multiple clusters. No manual sorting.' },
            { icon: <Link2 size={22} />, title: 'Shareable Gallery Links', desc: 'Generate unique, expiring URLs per face cluster. Share via email, WhatsApp, CRM — your workflow, amplified.' },
            { icon: <Shield size={22} />, title: 'Privacy by Design', desc: 'Face embeddings are transient — used only for clustering, then deleted. No biometric database. GDPR & CCPA ready.' },
            { icon: <Globe size={22} />, title: 'White-Label Everything', desc: 'Your logo, your colors, your domain. Clients see your brand, not ours. Premium gallery experience.' },
            { icon: <BarChart3 size={22} />, title: 'Analytics & Insights', desc: 'Track link opens, photo downloads, and engagement per recipient. Know which galleries perform.' },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS - INTERACTIVE 3-STEP */}
      <section id="how-it-works" className="landing-section" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="section-label">How It Works</div>
        <h2 className="section-title">From Upload to Delivery in 3 Steps</h2>
        <p className="section-subtitle">A seamless experience for both photographers and clients.</p>
        
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 40, alignItems: 'center', background: 'var(--bg-surface)', padding: 40, borderRadius: 'var(--radius-lg)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stepperData.map((step, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveStep(idx)}
                style={{ 
                  padding: 24, 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  border: `2px solid ${activeStep === idx ? 'var(--color-primary)' : 'transparent'}`,
                  background: activeStep === idx ? 'rgba(108,92,231,0.05)' : 'transparent',
                  transform: activeStep === idx ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                  <div style={{ color: activeStep === idx ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                    {step.icon}
                  </div>
                  <h3 style={{ margin: 0, color: activeStep === idx ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {step.title}
                  </h3>
                </div>
                {activeStep === idx && (
                  <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', paddingLeft: 48, fontSize: '0.95rem' }}>
                    {step.description}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {/* Animated Graphic Window */}
          <div style={{ flex: 1, height: 300, background: 'var(--bg-document)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            {activeStep === 0 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <UploadCloud size={64} style={{ color: 'var(--color-primary)' }} className="animate-bounce" />
                <div style={{ width: 120, height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', background: 'var(--color-primary)' }} className="animate-pulse" />
                </div>
              </div>
            )}
            {activeStep === 1 && (
              <div className="animate-fade-in" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={32} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} className="animate-pulse" />)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ width: 32, height: 32, background: 'var(--color-accent)', borderRadius: 4 }} />)}
                </div>
              </div>
            )}
            {activeStep === 2 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                <div style={{ padding: '12px 24px', background: 'var(--color-success)', color: 'white', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <Link2 size={16} /> Link Copied
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={16} /></div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={16} /></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="landing-section" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-label">Pricing</div>
          <h2 className="section-title">Plans for Every Studio</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>Studios pay. Clients don&apos;t. Simple.</p>
        </div>
        <div className="grid grid-4" style={{ maxWidth: 1100, margin: '0 auto' }}>
          {[
            { name: 'Starter', price: '$49', period: '/mo', projects: '3 projects/mo', photos: '2,000 photos/project', features: ['Face clustering', 'Gallery links', 'Basic analytics', 'Email support'] },
            { name: 'Professional', price: '$149', period: '/mo', projects: '15 projects/mo', photos: '10,000 photos/project', featured: true, features: ['Everything in Starter', 'API access', 'White-label branding', 'Priority support', 'CSV export'] },
            { name: 'Agency', price: '$399', period: '/mo', projects: 'Unlimited projects', photos: '50,000 photos/project', features: ['Everything in Professional', 'Custom domain', 'Webhook notifications', 'Dedicated account manager'] },
            { name: 'Enterprise', price: 'Custom', period: '', projects: 'Custom limits', photos: 'Custom storage', features: ['Everything in Agency', 'SLA guarantee', 'Custom integrations', 'On-premise option', 'Volume discounts'] },
          ].map((p, i) => (
            <div key={i} className={`pricing-card ${p.featured ? 'featured' : ''}`}>
              {p.featured && <div className="pricing-popular">Most Popular</div>}
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>{p.name}</h3>
              <div className="price">{p.price}<span>{p.period}</span></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.projects} · {p.photos}</div>
              <ul>
                {p.features.map((f, j) => <li key={j}>{f}</li>)}
              </ul>
              <button className={`btn ${p.featured ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'center' }}>
                {p.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(108,92,231,0.12), transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: 16 }}>
            Ready to Transform Your Photo Delivery?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto 32px' }}>
            Join 200+ studios already delivering smarter photo experiences.
          </p>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Start Free Trial <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⬡ FaceGallery
        </div>
        <p>AI-powered photo delivery for professional studios.</p>
        <p style={{ marginTop: 8 }}>© 2026 FaceGallery. Privacy by design.</p>
      </footer>
    </div>
  );
}
