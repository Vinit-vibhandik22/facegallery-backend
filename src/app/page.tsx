'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Camera, Users, Link2, BarChart3, Shield, Zap, ArrowRight, CheckCircle2, Sparkles, Globe, Eye, UploadCloud, Cpu, Share2, TrendingUp, Layers, MousePointer2, ChevronRight, Play } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis } from 'lenis/react';
import StickyScroll from '@/components/ui/sticky-scroll';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

function CountUp({ end, suffix = '', duration = 2 }: { end: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to({ val: 0 }, {
        val: end,
        duration,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
        onUpdate: function() {
          setCount(Math.floor((this as any).targets()[0].val));
        }
      });
    });
    return () => ctx.revert();
  }, [end, duration]);
  
  return <span ref={containerRef} className="animated-gilded-text">{count}{suffix}</span>;
}

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Custom Cursor Followering
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
           left: e.clientX,
           top: e.clientY,
           duration: 0.1,
           ease: 'power3.out'
        });
      }
    };
    window.addEventListener('mousemove', moveCursor);

    const ctx = gsap.context(() => {
      // 1. Subtle Logo & Title Gilded Shifting (Gold to Silver to Gold)
      const gildedTl = gsap.timeline({ repeat: -1, yoyo: true });
      gildedTl.to(':root', {
         '--gilded-1': '#c0c0c0', // Silver
         '--gilded-2': '#e5e5e5', // Silver Light
         '--gilded-shadow': 'rgba(192, 192, 192, 0.4)',
         duration: 4,
         ease: 'sine.inOut'
      }).to(':root', {
         '--gilded-1': '#d4af37', // Gold
         '--gilded-2': '#f2ca50', // Gold Light
         '--gilded-shadow': 'rgba(212, 175, 55, 0.4)',
         duration: 4,
         ease: 'sine.inOut'
      });

      // 2. Hero Reveal
      gsap.from('.hero-reveal > *', {
        y: 80,
        opacity: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: 'expo.out',
      });

      // 3. Parallax Floating Assets
      gsap.to('.floating-asset', {
         y: -40,
         x: 10,
         rotation: 5,
         duration: 10,
         repeat: -1,
         yoyo: true,
         stagger: 0.5,
         ease: 'sine.inOut'
      });

      // 4. Reveal Elements on Scroll
      gsap.from('.scroll-reveal', {
         opacity: 0,
         y: 40,
         duration: 1,
         stagger: 0.15,
         ease: 'power2.out',
         scrollTrigger: {
            trigger: '.scroll-reveal',
            start: 'top 85%'
         }
      });
    });

    return () => {
      ctx.revert();
      window.removeEventListener('mousemove', moveCursor);
    };
  }, []);

  // Magnetic Button Effect
  const handleMagnetic = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(e.currentTarget, {
      x: x * 0.4,
      y: y * 0.4,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleMagneticLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: 'elastic.out(1, 0.3)'
    });
  };

  const stepperData = [
    { icon: <UploadCloud size={24} />, title: "Ingest Portfolio", description: "Streamline your ingestion process. Our system handles 10k+ images in a single session with dedicated nodes." },
    { icon: <Cpu size={24} />, title: "Neural Matrix", description: "Proprietary face-embeddings engine identifies and sorts unique individuals across events." },
    { icon: <Share2 size={24} />, title: "Concierge Delivery", description: "Automated personalized galleries shared via white-labeled luxury portals." }
  ];

  if (!mounted) return <div style={{ background: '#050505', minHeight: '100vh' }}></div>;

  return (
    <ReactLenis root>
    <div style={{ background: '#050505', minHeight: '100vh', color: '#f8f8f8', fontFamily: 'var(--font-body)' }}>
      {/* CUSTOM CURSOR */}
      <div ref={cursorRef} className="custom-cursor hidden md:block"></div>

      {/* FAIL-SAFE NAV */}
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 5vw', height: '80px', 
        background: 'rgba(5, 5, 5, 0.9)', backdropFilter: 'blur(40px)', 
        borderBottom: '1px solid rgba(212, 175, 55, 0.15)' 
      }}>
        <div className="logo animated-gilded-text font-black" style={{ fontSize: '1.8rem', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
          CLUSTR<span style={{ opacity: 0.4, color: '#fff' }}>AI</span>
        </div>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          {['Tech', 'Matrix', 'Catalog', 'Investment'].map((item, i) => (
             <a key={i} href="#" style={{ color: '#a1a1aa', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{item}</a>
          ))}
          <div onMouseMove={handleMagnetic} onMouseLeave={handleMagneticLeave}>
            <Link href="/dashboard" style={{ 
              background: 'var(--gilded-1)', color: '#000', padding: '12px 28px', 
              borderRadius: '2px', fontSize: '0.8rem', fontWeight: 950, 
              letterSpacing: '0.2em', textDecoration: 'none', display: 'inline-block',
              boxShadow: '0 0 20px var(--gilded-shadow)', transition: '0.3s'
            }}>
              SYSTEM ACCESS
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO SECTION */}
        <section style={{ 
          padding: '240px 20px 140px', textAlign: 'center', position: 'relative', 
          background: 'radial-gradient(circle at 50% -20%, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
          minHeight: '90vh', display: 'flex', alignItems: 'center'
        }}>
          {/* Drifting Background Nodes */}
          {[1,2,3,4,5,6].map(i => (
             <div key={i} className="floating-asset" style={{ 
                position: 'absolute', top: `${Math.random()*80}%`, left: `${Math.random()*80}%`,
                width: '100px', height: '100px', border: '1px solid rgba(212, 175, 55, 0.05)',
                borderRadius: '8px', opacity: 0.2, zIndex: 1
             }}></div>
          ))}

          <div className="hero-reveal" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
            <div className="badge-luxury mb-12 mx-auto scale-110">
              <span className="animate-pulse w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)]"></span>
              Neural Processing Orchestration V3.4
            </div>
            
            <h1 className="animated-gilded-text font-black" style={{ 
              fontSize: 'clamp(3.5rem, 9vw, 8.5rem)', lineHeight: 0.85, letterSpacing: '-0.05em',
              margin: '0 auto 48px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase'
            }}>
              Master the<br />Collective.
            </h1>
            
            <p style={{ fontSize: '1.4rem', color: '#a1a1aa', maxWidth: '800px', margin: '0 auto 80px', fontWeight: 300, lineHeight: 1.6, opacity: 0.7 }}>
              Advanced face-clustering architecture built for high-flux assets. <br />Experience cinematic precision in Every Wedding. Every Party. Every Face.
            </p>

            <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div onMouseMove={handleMagnetic} onMouseLeave={handleMagneticLeave}>
                <Link href="/dashboard" style={{ 
                  background: 'var(--gilded-1)', color: '#000', padding: '24px 64px', 
                  borderRadius: '2px', fontWeight: 950, fontSize: '1rem', letterSpacing: '0.2em',
                  boxShadow: '0 15px 50px var(--gilded-shadow)', textDecoration: 'none', display: 'inline-block'
                }}>
                  INITIATE CLUSTER
                </Link>
              </div>
              <Link href="/gallery/preview" style={{ 
                border: '1px solid rgba(212, 175, 55, 0.3)', color: 'var(--gilded-1)', padding: '24px 50px', 
                borderRadius: '2px', fontWeight: 950, fontSize: '1rem', letterSpacing: '0.2em', textDecoration: 'none'
              }}>
                WITNESS DEMO
              </Link>
            </div>
          </div>
        </section>

        {/* INTEGRATED STICKY MATRIX (FACE FOCUSED) */}
        <StickyScroll />

        {/* INTERACTIVE STATS */}
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '160px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
           <div style={{ position: 'absolute', top: '10px', left: '10%', fontSize: '12rem', fontWeight: 950, color: 'rgba(212,175,55,0.03)', pointerEvents: 'none' }}>DATA</div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
             {[
               { label: 'NODES PROCESSED', val: 54, suffix: 'K+', icon: <Layers size={28} /> },
               { label: 'ACTIVE PORTALS', val: 240, suffix: '+', icon: <Globe size={28} /> },
               { label: 'EXTRACTION RATE', val: 98, suffix: '%', icon: <Camera size={28} /> }
             ].map((stat, i) => (
               <div key={i} className="premium-card scroll-reveal" style={{ padding: '64px', textAlign: 'center', borderRadius: '4px' }}>
                 <div className="glow-bar"></div>
                 <div style={{ marginBottom: '32px', color: 'var(--gilded-1)' }}>{stat.icon}</div>
                 <div style={{ fontSize: '5rem', fontWeight: 950, lineHeight: 1, fontFamily: 'var(--font-heading)' }}>
                   <CountUp end={stat.val} suffix={stat.suffix} />
                 </div>
                 <div style={{ fontSize: '12px', color: '#71717a', letterSpacing: '0.4em', fontWeight: 900, textTransform: 'uppercase', marginTop: '32px' }}>{stat.label}</div>
               </div>
             ))}
           </div>
        </div>

        {/* TECHNOLOGY CAPABILITIES */}
        <section id="features" style={{ padding: '160px 40px', background: '#080808', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '100px' }}>
              <div className="section-label">SYSTEM CORE</div>
              <h2 className="animated-gilded-text" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, marginTop: '20px', fontFamily: 'var(--font-heading)' }}>Neural Systems</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
              {[
                { icon: <Zap />, title: 'GPU Parallel Ingestion', desc: 'Capable of handling 120+ assets per second with local biometric nodes and neural acceleration.' },
                { icon: <Users />, title: 'Complex Group Mapping', desc: 'Identify unique faces within dense crowds (weddings, parties) with cluster-link technology.' },
                { icon: <Shield />, title: 'Privacy Vault Core', desc: 'Military-grade encryption for biometric hashes. We store identity vectors, not raw identity.' },
              ].map((f, i) => (
                <div key={i} className="premium-card scroll-reveal" style={{ padding: '60px', borderRadius: '4px' }}>
                  <div className="glow-bar"></div>
                  <div style={{ 
                    width: '72px', height: '72px', background: 'rgba(212, 175, 55, 0.05)', 
                    borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: 'var(--gilded-1)', marginBottom: '40px', border: '1px solid rgba(212, 175, 55, 0.2)'
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.02em' }}>{f.title}</h3>
                  <p style={{ color: '#a1a1aa', fontSize: '1.05rem', lineHeight: 1.7, opacity: 0.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAIL-SAFE FOOTER */}
        <footer style={{ padding: '140px 5vw', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#050505', position: 'relative' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '80px' }}>
            <div className="logo animated-gilded-text font-black" style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>CLUSTR<span style={{ opacity: 0.4, color: '#fff' }}>AI</span></div>
            <div style={{ display: 'flex', gap: '56px', flexWrap: 'wrap', justifyContent: 'center' }}>
               {['Nexus', 'Security', 'Protocols', 'Architects'].map((link, j) => (
                  <a key={j} href="#" style={{ color: '#71717a', fontSize: '12px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', transition: '0.3s' }} className="hover:text-primary">{link}</a>
               ))}
            </div>
            <div style={{ color: '#71717a', fontSize: '11px', fontWeight: 950, letterSpacing: '0.4em' }}>© 2026 CLUSTR AI NUCLEUS.</div>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        .custom-cursor { transition: transform 0.1s ease-out; }
        body:hover .custom-cursor { opacity: 1; }
        a:hover ~ .custom-cursor, button:hover ~ .custom-cursor { transform: scale(3); }
        .scroll-reveal { will-change: transform, opacity; }
      `}</style>
    </div>
    </ReactLenis>
  );
}
