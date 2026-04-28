import React from 'react';
import { DailyReport } from '../types';
import { t } from '../localization';
import FaceBig6InsightsResult from './FaceBig6InsightsResult';

const FaceAnalysis: React.FC<{ data: DailyReport | null, dayNumber: number }> = ({ data, dayNumber }) => {
    // Force Re-render: UI Polish V2 applied
    const [showDebug, setShowDebug] = React.useState(false);

    if (!data?.analysis?.face || !data?.faceState) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 pt-16">
                <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.15)] mx-auto">
                        <svg className="w-14 h-14 text-indigo-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className="absolute inset-0 w-28 h-28 mx-auto rounded-[2.5rem] border border-indigo-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-3">
                    Deep Face<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Analysis Awaits</span>
                </h2>
                <p className="text-[15px] text-gray-400 leading-relaxed max-w-[280px] mb-8">
                    Scan your face to unlock your Facial Archetype, Big 6 scores, symmetry analysis, and structural verdict.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {['Face Archetype', 'Big 6 Scores', 'Symmetry', 'Bone Structure'].map(f => (
                        <div key={f} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 font-medium">
                            {f}
                        </div>
                    ))}
                </div>
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
                        className="text-center animate-fade-in bg-[#F5F5F7] p-5 rounded-3xl border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] cursor-pointer active:scale-95 transition-transform group relative overflow-hidden"
                    >
                        <p className="text-[10px] font-mono text-purple-600 mb-1 uppercase tracking-widest">Archetype</p>
                        <h2 className="text-sm font-black text-[#1D1D1F] uppercase tracking-wider">
                            {data.scoring.face.archetype}
                        </h2>
                        <div className="absolute inset-0 bg-black/[0.03] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest">View Specs</span>
                        </div>
                    </div>
                )}

                {data.analysis?.face?.profile?.faceShape && (
                    <div
                        className="text-center animate-fade-in bg-[#F5F5F7] p-5 rounded-3xl border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-transform overflow-hidden"
                    >
                        <p className="text-[10px] font-mono text-indigo-600 mb-1 uppercase tracking-widest">Face Shape</p>
                        <h2 className="text-sm font-black text-[#1D1D1F] uppercase tracking-wider">
                            {data.analysis.face.profile.faceShape}
                        </h2>
                    </div>
                )}
            </div>

            {/* Elite Structural Verdict */}
            <div className="mb-8 text-center animate-fade-in bg-white p-6 rounded-3xl border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <p className="text-xs font-mono text-purple-600 mb-3 uppercase tracking-widest">Structural Verdict</p>
                <h2 className="text-xl font-bold text-[#1D1D1F] leading-relaxed italic">
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
                <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
                    <h3 className="text-sm font-bold text-[#86868B] uppercase tracking-widest mb-4">Structural Notes</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-bold text-emerald-600 uppercase">Key Assets:</span>
                            <p className="text-xs text-[#48484A] mt-1">
                                {eliteReport.technicalAssets.map(a => a.term).join(", ")}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-amber-600 uppercase">Areas of focus:</span>
                            <p className="text-xs text-[#48484A] mt-1">
                                {eliteReport.technicalDeficits.map(a => a.term).join(", ")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* DEV LOG MODAL */}
            {showDebug && debug && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] border border-black/5 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F5F5F7]/50">
                            <h3 className="text-sm font-black text-[#1D1D1F] uppercase tracking-widest italic">Archetype Engine Log</h3>
                            <button onClick={() => setShowDebug(false)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-xs">✕</button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">Trait Analysis (0-10)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(debug.traits).map(([trait, val]) => (
                                        <div key={trait} className="bg-[#F5F5F7] p-3 rounded-2xl border border-black/5">
                                            <p className="text-[9px] text-[#86868B] font-bold uppercase truncate">{trait.replace('_', ' ')}</p>
                                            <p className="text-sm font-black text-[#1D1D1F]">{val}</p>
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
