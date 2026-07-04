import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

declare global {
    interface Window {
        __prewarmed_camera_stream?: MediaStream | null;
    }
}

interface ScanCTAProps {
    onStart: () => void;
    onBack: () => void;
}

const ScanCTA: React.FC<ScanCTAProps> = ({ onStart, onBack }) => {
    const [streamReady, setStreamReady] = useState(false);

    // Request camera permission & warm up hardware immediately on mount
    useEffect(() => {
        // Skip if we already have a stream
        if (window.__prewarmed_camera_stream) {
            setStreamReady(true);
            console.log("📸 Camera stream already available from previous warmup");
            return;
        }

        let cancelled = false;

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            .then(stream => {
                if (cancelled) {
                    // Component unmounted before we got the stream
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                window.__prewarmed_camera_stream = stream;
                setStreamReady(true);
                console.log("📸 Camera hardware pre-warmed & permissions granted in ScanCTA");
            })
            .catch(err => {
                console.error("Camera warmup failed:", err);
                // Still allow proceeding — FaceScanCamera will handle the error
                if (!cancelled) setStreamReady(true);
            });

        return () => {
            cancelled = true;
            // CRITICAL: Must kill the stream here! Otherwise react-webcam cannot acquire the camera
            // on Windows/Chrome resulting in a false "Permission Denied / NotReadableError".
            if (window.__prewarmed_camera_stream) {
                window.__prewarmed_camera_stream.getTracks().forEach(t => t.stop());
                window.__prewarmed_camera_stream = null;
            }
        };
    }, []);

    const handleStartClick = () => {
        if (!streamReady) {
            console.warn("User clicked Got it before stream was ready. Proceeding anyway.");
        }
        onStart();
    };

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
                    src="/scan_cta_blonde.png"
                    alt="Facial Preparation"
                    className="w-full h-full object-cover object-[center_15%] scale-105 opacity-90 mix-blend-multiply"
                />
            </div>

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
                <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-black/5">Ready to scan</div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Light Glass Bottom Sheet */}
            <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative z-20 bg-white/90 backdrop-blur-xl border-t border-[#E5E5EA] rounded-t-[2.5rem] px-8 pt-10 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] text-center w-full"
            >
                {/* Step Indicator */}
                <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center mx-auto mb-6">
                    <span className="text-[#007AFF] font-bold text-xl">✓</span>
                </div>

                <h2 className="text-[26px] leading-[34px] sm:text-3xl font-bold tracking-tight text-[#1D1D1F] mb-3 max-w-[280px] mx-auto">
                    For <span className="text-[#007AFF]">Accurate Results</span>
                </h2>

                <div className="text-[#86868B] text-[15px] leading-relaxed mb-8 max-w-[280px] mx-auto text-balance">
                    <p className="mb-2 font-medium text-[#48484A]">Capture your face in its natural state.</p>
                    <p className="text-[13px]">Filters, expressions, and angles reduce analysis accuracy.</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartClick}
                    className="w-full h-[60px] rounded-[2rem] font-bold text-[18px] bg-[#1D1D1F] text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all flex items-center justify-center gap-2 mx-auto max-w-sm"
                >
                    {streamReady ? "Got it" : (
                       <>
                         <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                         Starting Camera...
                       </>
                    )}
                </motion.button>
            </motion.div>
        </div>
    );
};

export default ScanCTA;
