'use client';
import { motion } from 'framer-motion';

export default function NeuralNodeLoader({ size = 40, color = 'var(--color-primary)' }: { size?: number, color?: string }) {
    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer Ring */}
            <motion.div
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: `2px solid ${color}`,
                    opacity: 0.2
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                    rotate: 360
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            {/* Inner Ring */}
            <motion.div
                style={{
                    position: 'absolute',
                    width: '60%',
                    height: '60%',
                    borderRadius: '50%',
                    border: `2px solid ${color}`,
                    opacity: 0.4,
                    boxShadow: `0 0 15px ${color}66`
                }}
                animate={{
                    scale: [1, 0.8, 1],
                    rotate: -360
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
            {/* The Central Node */}
            <motion.div
                style={{
                    width: '20%',
                    height: '20%',
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 20px ${color}`
                }}
                animate={{
                    opacity: [0.4, 1, 0.4]
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </div>
    );
}
