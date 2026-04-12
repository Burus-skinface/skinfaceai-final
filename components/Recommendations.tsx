
import React, { useState } from 'react';
import { DailyReport } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { Sparkles } from './icons/SparklesIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { t } from '../localization';
import CelebrityMatch from './CelebrityMatch';
import { PRODUCT_CATALOG } from '../utils/products';

const AestheticsScoreCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
);



const Recommendations: React.FC<{ data: DailyReport | null, gender?: string }> = ({ data, gender }) => {
    if (!data?.recommendations || !data?.scoring) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400 text-center px-6">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-gray-600" />
                </div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">{t.noRecommendations}</h2>
                <p className="mt-2 text-sm font-medium text-gray-500 leading-relaxed">{t.uploadForRecommendations}</p>
            </div>
        );
    }

    const [showCelebrityMatch, setShowCelebrityMatch] = useState(false);
    const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
    const { recommendations, scoring } = data;

    return (
        <div className="w-full max-w-lg mx-auto pb-10 space-y-10 mt-6 pt-16">
            <div className="px-2">
                <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{t.glowupActionPlan}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-1 bg-amber-500 rounded-full"></div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.glowupActionPlanDesc}</p>
                </div>
            </div>

            {/* CELEBRITY ARCHETYPE CARD */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-[#1C1C1E] border border-white/5">
                {!showCelebrityMatch ? (
                    <div
                        onClick={() => setShowCelebrityMatch(true)}
                        className="p-8 cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                            <UsersIcon className="w-20 h-20 text-white" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                                <span className="text-xs font-black text-amber-500 uppercase tracking-[0.2em]">{t.archetypeDiscovery}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase max-w-[200px]">Find Your Aesthetic Match</h3>
                            <div className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                AI Comparison Active
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Celebrity Match Hub</h3>
                            <button
                                onClick={() => setShowCelebrityMatch(false)}
                                className="px-5 py-2 bg-white/5 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                Minimize
                            </button>
                        </div>
                        <CelebrityMatch
                            imageUrl={data.imageUrl}
                            celebrityMatch={data.celebrity_match}
                            faceShape={data.analysis?.face?.profile?.faceShape || 'oval'}
                        />
                    </div>
                )}
            </div>

            {/* PROTOCOL SECTIONS (APPLE PREMIUM STYLE) */}
            <div className="space-y-8">
                {/* Tab Switcher */}
                <div className="flex justify-center">
                    <div className="inline-flex bg-white/5 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-md relative shadow-lg">
                        <button
                            onClick={() => setActiveTab('morning')}
                            className={`relative z-10 flex items-center gap-2.5 px-6 py-3 rounded-[1.75rem] transition-all duration-300 font-bold text-sm select-none ${
                                activeTab === 'morning' 
                                ? 'text-white' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <span>Morning routine</span>
                            <SunIcon className={`w-4 h-4 transition-colors ${activeTab === 'morning' ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}`} />
                        </button>
                        
                        <button
                            onClick={() => setActiveTab('evening')}
                            className={`relative z-10 flex items-center gap-2.5 px-6 py-3 rounded-[1.75rem] transition-all duration-300 font-bold text-sm select-none ${
                                activeTab === 'evening' 
                                ? 'text-white' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <span>Night routine</span>
                            <MoonIcon className={`w-4 h-4 transition-colors ${activeTab === 'evening' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`} />
                        </button>
                        
                        {/* Animated pill background */}
                        <div
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-[1.75rem] border border-purple-500/20 shadow-[0_4px_16px_rgba(168,85,247,0.2)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] backdrop-blur-md`}
                            style={{ 
                                transform: activeTab === 'morning' ? 'translateX(0)' : 'translateX(100%)',
                                left: '6px'
                            }}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-[#1C1C1E]/80 backdrop-blur-2xl rounded-[2.5rem] border border-purple-500/10 overflow-hidden relative shadow-[0_10px_40px_rgba(168,85,247,0.03)] min-h-[360px]">
                    {/* Subtle aesthetic gradient */}
                    <div className="absolute top-0 left-0 w-full h-[200px] bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
                    
                    {/* Morning Content */}
                    <div className={`transition-all duration-500 absolute w-full inset-0 p-8 pt-10 ${activeTab === 'morning' ? 'opacity-100 translate-y-0 relative z-10' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                <SunIcon className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic tracking-tight uppercase">{t.morningProtocol}</h3>
                                <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mt-0.5">{t.morningProtocolDesc}</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative pl-1">
                            {/* Line connecting items */}
                            <div className="absolute left-[33px] top-6 bottom-6 w-px bg-white/5"></div>
                            
                            {recommendations?.dailyRoutine?.morning.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-6 group relative">
                                    <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-[1.25rem] bg-[#0A0A0A]/60 border border-white/5 flex items-center justify-center group-hover:border-purple-500/30 group-hover:bg-purple-500/5 transition-all shadow-sm backdrop-blur-sm">
                                        <span className="text-sm font-black text-white/30 group-hover:text-amber-400 transition-colors">0{idx + 1}</span>
                                    </div>
                                    <p className="text-[15px] font-medium text-gray-300 leading-relaxed group-hover:text-white transition-colors flex-1 bg-[#0A0A0A]/40 p-5 rounded-3xl border border-white/[0.03] backdrop-blur-sm">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Evening Content */}
                    <div className={`transition-all duration-500 absolute w-full inset-0 p-8 pt-10 ${activeTab === 'evening' ? 'opacity-100 translate-y-0 relative z-10' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                <MoonIcon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic tracking-tight uppercase">{t.eveningProtocol}</h3>
                                <p className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest mt-0.5">{t.eveningProtocolDesc}</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative pl-1">
                            {/* Line connecting items */}
                            <div className="absolute left-[33px] top-6 bottom-6 w-px bg-white/5"></div>

                            {recommendations?.dailyRoutine?.evening.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-6 group relative">
                                    <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-[1.25rem] bg-[#0A0A0A]/60 border border-white/5 flex items-center justify-center group-hover:border-purple-500/30 group-hover:bg-purple-500/5 transition-all shadow-sm backdrop-blur-sm">
                                        <span className="text-sm font-black text-white/30 group-hover:text-indigo-400 transition-colors">0{idx + 1}</span>
                                    </div>
                                    <p className="text-[15px] font-medium text-gray-300 leading-relaxed group-hover:text-white transition-colors flex-1 bg-[#0A0A0A]/40 p-5 rounded-3xl border border-white/[0.03] backdrop-blur-sm">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* YOUR RECOMMENDATIONS (AMAZON AFFILIATE) */}
            {recommendations?.recommendedProducts && recommendations.recommendedProducts.length > 0 && (
                <div className="space-y-4">
                    <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase px-2 mb-2">
                        Arsenal <span className="text-purple-400">/ Equipment</span>
                    </h1>
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 scrollbar-hide px-2">
                        {recommendations.recommendedProducts.map((aiRec, idx) => {
                            const product = PRODUCT_CATALOG.find(p => p.id === aiRec.productId);
                            if (!product) return null;
                            return (
                                <a 
                                    key={idx} 
                                    href={product.amazonAffiliateLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-shrink-0 w-[260px] snap-center bg-[#1C1C1E] border border-white/5 rounded-3xl overflow-hidden shadow-xl relative group block cursor-pointer hover:border-purple-500/30 transition-colors"
                                >
                                    {/* Product Image */}
                                    <div className="h-40 w-full relative bg-white/5 overflow-hidden">
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] to-transparent opacity-80"></div>
                                        {/* Confidence Score Float */}
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-purple-500/30 flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3 text-purple-400" />
                                            <span className="text-[10px] font-black text-white tracking-widest uppercase">{aiRec.confidenceScore}% Synergy</span>
                                        </div>
                                        <div className="absolute top-3 right-3 bg-amber-500 text-black px-2 py-0.5 rounded-full text-[10px] font-bold">
                                            {product.priceEstimation}
                                        </div>
                                    </div>
                                    
                                    {/* Product Info */}
                                    <div className="p-5 flex flex-col gap-3">
                                        <div>
                                            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">{product.category}</p>
                                            <h4 className="text-white font-bold leading-tight">{product.name}</h4>
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed min-h-[48px]">
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
            <div className="bg-gradient-to-br from-white/5 to-transparent p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles className="w-24 h-24 text-white" />
                </div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                    {t.strategicMemo}
                </h3>
                <p className="text-xl font-bold text-gray-200 italic leading-relaxed text-center relative z-10">
                    "{recommendations?.motivationalNote}"
                </p>
            </div>
        </div>
    );
};

export default Recommendations;
