'use client';
import { motion } from 'framer-motion';

const ROW_1_IMAGES = [
    '/images/events/real_event_1.jpg',
    '/images/events/real_event_2.jpg',
    '/images/events/real_event_3.jpg',
    '/images/events/real_event_4.jpg',
    '/images/events/real_event_5.jpg',
    '/images/events/real_event_6.jpg',
    '/images/events/real_event_7.jpg',
    '/images/events/real_event_8.jpg',
];

const ROW_2_IMAGES = [
    '/images/events/real_event_9.jpg',
    '/images/events/real_event_10.jpg',
    '/images/events/real_event_11.jpg',
    '/images/events/real_event_12.jpg',
    '/images/events/real_event_13.jpg',
    '/images/events/real_event_14.jpg',
    '/images/events/real_event_15.jpg',
    '/images/events/real_event_16.jpg',
];

// Double arrays for seamless infinite looping
const INFINITE_ROW_1 = [...ROW_1_IMAGES, ...ROW_1_IMAGES];
const INFINITE_ROW_2 = [...ROW_2_IMAGES, ...ROW_2_IMAGES];

export default function DualEventCarousel() {
    return (
        <div className="py-20 overflow-hidden bg-[#050505] relative w-full">
            {/* Soft Edge Masks (Vignette to ensure no hard cuts) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" style={{ background: 'linear-gradient(90deg, #050505 0%, transparent 10%, transparent 90%, #050505 100%)' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                {/* Row 1: Smooth Auto-Gliding Left (Diversity: Wedding, Gala, Party, Corporate) */}
                <div style={{ overflow: 'hidden', width: '100%', display: 'flex' }}>
                    <motion.div 
                        initial={{ x: 0 }}
                        animate={{ x: '-50%' }}
                        transition={{ 
                            duration: 45, // Slowed down slightly for better legibility of real photos
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{ display: 'flex', gap: '16px', whiteSpace: 'nowrap' }}
                    >
                        {INFINITE_ROW_1.map((src, i) => (
                            <div key={`r1-${i}`} style={{ position: 'relative', flexShrink: 0, width: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                                 <img src={src} alt="Event Portfolio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Row 2: Smooth Auto-Gliding Right (Diversity: Concerts, Festivals, Dinners, Portraits) */}
                <div style={{ overflow: 'hidden', width: '100%', display: 'flex' }}>
                    <motion.div 
                        initial={{ x: '-50%' }}
                        animate={{ x: 0 }}
                        transition={{ 
                            duration: 55,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{ display: 'flex', gap: '16px', whiteSpace: 'nowrap' }}
                    >
                        {INFINITE_ROW_2.map((src, i) => (
                            <div key={`r2-${i}`} style={{ position: 'relative', flexShrink: 0, width: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                                 <img src={src} alt="Event Portfolio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
            
            {/* Luxury Tonal Divider */}
            <div className="mt-20 w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.1) 50%, transparent)' }} />
        </div>
    );
}
