import React from 'react';
import { DailyReport } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { FaceIcon } from './icons/FaceIcon';
import { NoseIcon } from './icons/NoseIcon';
import { JawIcon } from './icons/JawIcon';
import { Sparkles } from './icons/SparklesIcon';
import { t, translateDynamicNote } from '../localization';

const getTierSpec = (score: number) => {
    if (score >= 9.2) return { label: 'LEGENDARY', color: '#FFD700', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' };
    if (score >= 7.5) return { label: 'HEROIC', color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' };
    if (score >= 6.0) return { label: 'BALANCED', color: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' };
    return { label: 'GROWING', color: '#F97316', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' };
};

const AnalysisCard: React.FC<{
    title: string;
    score: number;
    verdict: string;
    icon: React.ReactNode;
    impacts?: { metric: string; state: string; val: string; reasoning?: string; rawScore?: number; measurementLabel?: string }[];
    isDevMode?: boolean;
    rawMeasurementData?: any;
}> = ({ title, score, verdict, icon, impacts, isDevMode, rawMeasurementData }) => {
    const tier = getTierSpec(score);

    return (
        <div className={`bg-[#1C1C1E] rounded-[2.5rem] border border-white/5 overflow-hidden relative group`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${tier.bg} to-transparent opacity-30`}></div>

            <div className="relative p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center ${tier.bg} rounded-3xl border ${tier.border} shadow-xl`}>
                        {React.cloneElement(icon as React.ReactElement, { className: `w-5 h-5 ${tier.text}` } as any)}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-lg font-black text-gray-100 tracking-tight italic uppercase truncate">{title}</h4>
                        <div className="flex flex-col gap-1">
                            <p className="text-[12px] text-gray-400 font-medium leading-snug mt-1 break-words">
                                {verdict}
                            </p>
                            {isDevMode && (
                                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-900/20 px-1 rounded border border-cyan-800/50 w-fit">
                                    DEV: {score.toFixed(3)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-auto bg-black/20 px-3 py-1 rounded-2xl border border-white/5">
                    <span className={`text-3xl font-black ${tier.text}`}>
                        {score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">/10</span>
                </div>
            </div>

            {/* IMPACTS LIST - ALWAYS VISIBLE */}
            <div className="px-6 pb-6 space-y-3">
                {/* DEV MODE INTEL */}
                {isDevMode && (
                    <div className="p-4 bg-black rounded-xl border border-dashed border-gray-700 font-mono text-[10px] text-gray-400 space-y-2 overflow-x-auto">
                        <p className="text-cyan-500 font-bold">🛠️ RAW DATA</p>
                        <pre className="whitespace-pre-wrap break-all text-emerald-500/80">
                            {JSON.stringify(rawMeasurementData, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="space-y-3 pt-3 border-t border-white/5">
                    {impacts && impacts.map((imp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 gap-3">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider truncate">{imp.metric}</span>
                                {imp.measurementLabel && (
                                    <span className="text-[9px] font-mono text-purple-400/60 leading-none mt-0.5 uppercase truncate">
                                        {imp.measurementLabel}
                                    </span>
                                )}
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className="text-base font-black text-white tracking-tight block">{imp.val}</span>
                                <div className="text-[9px] font-bold text-gray-500 uppercase">{imp.state}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FacialAnalysisResult: React.FC<{ report: DailyReport }> = ({ report }) => {
    const [isDevMode, setIsDevMode] = React.useState(false); // Hidden Toggle
    const m = report.scoring?.face?.measurements;
    const ai = report.recommendations?.eliteReport?.featureBreakdown;

    // Quick Dev Toggle (Triple Click on Title)
    // For now, let's just default to visible if requested, or add a button.
    // User asked "DEV İÇİN YAPIYON BUNLARI", implies they want it ON.

    if (!m) return null;

    // Helper to find AI analysis for a feature
    const getAIAnalysis = (key: string, fallback: string) => {
        if (!ai) return fallback;
        const match = ai.find(f => f.featureName.toLowerCase().includes(key.toLowerCase()));
        return match ? match.analysis : fallback;
    };

    // 1. Front Architecture (4 Metrics)
    const cardFront = {
        title: "Front Profile", // Reverted from "Front Architecture"
        score: (m.facialThirds?.score || 0) / 10,
        verdict: "Structure",
        icon: <FaceIcon className="w-5 h-5 text-purple-400" />,
        impacts: m.facialThirds?.impacts,
        isDevMode,
        rawMeasurementData: {
            thirds: m.facialThirds,
            cheekbones: m.cheekbones,
            fwhr: m.fwhr,
            _scoring_formula: "Score = (FWHR * 40%) + (Cheekbones * 30%) + (Eye Spacing * 20%) + (Thirds * 10%)"
        }
    };

    // 2. Jawline Strength (4 Metrics)
    const cardJaw = {
        title: "Jawline", // Reverted from "Jawline Strength"
        score: (m.jawAngularity?.overallScore || 0) / 10,
        verdict: "Definition",
        icon: <JawIcon className="w-5 h-5 text-teal-400" />,
        impacts: m.jawAngularity?.impacts,
        isDevMode,
        rawMeasurementData: {
            ...m.jawAngularity,
            _scoring_formula: "Score = (Gonial * 35%) + (Chin Width * 25%) + (Jaw Width * 20%) + (Ramus * 20%)"
        }
    };

    // 3. Side Profile (4 Metrics)
    const cardSide = {
        title: "Side Profile", // Reverted from "Side Profile Analysis"
        score: (m.sideProfile?.overallScore || 0) / 10,
        verdict: "Projection",
        icon: <NoseIcon className="w-5 h-5 text-blue-400" />,
        impacts: m.sideProfile?.impacts,
        isDevMode,
        rawMeasurementData: {
            ...m.sideProfile,
            _scoring_formula: "Score = (Nasofrontal * 30%) + (Neck * 30%) + (Chin Proj * 20%) + (Ramus * 20%)",
            _geometry_debug: {
                nasofrontalAngle: report.faceState?.geometry?.nasofrontalAngle?.toFixed(1) + "°",
                cervicoMentalAngle: report.faceState?.geometry?.cervicoMentalAngle?.toFixed(1) + "°",
                chinProjectionRatio: report.faceState?.geometry?.chinProjectionRatio?.toFixed(2) + "mm",
                chinBalance: report.faceState?.geometry?.chinBalance?.toFixed(3),
                expected_ranges: {
                    Nasofrontal: "120-130°",
                    Cervicomental: "90-120°",
                    ChinProj: "5-15mm",
                    ChinWidth: "0.45-0.55"
                }
            }
        }
    };

    // 4. Harmony (4 Metrics)
    const cardHarmony = {
        title: "Facial Harmony", // Reverted from "Harmony & Symmetry"
        score: (m.harmony?.overallScore || 0) / 10,
        verdict: "Balance",
        icon: <EyeIcon className="w-5 h-5 text-rose-400" />,
        impacts: m.harmony?.impacts,
        isDevMode,
        rawMeasurementData: {
            ...m.harmony,
            _scoring_formula: "Score = (Symmetry * 40%) + (Golden Ratio * 30%) + (Lip/Nose * 15%) + (Fifths * 15%)"
        }
    };

    return (
        <div className="w-full mt-10 space-y-8">
            <div className="px-2 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">
                        {t.facialAnalysisTitle}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-8 h-1 bg-purple-500 rounded-full"></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.structuralIntegrityReport}</p>
                    </div>
                </div>
                {/* DEV TOGGLE */}
                <button
                    onClick={() => setIsDevMode(!isDevMode)}
                    className={`px-3 py-1 rounded-full text-[10px] font-mono border transition-colors ${isDevMode ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400' : 'bg-transparent border-gray-800 text-gray-600'}`}
                >
                    {isDevMode ? 'DEV MODE: ON' : 'DEV MODE'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* 0. Face Shape Score (Overall Structure) - NEW */}
                <AnalysisCard
                    title="Face Shape Score"
                    score={(report.scoring?.face?.statusScores?.overallStructure || 0) / 10}
                    verdict="Overall Architecture"
                    icon={<FaceIcon className="w-5 h-5 text-amber-400" />}
                    impacts={[
                        { metric: "Front Profile", state: cardFront.verdict, val: cardFront.score.toFixed(1), measurementLabel: "Strength" },
                        { metric: "Jawline", state: cardJaw.verdict, val: cardJaw.score.toFixed(1), measurementLabel: "Definition" },
                        { metric: "Side Profile", state: cardSide.verdict, val: cardSide.score.toFixed(1), measurementLabel: "Projection" },
                        { metric: "Harmony", state: cardHarmony.verdict, val: cardHarmony.score.toFixed(1), measurementLabel: "Balance" }
                    ]}
                    isDevMode={isDevMode}
                    rawMeasurementData={{
                        _note: "Aggregate of all 4 categories",
                        details: report.scoring?.face?.statusScores
                    }}
                />

                <AnalysisCard {...cardFront} />
                <AnalysisCard {...cardSide} />
                <AnalysisCard {...cardJaw} />
                <AnalysisCard {...cardHarmony} />
            </div>

            {/* Motivational Footer Card */}
            <div className="bg-gradient-to-br from-purple-500/10 to-transparent p-8 rounded-[2.5rem] border border-purple-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles className="w-20 h-20 text-purple-400" />
                </div>
                <h3 className="text-xs font-black text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                    {t.dailyAICommentary}
                </h3>
                <p className="text-base font-bold text-gray-200 italic leading-relaxed relative z-10">
                    "{translateDynamicNote(report.daily_note || report.recommendations?.motivationalNote || "Your structural foundation is solid. Focus on the refinement markers to achieve Legendary status.")}"
                </p>
            </div>
        </div>
    );
};

export default FacialAnalysisResult;
// Force UI Update v2