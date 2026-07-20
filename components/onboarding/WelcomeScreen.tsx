import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { localized } from '../../localization';
import LegalModal, { LegalTab } from '../LegalModal';
import { trackEvent } from '../../utils/analytics';

interface WelcomeScreenProps {
    onNext: () => void;
    onDevSkip?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext, onDevSkip }) => {
    const [legalTab, setLegalTab] = useState<LegalTab | null>(null);
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

    const handleStart = () => {
        trackEvent('onboarding_complete');
        onNext();
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
                    {/* Slide 1: Sample Report Hero */}
                    <div className="w-full h-full shrink-0 flex flex-col items-center justify-start sm:justify-center snap-center px-6 text-center pt-3 sm:pt-[3vh] overflow-y-auto scrollbar-hide">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="mb-4 sm:mb-6 w-full max-w-[250px] sm:max-w-[280px]"
                        >
                            <div className="relative mx-auto rounded-[2rem] bg-white border border-black/5 shadow-[0_18px_50px_rgba(45,30,61,0.10)] p-3 overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-24 bg-[#F5F5F7]" />
                                <div className="relative flex items-center gap-3 text-left">
                                    <img
                                        src="/images/sofia_portrait.png"
                                        alt="Sample Skinface scan"
                                        className="w-20 h-24 sm:w-24 sm:h-28 rounded-[1.35rem] sm:rounded-[1.5rem] object-cover object-center bg-[#F5F5F7]"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#86868B] mb-1">
                                            {localized('Sample report', 'Örnek rapor')}
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[36px] sm:text-[42px] font-black tracking-[-0.06em] text-[#7E4CA8] leading-none">8.0</span>
                                            <span className="text-sm font-bold text-[#C7C7CC]">/10</span>
                                        </div>
                                        <p className="text-[12px] font-semibold text-[#1D1D1F] mt-1">
                                            {localized('Good skin signal', 'İyi cilt sinyali')}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative grid grid-cols-3 gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
                                    {localized(['Texture', 'Hydration', 'Barrier'], ['Doku', 'Nem', 'Bariyer']).map((label, i) => (
                                        <div key={label} className="rounded-2xl bg-[#F5F5F7] px-2 py-2 text-center">
                                            <div className="text-[13px] sm:text-sm font-black text-[#1D1D1F]">{[88, 82, 76][i]}</div>
                                            <div className="text-[9px] font-bold text-[#86868B] uppercase tracking-wide">{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="text-[24px] sm:text-[30px] font-bold leading-[1.15] sm:leading-[1.2] tracking-tight text-[#1D1D1F] max-w-[310px] mx-auto text-balance"
                        >
                            {localized('One selfie. Your daily glow plan.', 'Tek selfie. Günlük glow planın.')}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="text-[14px] sm:text-[15px] text-[#86868B] mt-3 sm:mt-4 max-w-[290px] mx-auto leading-relaxed"
                        >
                            {localized(
                                'Get your skin score and daily task plan in about 60 seconds.',
                                'Yaklaşık 60 saniyede cilt skorunu ve günlük görev planını gör.'
                            )}
                        </motion.p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mt-3 sm:mt-4 max-w-[300px] pb-2">
                            {localized(['Acne', 'Tone', 'Pores', 'Pigment', 'Glow', 'Barrier'], ['Akne', 'Ton', 'Gözenek', 'Pigment', 'Glow', 'Bariyer']).map(label => (
                                <span key={label} className="px-2.5 py-1 rounded-full bg-black/[0.04] border border-black/[0.04] text-[11px] font-semibold text-[#48484A]">
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Slide 2: The Big 6 */}
                    <div className="w-full h-full shrink-0 flex flex-col items-center justify-center snap-center px-8 text-center pt-[5vh] overflow-y-auto scrollbar-hide">
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
                            {localized('Big 6 Signal Map', 'Big 6 Sinyal Haritası')}
                        </h2>
                        <p className="text-[15px] text-[#86868B] mt-5 max-w-[260px] mx-auto leading-relaxed">
                            {localized('We read acne, texture, hydration, tone, pigment, and barrier signals in one scan.', 'Akne, doku, nem, ton, pigment ve bariyer sinyalini tek ölçümde okuruz.')}
                        </p>
                    </div>

                    {/* Slide 3: Actionable Advice */}
                    <div className="w-full h-full shrink-0 flex flex-col items-center justify-center snap-center px-8 text-center pt-[5vh] overflow-y-auto scrollbar-hide">
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
                            {localized('Daily Task Plan', 'Günlük Görev Planı')}
                        </h2>
                        <p className="text-[15px] text-[#86868B] mt-5 max-w-[260px] mx-auto leading-relaxed">
                            {localized('Stop guessing. See the exact task your signal needs today.', 'Tahmin etmeyi bırak. Bugünkü sinyaline göre hangi görevi yapacağını net gör.')}
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
            <div className="relative z-10 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] sm:pb-12 w-full max-w-sm mx-auto flex flex-col gap-3 sm:gap-4 shrink-0">
                {/* Primary Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStart}
                    className="w-full h-[60px] rounded-full font-bold text-[18px] bg-[#1D1D1F] text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all flex items-center justify-center"
                >
                    {localized('Start first task', 'İlk görevi başlat')}
                </motion.button>
                
                {onDevSkip && (
                    <button 
                        onClick={onDevSkip}
                        className="w-full py-2 text-xs font-bold text-purple-500 border border-purple-200 rounded-full bg-purple-50"
                    >
                        [DEV] Skip to Results
                    </button>
                )}

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="text-[12px] text-center text-[#86868B] leading-[1.6] max-w-[280px] mx-auto"
                >
                    {localized('By proceeding you agree to our', 'Devam ederek kabul etmiş olursunuz:')}{' '}
                    <button
                        onClick={() => setLegalTab('terms')}
                        className="text-[#1D1D1F] underline decoration-[#1D1D1F]/30 underline-offset-2 font-medium"
                    >
                        {localized('terms of use', 'kullanım koşulları')}
                    </button>
                    {' '}{localized('and', 've')}{' '}
                    <button
                        onClick={() => setLegalTab('privacy')}
                        className="text-[#1D1D1F] underline decoration-[#1D1D1F]/30 underline-offset-2 font-medium"
                    >
                        {localized('privacy policy', 'gizlilik politikası')}
                    </button>
                    . {localized('Scan images are deleted within 24 hours; scores stay for progress.', 'Tarama görselleri 24 saat içinde silinir; skorlar ilerleme için saklanır.')}
                </motion.p>
            </div>

            {legalTab && (
                <LegalModal isOpen={!!legalTab} initialTab={legalTab} onClose={() => setLegalTab(null)} />
            )}
        </div>
    );
};

export default WelcomeScreen;
