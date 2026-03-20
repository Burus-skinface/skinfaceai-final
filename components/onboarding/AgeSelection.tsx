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
        <div className="relative flex flex-col h-full bg-[#FFFFFF] text-[#1D1D1F] font-sans overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-x-0 -top-20 h-[70%] bg-[#F5F5F7] blur-[120px] rounded-full pointer-events-none" />

            {/* Navbar */}
            <div className="relative z-10 px-6 pt-12 pb-4 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-all flex items-center justify-center text-[#1D1D1F]"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">Step 1/4</div>
                <div className="w-10" />
            </div>

            <div className="relative z-10 px-8 mb-8 mt-6">
                <h2 className="text-3xl font-bold mb-3 tracking-tight text-[#1D1D1F]">Your Age</h2>
                <p className="text-[#86868B] text-[15px] leading-relaxed max-w-xs">
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
                        className={`w-full h-[72px] rounded-[2rem] flex items-center justify-between px-8 border transition-all duration-200 shadow-sm ${selected === age
                                ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white'
                                : 'bg-white border-black/5 text-[#1D1D1F] hover:bg-[#F5F5F7]'
                            }`}
                    >
                        <span className="text-xl font-semibold tracking-tight">{age}</span>

                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${selected === age ? 'border-none bg-none' : 'border-black/10'
                            }`}>
                            {selected === age && (
                                <motion.div
                                    className="w-full h-full rounded-full flex items-center justify-center bg-white"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <svg className="w-4 h-4 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                            )}
                        </div>
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
};

export default AgeSelection;
