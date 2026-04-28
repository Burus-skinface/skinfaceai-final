import React from 'react';
import { motion } from 'framer-motion';
import { FaceIcon } from './icons/FaceIcon';

export const FaceScanLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0">
                {/* Fallback to generic if no custom photo available in this context, or use the same asset */}
                <img
                    src="/images/analysis_face.jpg"
                    className="w-full h-full object-cover opacity-10 blur-2xl scale-110 saturate-0"
                    alt="Background Ambience"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
            </div>

            {/* Main Analysis Module */}
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

                {/* 1. Header Text */}
                <div className="text-center mb-8 animate-fade-in-down">
                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                        Geometric Analysis
                    </h2>
                    <p className="text-sm text-gray-400 max-w-[280px] mx-auto leading-relaxed">
                        Processing biometric data...
                    </p>
                </div>

                {/* 2. Visual Core */}
                <div className="relative w-[320px] h-[380px] rounded-[2rem] overflow-hidden border border-white/10 bg-black shadow-2xl group">

                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-cyan-900/10" />

                    {/* Face Image Container */}
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/5 relative">
                            <img
                                src="/images/analysis_face.jpg"
                                className="w-full h-full object-cover opacity-60 grayscale-[0.3]"
                            />

                            {/* Scanning Laser Line */}
                            <motion.div
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20"
                            />

                            {/* Mesh Overlay (Simulated) */}
                            <div className="absolute inset-0 opacity-40 bg-[url('/images/cubes.png')] mix-blend-overlay" />

                            {/* Micro-Coordinates (Animated Dots) */}
                            <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
                            <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping delay-75" />
                            <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white rounded-full animate-ping delay-150" />

                        </div>
                    </div>

                    {/* Tech UI Overlay */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] sm font-mono text-gray-500 uppercase tracking-widest mb-1">State</span>
                            <span className="text-xl font-bold text-white">SYNC</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] sm font-mono text-gray-500 uppercase tracking-widest mb-1">Precision</span>
                            <span className="text-xl font-bold text-cyan-400">CALIBRATING</span>
                        </div>
                    </div>
                </div>

                {/* 3. Action Button / Loading State */}
                <div className="mt-10 w-full px-10">
                    <div className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(147,51,234,0.3)] animate-pulse">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-white font-bold tracking-wide text-sm">ANALYZING STRUCTURE...</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
