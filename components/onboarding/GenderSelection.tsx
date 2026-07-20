import React, { useState } from 'react';

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
        <div className="relative flex flex-col h-full min-h-0 bg-[#FFFFFF] text-[#1D1D1F] font-sans overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-x-0 -top-20 h-[70%] bg-gradient-to-b from-[#F5F5F7] to-transparent pointer-events-none" />

            {/* Navbar */}
            <div className="relative z-10 px-6 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] sm:pt-[calc(env(safe-area-inset-top,0px)+1.75rem)] pb-2 sm:pb-3 flex items-center justify-between shrink-0">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-all flex items-center justify-center text-[#1D1D1F]"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">Profile 2/2</div>
                <div className="w-10" />
            </div>

            <div className="relative z-10 px-8 mb-3 sm:mb-5 mt-1 sm:mt-3 shrink-0 pointer-events-none">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 tracking-tight text-[#1D1D1F]">Gender</h2>
                <p className="text-[#86868B] text-[13px] sm:text-[15px] leading-relaxed max-w-xs">
                    Skin characteristics vary based on biological factors. This helps us personalize your analysis.
                </p>
            </div>

            {/* Options */}
            <div
                className="relative z-30 flex-1 min-h-0 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] overflow-y-auto overscroll-contain scrollbar-hide space-y-2 sm:space-y-4"
            >
                {[
                    { id: 'male', label: 'Male', sub: 'Male skin characteristics' },
                    { id: 'female', label: 'Female', sub: 'Female skin characteristics' },
                    { id: 'non-binary', label: 'Other', sub: 'Mixed skin profile' },
                ].map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleSelect(option.id)}
                        className={`relative z-50 w-full rounded-[1.4rem] sm:rounded-[2rem] p-3 sm:p-6 px-5 sm:px-8 border text-left transition-all duration-200 shadow-sm active:scale-[0.97] ${selected === option.id
                                ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white'
                                : 'bg-white border-black/5 text-[#1D1D1F] hover:bg-[#F5F5F7]'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-lg sm:text-2xl font-semibold tracking-tight">{option.label}</span>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${selected === option.id ? 'border-none bg-none' : 'border-black/10'
                                }`}>
                                {selected === option.id && (
                                    <div
                                        className="w-full h-full rounded-full flex items-center justify-center bg-white"
                                    >
                                        <svg className="w-4 h-4 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={`text-sm ${selected === option.id ? 'text-white/70' : 'text-[#86868B]'}`}>
                            {option.sub}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GenderSelection;
