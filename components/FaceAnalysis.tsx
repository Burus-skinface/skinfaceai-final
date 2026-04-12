import React from 'react';
import { DailyReport } from '../types';
import { t } from '../localization';
import FaceBig6InsightsResult from './FaceBig6InsightsResult';

const FaceAnalysis: React.FC<{ data: DailyReport | null, dayNumber: number }> = ({ data, dayNumber }) => {
    // Force Re-render: UI Polish V2 applied
    const [showDebug, setShowDebug] = React.useState(false);

    if (!data?.analysis?.face || !data?.faceState) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-gray-400 text-center">
                <h2 className="text-2xl font-semibold">{t.noFaceData}</h2>
                <p className="mt-2">{t.uploadForDetailedAnalysis}</p>
            </div>
        );
    }

    const { eliteReport } = data.recommendations;
    const debug = data.scoring?.face?.archetypeDebug;

    return (
        <div className="w-full max-w-lg mx-auto pb-6 pt-16">
            {/* Local Header Elements Removed - Now in Global Header */}

            {/* Archetype & Face Shape Modules */}
            <div className="mb-6 grid grid-cols-2 gap-4">
                {data.scoring?.face?.archetype && (
                    <div
                        onClick={() => setShowDebug(true)}
                        className="text-center animate-fade-in bg-gradient-to-br from-purple-900/20 to-black p-5 rounded-3xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)] cursor-pointer active:scale-95 transition-transform group relative overflow-hidden"
                    >
                        <p className="text-[10px] font-mono text-purple-400/60 mb-1 uppercase tracking-widest">Archetype</p>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">
                            {data.scoring.face.archetype}
                        </h2>
                        <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">View Specs</span>
                        </div>
                    </div>
                )}

                {data.analysis?.face?.profile?.faceShape && (
                    <div
                        className="text-center animate-fade-in bg-gradient-to-br from-indigo-900/20 to-black p-5 rounded-3xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)] transition-transform overflow-hidden"
                    >
                        <p className="text-[10px] font-mono text-indigo-400/60 mb-1 uppercase tracking-widest">Face Shape</p>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">
                            {data.analysis.face.profile.faceShape}
                        </h2>
                    </div>
                )}
            </div>

            {/* Elite Structural Verdict */}
            <div className="mb-8 text-center animate-fade-in bg-[#0A0A0A] p-6 rounded-3xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <p className="text-xs font-mono text-purple-400 mb-3 uppercase tracking-widest">Structural Verdict</p>
                <h2 className="text-xl font-bold text-white leading-relaxed italic">
                    "{eliteReport.structuralVerdict}"
                </h2>
            </div>

            {/* FACE BIG 6 — AI Synthesis (replaces old 4-card system) */}
            <div className="mb-6">
                <FaceBig6InsightsResult
                    insights={data.recommendations?.faceBig6Insights}
                    scores={data.scoring?.faceBig6}
                />
            </div>

            {/* Qualitative Assets (Secondary) */}
            <div className="grid grid-cols-1 gap-4 mt-8">
                <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Structural Notes</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-bold text-green-400 uppercase">Key Assets:</span>
                            <p className="text-xs text-gray-400 mt-1">
                                {eliteReport.technicalAssets.map(a => a.term).join(", ")}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-amber-400 uppercase">Areas of focus:</span>
                            <p className="text-xs text-gray-400 mt-1">
                                {eliteReport.technicalDeficits.map(a => a.term).join(", ")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* DEV LOG MODAL */}
            {showDebug && debug && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Archetype Engine Log</h3>
                            <button onClick={() => setShowDebug(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs">✕</button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Trait Analysis (0-10)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(debug.traits).map(([trait, val]) => (
                                        <div key={trait} className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <p className="text-[9px] text-gray-500 font-bold uppercase truncate">{trait.replace('_', ' ')}</p>
                                            <p className="text-sm font-black text-white">{val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Candidate Rankings</p>
                                <div className="space-y-2">
                                    {debug.candidates.sort((a, b) => b.score - a.score).map((c) => (
                                        <div key={c.id} className={`p-4 rounded-3xl border ${c.passedGate ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/10 opacity-50'}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black text-white uppercase">{c.displayName}</span>
                                                <span className="text-xs font-black text-white italic">%{Math.round(c.score)}</span>
                                            </div>
                                            <p className={`text-[8px] font-bold uppercase tracking-widest ${c.passedGate ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {c.passedGate ? 'Gate Passed' : `Blocked: ${c.gateTrait} (${c.gateValue} < ${c.gateThreshold})`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white/[0.02] text-center border-t border-white/5">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest italic">Transparency Protocol Active</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaceAnalysis;
