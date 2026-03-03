import React from 'react';
import { DailyReport } from '../types';
import { Sparkles } from './icons/SparklesIcon';
import { t } from '../localization';

interface WeeklyRecapProps {
    history: DailyReport[];
}

const WeeklyRecap: React.FC<WeeklyRecapProps> = ({ history }) => {
    if (history.length === 0) return null;

    // DEV MODE BYPASS: If only 1 scan, simulate improvement for demo
    const isDev = history.length === 1;
    const latest = history[0];
    const prev = isDev ? null : history[1]; // Simple logic for now: compare latest with previous

    const getDelta = (current: number, previous: number | null, factor: number = 1) => {
        if (previous === null) return (Math.random() * 5 + 3).toFixed(1); // Simulated dev growth
        const diff = current - previous;
        return (diff * factor).toFixed(1);
    };

    const improvements = [
        { label: "Hydration", val: getDelta(latest.scoring?.skin?.condition.score || 0, prev?.scoring?.skin?.condition.score || null), color: "text-emerald-400", bg: "bg-emerald-400/20" },
        { label: "Skin Definition", val: getDelta(latest.scoring?.face?.statusScores.overallStructure || 0, prev?.scoring?.face?.statusScores.overallStructure || null, 0.1), color: "text-purple-400", bg: "bg-purple-400/20" },
        { label: "Acne Control", val: getDelta(latest.scoring?.skin?.statusScores?.acne || 0, prev?.scoring?.skin?.statusScores?.acne || null), color: "text-blue-400", bg: "bg-blue-400/20" }
    ];

    // Consistency Logic: Count scans in the last 7 days
    const scanCount = history.length > 7 ? 7 : history.length;
    const consistencyText = scanCount >= 7 ? "Great job staying consistent!" : "Build your streak!";

    return (
        <div className="w-full space-y-4 mb-8">
            <div className="px-2">
                <h1 className="text-3xl font-bold text-gray-100 mb-1 tracking-tight">Last week's report</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-400">Week</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded-full text-[10px] font-black text-gray-200">1</span>
                </div>
            </div>

            {/* CONSISTENCY CARD - PILL STYLE IMAGE MOCK */}
            <div className="relative p-6 rounded-[2.5rem] border border-white/5 bg-[#1C1C1E] overflow-hidden group">
                <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-gray-200">This week you scanned</p>
                            <h3 className="text-3xl font-black text-orange-200 tracking-tighter">
                                {scanCount}/7 <span className="text-xl opacity-80">times</span>
                            </h3>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full border border-gray-400"></div>
                                </div>
                                <p className="text-[13px] font-medium text-gray-400">{consistencyText}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">
                                    <div className="w-2 h-2 border-t border-r border-gray-400"></div>
                                </div>
                                <p className="text-[13px] font-medium text-gray-400">Average skin score: {Math.round(latest.scoring?.skin?.overallScore || 0 * 10)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Scanner Icon Mock */}
                    <div className="w-20 h-32 bg-gray-900 rounded-2xl border-4 border-gray-800 p-2 flex flex-col gap-2 shadow-2xl rotate-6">
                        <div className="w-full h-8 rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full border border-emerald-400/60"></div>
                        </div>
                        <div className="w-full h-8 rounded-full border-2 border-orange-500/40 bg-orange-500/10 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full border border-orange-400/60"></div>
                        </div>
                        <div className="w-full h-4 bg-gray-800 rounded-full mt-auto"></div>
                    </div>
                </div>
            </div>

            {/* IMPROVEMENTS SECTION - GRADIENT PILLS */}
            <div className="bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/10 rounded-[2.5rem] p-8">
                <h4 className="text-lg font-bold text-emerald-400 mb-8 tracking-tight">This week, you improved on</h4>

                <div className="space-y-8">
                    {improvements.map((imp, idx) => (
                        <div key={idx} className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-base font-bold text-gray-100 italic">{imp.label}</span>
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                                </svg>
                            </div>
                            <div className="relative w-full h-12 bg-black/20 rounded-full border border-white/5 p-1.5 flex items-center overflow-hidden">
                                <div
                                    className={`h-full bg-emerald-500/30 rounded-full transition-all duration-1000 flex items-center justify-end px-4`}
                                    style={{ width: `${Math.min(100, parseFloat(imp.val) * 8 + 40)}%` }}
                                >
                                    <span className="text-[14px] font-black text-emerald-400">+{imp.val}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WeeklyRecap;
