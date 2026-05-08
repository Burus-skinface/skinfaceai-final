
import React, { useState } from 'react';
import { DailyReport } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { Sparkles } from './icons/SparklesIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { t } from '../localization';
import { PRODUCT_CATALOG } from '../utils/products';

const AestheticsScoreCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
);



const Recommendations: React.FC<{ data: DailyReport | null, gender?: string }> = ({ data, gender }) => {
    const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');

    // Defensive guard: missing payload OR missing routine shapes both render the empty state
    // rather than throwing on a bad destructure / .map() of undefined.
    const recommendations = data?.recommendations;
    const dailyRoutine = recommendations?.dailyRoutine;
    const morning = Array.isArray(dailyRoutine?.morning) ? dailyRoutine.morning : null;
    const evening = Array.isArray(dailyRoutine?.evening) ? dailyRoutine.evening : null;
    const recommendedProducts = Array.isArray(recommendations?.recommendedProducts)
        ? recommendations!.recommendedProducts
        : [];
    const motivationalNote = recommendations?.motivationalNote ?? '';

    if (!recommendations || !data?.scoring || !morning || !evening) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#48484A] text-center px-6 pt-20">
                <div className="w-20 h-20 bg-black/[0.04] rounded-[2rem] border border-black/[0.06] flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-[#86868B]" />
                </div>
                <h2 className="text-2xl font-black text-[#1D1D1F] italic tracking-tighter uppercase">{t.noRecommendations}</h2>
                <p className="mt-2 text-sm font-medium text-[#86868B] leading-relaxed max-w-[280px]">{t.uploadForRecommendations}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto pb-10 space-y-10 mt-6 pt-16">
            <div className="px-2">
                <h1 className="text-3xl font-black text-[#1D1D1F] italic tracking-tighter uppercase leading-none">{t.glowupActionPlan}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
                    <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">{t.glowupActionPlanDesc}</p>
                </div>
            </div>

            {/* PROTOCOL SECTIONS (APPLE PREMIUM STYLE) */}
            <div className="space-y-8">
                {/* Tab Switcher */}
                <div className="flex justify-center">
                    <div className="inline-flex bg-[#F5F5F7] p-1.5 rounded-[2rem] border border-black/5 backdrop-blur-md relative shadow-sm">
                        <button
                            onClick={() => setActiveTab('morning')}
                            className={`relative z-10 flex items-center gap-2.5 px-6 py-3 rounded-[1.75rem] transition-all duration-300 font-bold text-sm select-none ${
                                activeTab === 'morning' 
                                ? 'text-[#1D1D1F]' 
                                : 'text-[#86868B] hover:text-[#48484A]'
                            }`}
                        >
                            <span>Sabah görevi</span>
                            <SunIcon className={`w-4 h-4 transition-colors ${activeTab === 'morning' ? 'text-amber-500' : 'text-[#86868B] hover:text-[#48484A]'}`} />
                        </button>
                        
                        <button
                            onClick={() => setActiveTab('evening')}
                            className={`relative z-10 flex items-center gap-2.5 px-6 py-3 rounded-[1.75rem] transition-all duration-300 font-bold text-sm select-none ${
                                activeTab === 'evening' 
                                ? 'text-[#1D1D1F]' 
                                : 'text-[#86868B] hover:text-[#48484A]'
                            }`}
                        >
                            <span>Gece görevi</span>
                            <MoonIcon className={`w-4 h-4 transition-colors ${activeTab === 'evening' ? 'text-indigo-500' : 'text-[#86868B] hover:text-[#48484A]'}`} />
                        </button>
                        
                        {/* Animated pill background */}
                        <div
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-[1.75rem] border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
                            style={{ 
                                transform: activeTab === 'morning' ? 'translateX(0)' : 'translateX(100%)',
                                left: '6px'
                            }}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-[#F5F5F7] rounded-[2.5rem] border border-black/5 overflow-hidden relative shadow-[0_4px_20px_rgba(0,0,0,0.02)] min-h-[360px]">
                    {/* Subtle aesthetic gradient */}
                    <div className="absolute top-0 left-0 w-full h-[200px] bg-gradient-to-b from-black/[0.01] to-transparent pointer-events-none"></div>
                    
                    {/* Morning Content */}
                    <div className={`transition-all duration-500 absolute w-full inset-0 p-8 pt-10 ${activeTab === 'morning' ? 'opacity-100 translate-y-0 relative z-10' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm">
                                <SunIcon className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#1D1D1F] italic tracking-tight uppercase">{t.morningProtocol}</h3>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-0.5">{t.morningProtocolDesc}</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative pl-1">
                            {/* Line connecting items */}
                            <div className="absolute left-[33px] top-6 bottom-6 w-px bg-black/5"></div>
                            
                            {morning.length === 0 ? (
                                <p className="text-sm text-[#86868B] italic">Bu ölçüm için sabah görevi yok.</p>
                            ) : morning.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-6 group relative">
                                    <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-[1.25rem] bg-white border border-black/5 flex items-center justify-center group-hover:border-purple-200 group-hover:bg-purple-50 transition-all shadow-sm">
                                        <span className="text-sm font-black text-black/30 group-hover:text-amber-500 transition-colors">0{idx + 1}</span>
                                    </div>
                                    <p className="text-[15px] font-medium text-[#48484A] leading-relaxed group-hover:text-[#1D1D1F] transition-colors flex-1 bg-white p-5 rounded-3xl border border-black/5 shadow-sm">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Evening Content */}
                    <div className={`transition-all duration-500 absolute w-full inset-0 p-8 pt-10 ${activeTab === 'evening' ? 'opacity-100 translate-y-0 relative z-10' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                                <MoonIcon className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#1D1D1F] italic tracking-tight uppercase">{t.eveningProtocol}</h3>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">{t.eveningProtocolDesc}</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative pl-1">
                            {/* Line connecting items */}
                            <div className="absolute left-[33px] top-6 bottom-6 w-px bg-black/5"></div>

                            {evening.length === 0 ? (
                                <p className="text-sm text-[#86868B] italic">Bu ölçüm için gece görevi yok.</p>
                            ) : evening.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-6 group relative">
                                    <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-[1.25rem] bg-white border border-black/5 flex items-center justify-center group-hover:border-purple-200 group-hover:bg-purple-50 transition-all shadow-sm">
                                        <span className="text-sm font-black text-black/30 group-hover:text-indigo-500 transition-colors">0{idx + 1}</span>
                                    </div>
                                    <p className="text-[15px] font-medium text-[#48484A] leading-relaxed group-hover:text-[#1D1D1F] transition-colors flex-1 bg-white p-5 rounded-3xl border border-black/5 shadow-sm">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* YOUR RECOMMENDATIONS (AMAZON AFFILIATE) */}
            {recommendedProducts.length > 0 && (
                <div className="space-y-4">
                    <h1 className="text-2xl font-black text-[#1D1D1F] italic tracking-tighter uppercase px-2 mb-2">
                        Görev Seti <span className="text-purple-600">/ Eşleşen Ürünler</span>
                    </h1>
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 scrollbar-hide px-2">
                        {recommendedProducts.map((aiRec, idx) => {
                            const product = PRODUCT_CATALOG.find(p => p.id === aiRec.productId);
                            if (!product) return null;
                            return (
                                <a 
                                    key={idx} 
                                    href={product.amazonAffiliateLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-shrink-0 w-[260px] snap-center bg-white border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden relative group block cursor-pointer hover:border-purple-500/30 transition-colors"
                                >
                                    {/* Product Image */}
                                    <div className="h-40 w-full relative bg-gray-50 overflow-hidden">
                                        {/* Skeleton loader — visible until image loads */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                                        <img 
                                            src={product.imageUrl} 
                                            alt={product.name} 
                                            className="relative w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        {/* Confidence Score Float */}
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-black/10 shadow-sm flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3 text-purple-600" />
                                            <span className="text-[10px] font-black text-[#1D1D1F] tracking-widest uppercase">{aiRec.confidenceScore}% eşleşme</span>
                                        </div>
                                        <div className="absolute top-3 right-3 bg-teal-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                                            {product.priceEstimation}
                                        </div>
                                    </div>
                                    
                                    {/* Product Info */}
                                    <div className="p-5 flex flex-col gap-3">
                                        <div>
                                            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mb-1">{product.category}</p>
                                            <h4 className="text-[#1D1D1F] font-bold leading-tight">{product.name}</h4>
                                        </div>
                                        <p className="text-[11px] text-[#48484A] leading-relaxed min-h-[48px]">
                                            "{aiRec.reason}"
                                        </p>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* STRATEGIC SUMMARY */}
            {motivationalNote && (
                <div className="bg-[#F5F5F7] p-10 rounded-[2.5rem] border border-black/5 relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <Sparkles className="w-24 h-24 text-black" />
                    </div>
                    <h3 className="text-xs font-black text-[#86868B] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-black/20"></div>
                        {t.strategicMemo}
                    </h3>
                    <p className="text-xl font-bold text-[#1D1D1F] italic leading-relaxed text-center relative z-10">
                        "{motivationalNote}"
                    </p>
                </div>
            )}
        </div>
    );
};

export default Recommendations;
