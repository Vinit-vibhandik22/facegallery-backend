'use client';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function NeuralConstellation() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Spring physics for smooth "oil-like" movement
    const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const width = window.innerWidth;
        const height = window.innerHeight;
        // Normalize coordinates to -1 to 1
        mouseX.set((clientX / width) - 0.5);
        mouseY.set((clientY / height) - 0.5);
    };

    // Parallax transforms for different layers
    const layer1X = useTransform(springX, (v) => v * -100);
    const layer1Y = useTransform(springY, (v) => v * -100);
    
    const layer2X = useTransform(springX, (v) => v * -200);
    const layer2Y = useTransform(springY, (v) => v * -200);
    
    const layer3X = useTransform(springX, (v) => v * -40);
    const layer3Y = useTransform(springY, (v) => v * -40);

    // Generate random nodes only on client-side
    const [nodes, setNodes] = useState<{ id: number, x: number, y: number, size: number, opacity: number }[]>([]);
    
    useEffect(() => {
        const newNodes = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            opacity: Math.random() * 0.3 + 0.1
        }));
        setNodes(newNodes);

        const globalMouseMove = (e: MouseEvent) => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            mouseX.set((e.clientX / width) - 0.5);
            mouseY.set((e.clientY / height) - 0.5);
        };
        window.addEventListener('mousemove', globalMouseMove);
        return () => window.removeEventListener('mousemove', globalMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            {/* Layer 1: The Deep Constellation */}
            <motion.div 
                style={{ x: layer1X, y: layer1Y, position: 'absolute', inset: -100 }}
                className="opacity-40"
            >
                {nodes.slice(0, 8).map(node => (
                    <div 
                        key={`layer1-${node.id}`}
                        style={{
                            position: 'absolute',
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            width: node.size,
                            height: node.size,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            boxShadow: `0 0 15px var(--color-primary)`,
                            opacity: node.opacity
                        }}
                    />
                ))}
            </motion.div>

            {/* Layer 2: Close Floating Nodes */}
            <motion.div 
                style={{ x: layer2X, y: layer2Y, position: 'absolute', inset: -200 }}
                className="opacity-20"
            >
                {nodes.slice(8, 15).map(node => (
                    <div 
                        key={`layer2-${node.id}`}
                        style={{
                            position: 'absolute',
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            width: node.size * 1.5,
                            height: node.size * 1.5,
                            borderRadius: '50%',
                            border: '1px solid var(--color-primary)',
                            opacity: node.opacity
                        }}
                    />
                ))}
            </motion.div>

            {/* Ambient Nebula Glow */}
            <motion.div 
                style={{ x: layer3X, y: layer3Y }}
                className="absolute inset-0"
            >
                <div 
                    style={{
                        position: 'absolute',
                        top: '20%',
                        left: '30%',
                        width: '40vw',
                        height: '40vw',
                        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05), transparent 70%)',
                        filter: 'blur(100px)',
                    }}
                />
            </motion.div>
        </div>
    );
}
