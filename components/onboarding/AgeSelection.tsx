import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AgeSelectionProps {
    onNext: (age: string) => void;
    onBack: () => void;
}

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"];

const AgeSelection: React.FC<AgeSelectionProps> = ({ onNext, onBack }) => {
    const [selected, setSelected] = useState<string | null>(null);

    const handleSelect = (age: string) => {
        setSelected(age);
        setTimeout(() => onNext(age), 250);
    };

    return (
        <div className="relative flex flex-col h-full bg-[#050505] text-white font-sans overflow-hidden">
            {/* Background Aurora - Dual Orbs */}
            <div className="absolute inset-x-0 -top-20 h-[70%] bg-purple-900/30 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute -inset-x-20 top-20 h-[60%] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="bg-noise-subtle absolute inset-0 pointer-events-none" />

            {/* Navbar */}
            <div className="relative z-10 px-6 pt-12 pb-4 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 transition-all border border-white/20 shadow-lg"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-widest">Step 1/4</div>
                <div className="w-10" />
            </div>

            <div className="relative z-10 px-6 mb-8 mt-6">
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Your Age</h2>
                <p className="text-gray-400 text-[15px] leading-relaxed max-w-xs">
                    This helps us calibrate our analysis for your specific skin maturity phase.
                </p>
            </div>

            {/* List */}
            <motion.div
                className="flex-1 px-6 pb-8 overflow-y-auto scrollbar-hide space-y-4"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.08 }
                    }
                }}
                initial="hidden"
                animate="show"
            >
                {AGE_RANGES.map((age) => (
                    <motion.button
                        key={age}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0 }
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelect(age)}
                        className={`w-full h-[68px] border rounded-2xl flex items-center justify-between px-6 transition-colors duration-200 active:bg-white/10 ${selected === age
                                ? 'bg-purple-500/20 border-purple-400/60'
                                : 'bg-white/5 border-white/10'
                            }`}
                    >
                        <span className="text-xl font-medium text-gray-200">{age}</span>

                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${selected === age ? 'border-purple-400 bg-purple-500' : 'border-white/20'
                            }`}>
                            {selected === age && (
                                <motion.div
                                    className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                />
                            )}
                        </div>
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
};

export default AgeSelection;
