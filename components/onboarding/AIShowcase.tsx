import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface AIShowcaseProps {
    onNext: () => void;
    onBack: () => void;
}

// Facial feature landmarks as percentages of the ORIGINAL image
// These are fixed positions on the source photo that never change
const FACE_LANDMARKS = [
    { id: 'eyebrow', imgX: 0.50, imgY: 0.35, label: 'Eyebrow Symmetry', side: 'left', color: 'white', borderColor: 'border-white/20', dotShadow: '0_0_5px_white', lineColor: 'rgba(255,255,255,0.4)' },
    { id: 'texture', imgX: 0.41, imgY: 0.44, label: 'Texture Roughness', side: 'left', color: 'purple-400', borderColor: 'border-purple-500/30', dotShadow: '0_0_5px_#c084fc', lineColor: 'rgba(168,85,247,0.4)' },
    { id: 'axis', imgX: 0.52, imgY: 0.47, label: 'Facial Axis Tilt', side: 'left', color: 'blue-400', borderColor: 'border-blue-500/30', dotShadow: '0_0_5px_#60a5fa', lineColor: 'rgba(96,165,250,0.4)' },
    { id: 'pore', imgX: 0.66, imgY: 0.31, label: 'Pore Size', side: 'right', color: 'rose-400', borderColor: 'border-rose-500/30', dotShadow: '0_0_5px_#fb7185', lineColor: 'rgba(244,63,94,0.4)' },
    { id: 'pigment', imgX: 0.68, imgY: 0.43, label: 'Pigmentation', side: 'right', color: 'white', borderColor: 'border-white/20', dotShadow: '0_0_5px_white', lineColor: 'rgba(255,255,255,0.4)' },
    { id: 'jawline', imgX: 0.67, imgY: 0.58, label: 'Jawline Sharpness', side: 'right', color: 'purple-400', borderColor: 'border-purple-500/30', dotShadow: '0_0_5px_#c084fc', lineColor: 'rgba(168,85,247,0.4)' },
];

// Label Y positions (% of container) for left/right columns
const LABEL_POSITIONS = {
    left: [15, 28, 40],
    right: [15, 28, 40],
};


export const AIShowcase: React.FC<AIShowcaseProps> = ({ onNext, onBack }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [facePoints, setFacePoints] = useState<{ x: number; y: number }[]>([]);

    // DEBUG MODE: Set to true to enable tap-to-coordinate tool
    const DEBUG_MODE = false;
    const FEATURE_NAMES = ['Eyebrow', 'Cheek(L)', 'Forehead', 'Nose', 'Cheek(R)', 'Jawline'];
    const [tappedPoints, setTappedPoints] = useState<{ imgX: number; imgY: number; screenX: number; screenY: number }[]>([]);

    // Reverse transform: screen tap -> image coordinates
    const screenToImageCoords = useCallback((screenX: number, screenY: number) => {
        const img = imgRef.current;
        const container = containerRef.current;
        if (!img || !container || !img.naturalWidth) return null;

        const containerW = container.offsetWidth;
        const containerH = container.offsetHeight;
        const imgNatW = img.naturalWidth;
        const imgNatH = img.naturalHeight;

        const containerRatio = containerW / containerH;
        const imgRatio = imgNatW / imgNatH;

        let renderW: number, renderH: number, offsetX: number, offsetY: number;

        if (imgRatio > containerRatio) {
            renderH = containerH;
            renderW = containerH * imgRatio;
            offsetX = (containerW - renderW) / 2;
            offsetY = 0;
        } else {
            renderW = containerW;
            renderH = containerW / imgRatio;
            offsetX = 0;
            offsetY = (containerH - renderH) / 2;
        }

        const imgX = (screenX - offsetX) / renderW;
        const imgY = (screenY - offsetY) / renderH;

        return { imgX: Math.round(imgX * 100) / 100, imgY: Math.round(imgY * 100) / 100 };
    }, []);

    const handleContainerTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!DEBUG_MODE) return;
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        let clientX: number, clientY: number;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;

        const imgCoords = screenToImageCoords(screenX, screenY);
        if (!imgCoords) return;

        setTappedPoints(prev => {
            const next = [...prev, { ...imgCoords, screenX, screenY }];
            if (next.length > 6) return next.slice(-6); // keep last 6
            return next;
        });
    }, [DEBUG_MODE, screenToImageCoords]);

    // Calculate where a point on the original image maps to on screen
    // given object-fit: cover behavior
    const calculateCoverTransform = useCallback(() => {
        const img = imgRef.current;
        const container = containerRef.current;
        if (!img || !container || !img.naturalWidth) return;

        const containerW = container.offsetWidth;
        const containerH = container.offsetHeight;
        const imgNatW = img.naturalWidth;
        const imgNatH = img.naturalHeight;

        // object-fit: cover math
        const containerRatio = containerW / containerH;
        const imgRatio = imgNatW / imgNatH;

        let renderW: number, renderH: number, offsetX: number, offsetY: number;

        if (imgRatio > containerRatio) {
            // Image is wider than container → crop sides
            renderH = containerH;
            renderW = containerH * imgRatio;
            offsetX = (containerW - renderW) / 2;
            offsetY = 0;
        } else {
            // Image is taller than container → crop top/bottom
            renderW = containerW;
            renderH = containerW / imgRatio;
            offsetX = 0;
            offsetY = (containerH - renderH) / 2;
        }

        // Map each landmark from image-space to container-space
        const points = FACE_LANDMARKS.map(lm => ({
            x: offsetX + lm.imgX * renderW,
            y: offsetY + lm.imgY * renderH,
        }));

        // Convert to percentages of container
        const percentPoints = points.map(p => ({
            x: (p.x / containerW) * 100,
            y: (p.y / containerH) * 100,
        }));

        setFacePoints(percentPoints);
    }, []);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        if (img.complete && img.naturalWidth) {
            calculateCoverTransform();
        }
        img.addEventListener('load', calculateCoverTransform);
        window.addEventListener('resize', calculateCoverTransform);

        return () => {
            img.removeEventListener('load', calculateCoverTransform);
            window.removeEventListener('resize', calculateCoverTransform);
        };
    }, [calculateCoverTransform]);

    const leftLabels = FACE_LANDMARKS.filter(l => l.side === 'left');
    const rightLabels = FACE_LANDMARKS.filter(l => l.side === 'right');

    return (
        <div className="relative flex flex-col h-full bg-[#FFFFFF] text-[#1D1D1F] font-sans overflow-hidden">

            {/* Light Theme Ambience */}
            <div className="absolute inset-0 bg-[#F5F5F7] z-0" />

            {/* Gradient Masked Portrait Background */}
            <div className="absolute top-0 inset-x-0 h-[65vh] z-0 pointer-events-none" style={{
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
            }}>
                <img
                    ref={imgRef}
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                    alt="Clinical Face Scan"
                    className="w-full h-full object-cover opacity-90 mix-blend-multiply"
                />
            </div>

            {/* AI Scanning Data Visualization */}
            <div ref={containerRef} className={`absolute top-0 inset-x-0 h-[65vh] z-10 ${DEBUG_MODE ? 'pointer-events-auto' : 'pointer-events-none'}`} onClick={handleContainerTap} onTouchStart={handleContainerTap}>
                {facePoints.length > 0 && (
                    <>
                        {/* Connecting SVG Lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            {FACE_LANDMARKS.map((lm, i) => {
                                const point = facePoints[i];
                                if (!point) return null;
                                const sideIndex = lm.side === 'left'
                                    ? leftLabels.indexOf(lm)
                                    : rightLabels.indexOf(lm);
                                const labelY = lm.side === 'left'
                                    ? LABEL_POSITIONS.left[sideIndex]
                                    : LABEL_POSITIONS.right[sideIndex];
                                const labelX = lm.side === 'left' ? 5 : 88;

                                return (
                                    <motion.line
                                        key={lm.id}
                                        x1={`${point.x}%`} y1={`${point.y}%`}
                                        x2={`${labelX}%`} y2={`${labelY}%`}
                                        stroke="#1D1D1F" strokeOpacity={0.15} strokeWidth="1" strokeDasharray="2 4"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 1.5, delay: 0.2 + i * 0.4, ease: "easeInOut" }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Facial Tracking Nodes */}
                        {FACE_LANDMARKS.map((lm, i) => {
                            const point = facePoints[i];
                            if (!point) return null;

                            return (
                                <motion.div
                                    key={`dot-${lm.id}`}
                                    className="absolute w-2 h-2 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.15)] border border-[#1D1D1F]/10 -translate-x-1/2 -translate-y-1/2"
                                    style={{ top: `${point.y}%`, left: `${point.x}%` }}
                                    animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 + i * 0.4 }}
                                />
                            );
                        })}

                        {/* LEFT SIDE LABELS */}
                        {leftLabels.map((lm, sideIdx) => {
                            const labelY = LABEL_POSITIONS.left[sideIdx];
                            return (
                                <motion.div
                                    key={`label-${lm.id}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 1.7 + sideIdx * 0.4 }}
                                    className="absolute left-[5%] -translate-y-1/2 flex items-center"
                                    style={{ top: `${labelY}%` }}
                                >
                                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#007AFF] z-10 animate-pulse shadow-sm" />
                                    <div className="bg-white/90 backdrop-blur-md border border-black/5 rounded-full px-3 py-1.5 ml-3 shadow-[0_4px_12px_rgba(0,0,0,0.06)] z-0">
                                        <span className="text-[#1D1D1F] text-[10px] font-semibold tracking-wide whitespace-nowrap">{lm.label}</span>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* RIGHT SIDE LABELS */}
                        {rightLabels.map((lm, sideIdx) => {
                            const labelY = LABEL_POSITIONS.right[sideIdx];
                            return (
                                <motion.div
                                    key={`label-${lm.id}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 2.9 + sideIdx * 0.4 }}
                                    className="absolute left-[88%] -translate-x-full -translate-y-1/2 flex items-center justify-end"
                                    style={{ top: `${labelY}%` }}
                                >
                                    <div className="bg-white/90 backdrop-blur-md border border-black/5 rounded-full px-3 py-1.5 mr-3 shadow-[0_4px_12px_rgba(0,0,0,0.06)] z-0">
                                        <span className="text-[#1D1D1F] text-[10px] font-semibold tracking-wide whitespace-nowrap">{lm.label}</span>
                                    </div>
                                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#007AFF] z-10 animate-pulse shadow-sm" />
                                </motion.div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Gentle AI Scanner Overlay Line */}
            <motion.div
                className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#007AFF]/40 to-transparent shadow-[0_0_15px_rgba(0,122,255,0.2)] z-10 pointer-events-none"
                animate={{ top: ['15%', '85%', '15%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Top Navigation */}
            <div className="relative z-20 px-6 pt-12 flex justify-between items-center w-full">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-[#FFFFFF] hover:bg-[#F5F5F7] shadow-sm transition-all flex items-center justify-center text-[#1D1D1F]"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-black/5">Step 3/4</div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Light Glass Bottom Sheet */}
            <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.1 }}
                className="relative z-20 bg-white/90 backdrop-blur-xl border-t border-[#E5E5EA] rounded-t-[2.5rem] px-8 pt-10 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] text-center w-full"
            >
                {/* Step Indicator */}
                <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center mx-auto mb-6">
                    <span className="text-[#007AFF] font-bold text-xl">3</span>
                </div>

                <h2 className="text-[26px] leading-[34px] sm:text-3xl font-bold tracking-tight text-[#1D1D1F] mb-3 max-w-[280px] mx-auto">
                    Clinical-grade <span className="text-[#007AFF]">AI Engine.</span>
                </h2>

                <p className="text-[#86868B] text-[15px] leading-relaxed mb-8 max-w-[280px] mx-auto text-balance">
                    We map over 100+ facial data points to deeply analyze skin texture, hydration, and key aging signs.
                </p>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNext}
                    className="w-full h-[60px] rounded-[2rem] font-bold text-[18px] bg-[#1D1D1F] text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all flex items-center justify-center mx-auto max-w-sm"
                >
                    Continue
                </motion.button>
            </motion.div>
        </div>
    );
};

export default AIShowcase;
