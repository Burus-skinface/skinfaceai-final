import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface GenderSelectionProps {
    onNext: (gender: string) => void;
    onBack: () => void;
}

const GenderSelection: React.FC<GenderSelectionProps> = ({ onNext, onBack }) => {
    const [selected, setSelected] = useState<string | null>(null);

    const handleSelect = (id: string) => {
        setSelected(id);
        setTimeout(() => onNext(id), 250);
    };

    return (
        <div className="relative flex flex-col h-full bg-[#FFFFFF] text-[#1D1D1F] font-sans overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-x-0 -top-20 h-[70%] bg-gradient-to-b from-[#F5F5F7] to-transparent pointer-events-none" />

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
                <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">Step 2/4</div>
                <div className="w-10" />
            </div>

            <div className="relative z-10 px-8 mb-8 mt-6">
                <h2 className="text-3xl font-bold mb-3 tracking-tight text-[#1D1D1F]">Gender</h2>
                <p className="text-[#86868B] text-[15px] leading-relaxed max-w-xs">
                    Skin characteristics vary based on biological factors. This helps us personalize your analysis.
                </p>
            </div>

            {/* Options */}
            <motion.div
                className="relative z-10 flex-1 px-6 space-y-4"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.04 }
                    }
                }}
                initial="hidden"
                animate="show"
            >
                {[
                    { id: 'male', label: 'Male', sub: 'Male skin characteristics' },
                    { id: 'female', label: 'Female', sub: 'Female skin characteristics' },
                    { id: 'non-binary', label: 'Other', sub: 'Mixed skin profile' },
                ].map((option) => (
                    <motion.button
                        key={option.id}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            show: { opacity: 1, y: 0 }
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelect(option.id)}
                        className={`w-full rounded-[2rem] p-6 px-8 border text-left transition-all duration-200 shadow-sm ${selected === option.id
                                ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white'
                                : 'bg-white border-black/5 text-[#1D1D1F] hover:bg-[#F5F5F7]'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-2xl font-semibold tracking-tight">{option.label}</span>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${selected === option.id ? 'border-none bg-none' : 'border-black/10'
                                }`}>
                                {selected === option.id && (
                                    <motion.div
                                        className="w-full h-full rounded-full flex items-center justify-center bg-white"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <svg className="w-4 h-4 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                        <div className={`text-sm ${selected === option.id ? 'text-white/70' : 'text-[#86868B]'}`}>
                            {option.sub}
                        </div>
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
};

export default GenderSelection;
