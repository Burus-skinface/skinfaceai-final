import React from 'react';
import { motion } from 'framer-motion';

interface ScanCTAProps {
    onStart: () => void;
    onBack: () => void;
}

const ScanCTA: React.FC<ScanCTAProps> = ({ onStart, onBack }) => {
    return (
        <div className="relative flex flex-col h-full bg-[#050505] text-white font-sans overflow-hidden">

            {/* Dark Theme Ambience */}
            <div className="bg-noise-subtle absolute inset-0 pointer-events-none z-10" />
            <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[50%] bg-purple-900/20 blur-[100px] rounded-full point-events-none z-0" />
            <div className="absolute bottom-[-10%] left-[-20%] w-[140%] h-[70%] bg-indigo-900/10 blur-[80px] z-0" />

            {/* Gradient Masked Portrait Background */}
            <div className="absolute top-0 inset-x-0 h-[65vh] z-0 pointer-events-none" style={{
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
            }}>
                <img
                    src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=80"
                    alt="Facial Preparation"
                    className="w-full h-full object-cover opacity-80 mix-blend-luminosity"
                />
            </div>

            {/* Top Navigation */}
            <div className="relative z-20 px-6 pt-12 flex justify-between items-center w-full">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 transition-all border border-white/20 shadow-lg"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">Step 4/4</div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Dark Glass Bottom Sheet */}
            <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative z-20 bg-[#111111]/90 backdrop-blur-xl border-t border-white/10 rounded-t-[2.5rem] px-8 pt-10 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] text-center w-full"
            >
                {/* Step Indicator Glow */}
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                    <span className="text-indigo-300 font-bold text-xl">4</span>
                </div>

                <h2 className="text-[26px] leading-[34px] sm:text-3xl font-semibold tracking-tight text-white mb-8 max-w-[280px] mx-auto drop-shadow-lg">
                    For the best results take everything off, <span className="text-indigo-300">even makeup.</span>
                </h2>

                <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0px 0px 20px rgba(255,255,255,0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onStart}
                    className="w-full py-4 rounded-full font-bold text-lg bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/10 transition-all transform mx-auto max-w-sm"
                >
                    Got it
                </motion.button>
            </motion.div>
        </div>
    );
};

export default ScanCTA;
