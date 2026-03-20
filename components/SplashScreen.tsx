import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { startMediaPipeWarmup } from '../services/mediaPipeWarmup';

interface SplashScreenProps {
    onReady: () => void;
    minDisplayMs?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onReady, minDisplayMs = 2400 }) => {
    const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

    useEffect(() => {
        // Pre-warm MediaPipe model ONLY (no camera permission here)
        startMediaPipeWarmup();

        // Phase transitions
        const holdTimer = setTimeout(() => setPhase('hold'), 400);
        const exitTimer = setTimeout(() => {
            setPhase('exit');
            setTimeout(onReady, 600);
        }, minDisplayMs);

        return () => { clearTimeout(holdTimer); clearTimeout(exitTimer); };
    }, [onReady, minDisplayMs]);

    return (
        <div className="fixed inset-0 z-[300] bg-[#050505] flex items-center justify-center overflow-hidden">

            {/* Cinematic background pulse — very subtle */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)' }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                    scale: phase === 'exit' ? 2.5 : phase === 'hold' ? 1.2 : 0.5,
                    opacity: phase === 'exit' ? 0 : phase === 'hold' ? 1 : 0,
                }}
                transition={{ duration: phase === 'exit' ? 0.6 : 1.2, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Logo container */}
            <motion.div
                className="relative z-10 flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                    opacity: phase === 'exit' ? 0 : 1,
                    scale: phase === 'exit' ? 1.15 : 1,
                    y: phase === 'exit' ? -20 : 0,
                }}
                transition={{
                    duration: phase === 'exit' ? 0.5 : 0.9,
                    ease: [0.16, 1, 0.3, 1],
                }}
            >
                {/* App logo image */}
                <motion.img
                    src="/skinface-logo.png"
                    alt="Skinface.ai"
                    className="w-[300px] h-auto pointer-events-none"
                    initial={{ filter: 'brightness(0)', opacity: 0 }}
                    animate={{
                        filter: phase === 'exit' ? 'brightness(1.3)' : 'brightness(1)',
                        opacity: phase === 'exit' ? 0 : 1,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                        filter: phase === 'hold' ? 'drop-shadow(0 0 40px rgba(168,85,247,0.35))' : undefined
                    }}
                />
            </motion.div>

            {/* Screen flash on exit — cinematic wipe */}
            <motion.div
                className="absolute inset-0 bg-[#050505] pointer-events-none z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === 'exit' ? 1 : 0 }}
                transition={{ duration: 0.4, delay: phase === 'exit' ? 0.2 : 0 }}
            />
        </div>
    );
};

export default SplashScreen;
