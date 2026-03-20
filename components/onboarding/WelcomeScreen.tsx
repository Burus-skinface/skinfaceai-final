import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeScreenProps {
    onNext: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
    const [showTerms, setShowTerms] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const width = scrollContainerRef.current.offsetWidth;
        const newIndex = Math.round(scrollLeft / width);
        if (newIndex !== activeIndex) {
            setActiveIndex(newIndex);
        }
    };

    return (
        <div className="relative flex flex-col h-full bg-[#FFFFFF] text-[#1D1D1F] font-sans overflow-hidden">
            {/* Background Ambience - Clean Apple Light */}
            <motion.div
                className="absolute inset-x-0 top-0 h-[60%] bg-[#F5F5F7] blur-[100px] rounded-full pointer-events-none"
                animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Carousel Area */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col">
                <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {/* Slide 1: Welcome/Logo */}
                    <div className="w-full h-full shrink-0 flex flex-col items-center justify-center snap-center px-8 text-center pt-[5vh]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="mb-10"
                        >
                            <img
                                src="/skinface-icon.png"
                                alt="Skinface.ai"
                                className="w-[50vw] max-w-[200px] aspect-square object-contain mx-auto drop-shadow-[0_12px_40px_rgba(0,0,0,0.08)] pointer-events-none rounded-[3rem]"
                            />
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-[26px] sm:text-[30px] font-bold leading-[1.2] tracking-tight text-[#1D1D1F] max-w-[280px] mx-auto text-balance"
                        >
                            Clinical AI Skin Analysis
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="text-[15px] text-[#86868B] mt-5 max-w-[260px] mx-auto leading-relaxed"
                        >
                            Upload a selfie and get an instant, medical-grade breakdown of your skin metrics.
                        </motion.p>
                    </div>

                    {/* Slide 2: The Big 6 */}
                    <div className="w-full h-full shrink-0 flex flex-col items-center justify-center snap-center px-8 text-center pt-[5vh]">
                        <div className="w-[50vw] max-w-[200px] aspect-square bg-[#F5F5F7] rounded-[3rem] border border-black/5 flex items-center justify-center mb-10 shadow-inner overflow-hidden relative">
                            {/* Abstract representation of metrics */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF]/5 to-transparent" />
                            <div className="grid grid-cols-2 gap-3 z-10 p-5 w-full h-full">
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center font-bold text-[#007AFF] text-[22px]">94</div>
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center font-bold text-[#34C759] text-[22px]">88</div>
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center font-bold text-[#FF9500] text-[22px]">76</div>
                                <div className="bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center font-bold text-[#AF52DE] text-[22px]">91</div>
                            </div>
                        </div>
                        <h2 className="text-[26px] sm:text-[30px] font-bold leading-[1.2] tracking-tight text-[#1D1D1F] max-w-[280px] mx-auto text-balance">
                            Deep 'Big 6' Mapping
                        </h2>
                        <p className="text-[15px] text-[#86868B] mt-5 max-w-[260px] mx-auto leading-relaxed">
                            We analyze Acne, Texture, Hydration, Glow, Pigmentation, and Barrier function instantly.
                        </p>
                    </div>

                    {/* Slide 3: Actionable Advice */}
                    <div className="w-full h-full shrink-0 flex flex-col items-center justify-center snap-center px-8 text-center pt-[5vh]">
                        <div className="w-[50vw] max-w-[200px] aspect-square bg-white rounded-[3rem] border border-black/5 shadow-[0_20px_40px_rgba(0,0,0,0.06)] flex flex-col p-6 items-start justify-center mb-10 relative overflow-hidden">
                            <div className="w-4/5 h-4 bg-[#F2F2F7] rounded-full mb-3" />
                            <div className="w-full h-4 bg-[#F2F2F7] rounded-full mb-3" />
                            <div className="w-3/5 h-4 bg-[#F2F2F7] rounded-full mb-5" />
                            <div className="w-full py-3 bg-[#007AFF] rounded-full text-white font-bold text-[13px] shadow-md flex items-center justify-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Protocol
                            </div>
                        </div>
                        <h2 className="text-[26px] sm:text-[30px] font-bold leading-[1.2] tracking-tight text-[#1D1D1F] max-w-[280px] mx-auto text-balance">
                            Personalized Protocol
                        </h2>
                        <p className="text-[15px] text-[#86868B] mt-5 max-w-[260px] mx-auto leading-relaxed">
                            Stop guessing. Get an organic, AI-synthesized daily routine based on your exact skin state.
                        </p>
                    </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex gap-2 justify-center pb-8 shrink-0">
                    {[0, 1, 2].map(i => (
                        <div 
                           key={i} 
                           className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'bg-[#1D1D1F] w-4' : 'bg-[#1D1D1F]/15 w-1.5'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Actions Area */}
            <div className="relative z-10 px-6 pb-12 w-full max-w-sm mx-auto flex flex-col gap-4 shrink-0">
                {/* Primary Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNext}
                    className="w-full h-[60px] rounded-full font-bold text-[18px] bg-[#1D1D1F] text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all flex items-center justify-center"
                >
                    Get Started
                </motion.button>

                {/* Subtle Terms Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="text-[12px] text-center text-[#86868B] leading-[1.6] max-w-[280px] mx-auto"
                >
                    By proceeding to use Skinface.ai, you agree to our{' '}
                    <button
                        onClick={() => setShowTerms(true)}
                        className="text-[#1D1D1F] underline decoration-[#1D1D1F]/30 underline-offset-2 hover:decoration-[#1D1D1F]/100 transition-colors font-medium"
                    >
                        terms of use
                    </button>
                    {' '}and acknowledge that you have read our{' '}
                    <button
                        onClick={() => setShowTerms(true)}
                        className="text-[#1D1D1F] underline decoration-[#1D1D1F]/30 underline-offset-2 hover:decoration-[#1D1D1F]/100 transition-colors font-medium"
                    >
                        privacy policy
                    </button>
                </motion.p>
            </div>

            {/* Terms Modal */}
            <AnimatePresence>
                {showTerms && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-end justify-center bg-[#1D1D1F]/40 backdrop-blur-sm"
                        onClick={() => setShowTerms(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full h-[85vh] bg-[#FFFFFF] rounded-t-[2.5rem] p-8 pb-12 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-1.5 bg-[#E5E5EA] rounded-full mx-auto mb-8" />
                            <h3 className="text-2xl font-bold mb-6 tracking-tight text-[#1D1D1F]">Legal Terms</h3>
                            <div className="flex-1 overflow-y-auto pr-4 space-y-6 text-[#48484A] leading-relaxed">
                                <p>
                                    <strong>1. Introduction</strong><br />
                                    Welcome to Skinface.ai. By using our service, you agree to these terms...
                                </p>
                                <p>
                                    <strong>2. Privacy Policy</strong><br />
                                    Your photos are processed securely and are never shared with third parties without your explicit consent...
                                </p>
                            </div>
                            <button
                                onClick={() => setShowTerms(false)}
                                className="mt-8 w-full py-4 rounded-full font-bold text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] active:bg-[#D1D1D6] transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WelcomeScreen;
