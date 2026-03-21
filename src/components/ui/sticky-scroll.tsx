'use client';
import React, { forwardRef, useState, useEffect } from 'react';

const StickyScroll = forwardRef<HTMLElement>((props, ref) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <section style={{ height: '600px', background: '#000' }}></section>;

  // High-fidelity face-focused imagery (Weddings, Parties, Galas)
  const col1 = ['1511795409834-ef04bbd61622', '1519741497674-611481863552', '1511285560929-80b456fea0bc', '1527529482837-4698179dc6ce', '1529156069898-49953e39b3ac'];
  const col2 = ['1496024840928-4c417dad24a8', '1516450360452-9312f5e86fc7', '1504196606672-aef5c9cefc92', '1533174072545-7a4b6ad7a6c3' ]; // 4 sticky images
  const col3 = ['1523580494863-6f3031224c94', '1505373877841-8d25f7d46678', '1511632765486-a01980e01a18', '1464366400600-7168b8af9bc3', '1519671482749-fd09be7ccebf'];
  const col4 = ['1543157145-f78c636d0232', '1551818255-e6e10975bc17', '1517048676732-d65bc937f952', '1520110120385-81262a3f581a', '1470225620780-dba8ba36b745'];

  return (
    <section className='bg-black w-full overflow-hidden' style={{ padding: '120px 0', borderTop: '1px solid rgba(212, 175, 55, 0.1)' }} ref={ref}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '100px' }}>
           <div className="section-label" style={{ color: '#d4af37', fontWeight: 900, letterSpacing: '0.5em', fontSize: '10px' }}>BIOMETRIC SCANNING active</div>
           <h2 className="animated-gilded-text" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, marginTop: '20px', fontFamily: 'var(--font-heading)' }}>Infinite Asset Matrix</h2>
           <p style={{ color: '#a1a1aa', marginTop: '24px', opacity: 0.6, maxWidth: '600px', margin: '24px auto', fontSize: '1.1rem', fontWeight: 300 }}>Faces captured at 120fps. Processing identities across every wedding, party, and gala in the system.</p>
        </div>

        {/* 4 COLUMN GRID for SMALLER BOXES */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          alignItems: 'start' 
        }}>
          {/* Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {col1.map((id, i) => (
              <ImgBox key={i} id={id} delay={i * 0.2} />
            ))}
          </div>

          {/* Column 2 - STICKY (Middle Left) */}
          <div style={{ 
            position: 'sticky', 
            top: '120px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px', 
            height: 'calc(100vh - 160px)', 
            overflow: 'hidden' 
          }}>
            {col2.map((id, i) => (
              <div key={i} style={{ margin: 0, width: '100%', height: 'calc(25% - 15px)', flexShrink: 0, position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
                <img
                  src={`https://images.unsplash.com/photo-${id}?w=600&auto=format&fit=crop`}
                  alt=''
                  style={{ height: '100%', width: '100%', objectFit: 'cover', border: '1px solid rgba(212, 175, 55, 0.4)', transition: '0.5s' }}
                />
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: '#d4af37', fontSize: '8px', fontWeight: 900, background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '2px' }}>LOCKED: NODE_{id.slice(-4)}</div>
              </div>
            ))}
          </div>

          {/* Column 3 - STICKY (Middle Right) */}
          <div style={{ 
            position: 'sticky', 
            top: '120px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px', 
            height: 'calc(100vh - 160px)', 
            overflow: 'hidden' 
          }}>
            {col4.slice(0, 4).map((id, i) => (
              <div key={i} style={{ margin: 0, width: '100%', height: 'calc(25% - 15px)', flexShrink: 0, position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
                <img
                  src={`https://images.unsplash.com/photo-${id}?w=600&auto=format&fit=crop`}
                  alt=''
                  style={{ height: '100%', width: '100%', objectFit: 'cover', border: '1px solid rgba(212, 175, 55, 0.4)', transition: '0.5s' }}
                />
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: '#d4af37', fontSize: '8px', fontWeight: 900, background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '2px' }}>DETECTED: FACE_{i}</div>
              </div>
            ))}
          </div>

          {/* Column 4 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {col3.map((id, i) => (
              <ImgBox key={i} id={id} delay={i * 0.15} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

// Interactive Image Box Component
function ImgBox({ id, delay }: { id: string, delay: number }) {
  const [hover, setHover] = useState(false);
  
  return (
    <figure 
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ 
        margin: 0, 
        width: '100%', 
        position: 'relative', 
        transition: '0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: hover ? 'scale(1.05) z-index: 50' : 'scale(1)',
        zIndex: hover ? 100 : 1,
        cursor: 'none'
      }}
    >
      <img
        src={`https://images.unsplash.com/photo-${id}?w=500&auto=format&fit=crop`}
        alt=''
        style={{ 
          width: '100%', 
          aspectRatio: '1/1', 
          objectFit: 'cover', 
          borderRadius: '4px', 
          border: hover ? '1px solid #d4af37' : '1px solid rgba(212, 175, 55, 0.1)',
          filter: hover ? 'grayscale(0)' : 'grayscale(0.3)',
          transition: 'all 0.5s ease'
        }}
      />
      {hover && (
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.15), transparent 70%)',
          pointerEvents: 'none'
        }}></div>
      )}
    </figure>
  );
}

StickyScroll.displayName = 'StickyScroll';

export default StickyScroll;
