
import React, { useState } from 'react';
import { DailyReport } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { Sparkles } from './icons/SparklesIcon';
import { t } from '../localization';
import CelebrityMatch from './CelebrityMatch';

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

            {/* PROTOCOL SECTIONS */}
            <div className="space-y-6">
                {/* MORNING PROTOCOL */}
                <div className="bg-[#1C1C1E] rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="p-8 bg-gradient-to-r from-amber-500/5 to-transparent border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white italic tracking-tight uppercase">{t.morningProtocol}</h3>
                                <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mt-0.5">{t.morningProtocolDesc}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                    <div className="p-8 space-y-4">
                        {recommendations?.dailyRoutine?.morning.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-black/30 rounded-3xl border border-white/5 group hover:bg-black/50 transition-colors">
                                <span className="text-xs font-black text-amber-500/40 mt-1">0{idx + 1}</span>
                                <p className="text-sm font-bold text-gray-300 leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EVENING PROTOCOL */}
                <div className="bg-[#1C1C1E] rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="p-8 bg-gradient-to-r from-indigo-500/5 to-transparent border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white italic tracking-tight uppercase">{t.eveningProtocol}</h3>
                                <p className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest mt-0.5">{t.eveningProtocolDesc}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-inherit">Pending</span>
                        </div>
                    </div>
                    <div className="p-8 space-y-4">
                        {recommendations?.dailyRoutine?.evening.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-black/30 rounded-3xl border border-white/5 group hover:bg-black/50 transition-colors">
                                <span className="text-xs font-black text-indigo-500/40 mt-1">0{idx + 1}</span>
                                <p className="text-sm font-bold text-gray-300 leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

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
