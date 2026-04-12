import React, { useState, useEffect } from 'react';
import { DailyReport } from '../types';
import { Sparkles } from './icons/SparklesIcon';
import { t } from '../localization';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { StarIcon } from './icons/StarIcon';
import { ShareIcon } from './icons/ShareIcon';
import { LockIcon } from './icons/LockIcon';
import { FireIcon } from './icons/FireIcon';
import { FaceIcon } from './icons/FaceIcon';
import { DropIcon } from './icons/DropIcon';
import { SunIcon } from './icons/SunIcon';
import { SpectrumIcon } from './icons/SpectrumIcon';

import Big6InsightsResult from './Big6InsightsResult';
import { generateShareCard } from '../utils/shareCard';
import ReferralCard from './ReferralCard';

interface ResultsProps {
    data: DailyReport;
    dayNumber: number;
    onShowPaywall?: () => void;
    isFreeUser?: boolean;
    user?: any;
    history?: DailyReport[];
    onNavigateToProgress?: () => void;
    onLogout?: () => void;
}

const Results: React.FC<ResultsProps> = ({ data, dayNumber, onShowPaywall, isFreeUser = true, user, history = [], onNavigateToProgress, onLogout }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [animatedScore, setAnimatedScore] = useState(0);

    // Animated score counter
    const targetScore = data?.scoring?.globalScore ?? 0;
    useEffect(() => {
        if (!targetScore) return;
        setAnimatedScore(0);
        const duration = 1200;
        const steps = 40;
        const stepTime = duration / steps;
        const increment = targetScore / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetScore) {
                setAnimatedScore(targetScore);
                clearInterval(timer);
            } else {
                setAnimatedScore(Math.round(current * 10) / 10);
            }
        }, stepTime);
        return () => clearInterval(timer);
    }, [targetScore]);

    const handleShare = async () => {
        if (!data || !data.scoring) return;
        setIsSharing(true);
        try {
            const blob = await generateShareCard(
                data.imageUrl,
                data.scoring.globalScore,
                data.scoring.potentialScore,
                dayNumber
            );
            const file = new File([blob], 'skinface-results.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: 'My SkinFace AI Results',
                    text: `My SkinFace AI score: ${data.scoring.globalScore.toFixed(1)}/10 🔥`,
                    files: [file],
                });
            } else {
                // Fallback: download the image
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'skinface-results.png';
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Share error:', err);
        } finally {
            setIsSharing(false);
        }
    };

    if (!data || !data.scoring || !data.analysis) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-gray-400 text-center">
                <h2 className="text-2xl font-semibold">{t.noAnalysisYet || "No analysis yet"}</h2>
                <p className="mt-2">{t.startJourney || "Start your journey"}</p>
            </div>
        );
    }

    const daily_note = data.recommendations?.motivationalNote || "";
    const score = data.scoring?.globalScore ?? null;
    const potential = data.scoring?.potentialScore ?? null;

    const getScoreColor = (s: number) => {
        if (s >= 9) return 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]';
        if (s >= 7.5) return 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]';
        if (s >= 5.0) return 'text-yellow-400';
        return 'text-red-400';
    };

    // Get last 7 days for tracking
    const getDayLabel = (index: number) => {
        const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const today = new Date();
        const day = new Date(today);
        day.setDate(today.getDate() - (6 - index));
        return days[day.getDay()];
    };

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const today = new Date();
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - (6 - i));
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasData = history.some(h => h.date.split('T')[0] === dateStr);
        const isToday = i === 6;
        return { day: getDayLabel(i), hasData, isToday };
    });

    return (
        <div className="flex flex-col w-full max-w-3xl mx-auto pt-14 px-2 pb-10 gap-2.5">
            {/* Header moved to GlobalAppHeader */}

            {/* 1. GLOWUP — Slim tracker strip */}
            <div className="w-full bg-[#1C1C1E]/80 rounded-xl border border-white/[0.05]">
                {/* Day label + progress link */}
                <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5">
                    <div className="flex items-center gap-1.5">
                        <FireIcon className={`w-3 h-3 ${dayNumber >= 3 ? 'text-orange-500' : 'text-gray-600'}`} />
                        <span className="text-[12px] font-bold text-white/80 tracking-tight">
                            Day {dayNumber}
                        </span>
                    </div>
                    <button
                        onClick={onNavigateToProgress}
                        className="group flex items-center gap-0.5 text-[11px] font-medium text-gray-500 hover:text-white transition-colors"
                    >
                        Progress
                        <svg className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* 7-day dot tracker */}
                <div className="flex items-center justify-between px-3.5 pb-2.5">
                    {last7Days.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-0.5">
                            <span className={`text-[7px] font-bold tracking-wide ${day.isToday ? 'text-white/60' : 'text-gray-600'}`}>{day.day}</span>
                            <div className={`w-[26px] h-[20px] rounded-[5px] flex items-center justify-center ${day.hasData
                                ? 'bg-purple-600/80'
                                : day.isToday ? 'bg-white/[0.06] ring-1 ring-white/[0.08]' : 'bg-white/[0.03]'
                                }`}>
                                {day.hasData && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Scores — standalone inline row */}
            <div className="flex items-center px-1">
                {/* General */}
                <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Score</span>
                    {score === null ? (
                        <span className="text-lg font-black tabular-nums text-white/15 blur-[1px]">9.4</span>
                    ) : (
                        <span className={`text-lg font-black tabular-nums ${getScoreColor(animatedScore)}`}>{animatedScore.toFixed(1)}</span>
                    )}
                </div>

                {/* Dot separator */}
                <div className="w-1 h-1 rounded-full bg-white/10" />

                {/* Potential */}
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Potential</span>
                    {score === null ? (
                        <span className="text-lg font-black tabular-nums text-white/15 blur-[1px]">9.9</span>
                    ) : (
                        <span className="text-lg font-black tabular-nums text-emerald-400">
                            {(potential ?? ((score || 0) * 1.1)).toFixed(1)}
                        </span>
                    )}
                </div>
            </div>

            {/* 3. Daily AI Analysis Report */}
            <div className="p-6 rounded-[2.5rem] bg-[#1C1C1E] border border-white/5 relative overflow-hidden group">
                {/* Glossy Effect */}
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                        </div>
                        <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">{t.dailyAICommentary}</p>
                    </div>
                    <p className="text-md font-medium text-gray-200 italic leading-relaxed">
                        "{daily_note || "Your skin is showing positive signs of adaptation. Stay consistent with the current protocol."}"
                    </p>
                </div>
            </div>

            {/* 3.5. BIG 6 AI SYNTHESIS */}
            {data.recommendations?.big6Insights && (
                <div className="w-full">
                    <Big6InsightsResult
                        insights={data.recommendations.big6Insights}
                        metrics={data.scoring?.advancedSkinMetrics}
                    />
                </div>
            )}

            {/* 5. Skin Profile Card */}
            {data.analysis?.skin?.profile && (
                <div className="p-6 rounded-[2.5rem] bg-[#1C1C1E] border border-white/5 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                <FaceIcon className="w-4 h-4 text-emerald-400" />
                            </div>
                            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">{t.skinProfile}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Skin Type Card */}
                            <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 transition-colors hover:bg-white/[0.05]">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t.skinType}</p>
                                    <FaceIcon className="w-3.5 h-3.5 text-purple-400" />
                                </div>
                                <p className="text-xl font-bold text-white mb-1">
                                    {typeof data.analysis.skin.profile.skinType === 'object'
                                        ? data.analysis.skin.profile.skinType.value
                                        : data.analysis.skin.profile.skinType}
                                </p>
                                <p className="text-[10px] text-gray-500 leading-snug">
                                    {typeof data.analysis.skin.profile.skinType === 'object'
                                        ? data.analysis.skin.profile.skinType.description
                                        : ''}
                                </p>
                            </div>

                            {/* Moisture Card */}
                            <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 transition-colors hover:bg-white/[0.05]">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t.moisture}</p>
                                    <DropIcon className="w-3.5 h-3.5 text-cyan-400" />
                                </div>
                                <p className="text-xl font-bold text-white mb-1">
                                    {typeof data.analysis.skin.profile.moisture === 'object'
                                        ? data.analysis.skin.profile.moisture.value
                                        : data.analysis.skin.profile.moisture}
                                </p>
                                <p className="text-[10px] text-gray-500 leading-snug">
                                    {typeof data.analysis.skin.profile.moisture === 'object'
                                        ? data.analysis.skin.profile.moisture.description
                                        : ''}
                                </p>
                            </div>

                            {/* Oiliness Card */}
                            <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 transition-colors hover:bg-white/[0.05]">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t.oiliness}</p>
                                    <SunIcon className="w-3.5 h-3.5 text-orange-400/70" />
                                </div>
                                <p className="text-xl font-bold text-white mb-1">
                                    {typeof data.analysis.skin.profile.oiliness === 'object'
                                        ? data.analysis.skin.profile.oiliness.value
                                        : data.analysis.skin.profile.oiliness}
                                </p>
                                <p className="text-[10px] text-gray-500 leading-snug">
                                    {typeof data.analysis.skin.profile.oiliness === 'object'
                                        ? data.analysis.skin.profile.oiliness.description
                                        : ''}
                                </p>
                            </div>

                            {/* Skin Tone Card */}
                            <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 transition-colors hover:bg-white/[0.05]">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t.skinTone}</p>
                                    <SpectrumIcon className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <p className="text-xl font-bold text-white mb-1">
                                    {typeof data.analysis.skin.profile.skinTone === 'object'
                                        ? data.analysis.skin.profile.skinTone.value
                                        : data.analysis.skin.profile.skinTone}
                                </p>
                                <p className="text-[10px] text-gray-500 leading-snug">
                                    {typeof data.analysis.skin.profile.skinTone === 'object'
                                        ? data.analysis.skin.profile.skinTone.description
                                        : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Premium Features Teaser - Only for Free Users */}
            {(data.global_score === null || isFreeUser) && onShowPaywall && (
                <div className="w-full mt-2 p-6 bg-gradient-to-br from-purple-900/50 to-teal-900/50 rounded-2xl border-2 border-teal-500/30 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <StarIcon className="w-20 h-20 text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🚀</span>
                            <h3 className="text-lg font-bold text-white">Unlock Full Potential</h3>
                        </div>
                        <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                            Get detailed face scoring, maxxing guides, and advanced skin analysis.
                        </p>
                        <button
                            onClick={onShowPaywall}
                            className="w-full py-3 bg-white text-black font-black text-sm rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                        >
                            <LockIcon className="w-4 h-4" />
                            <span>REVEAL SCORES</span>
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-2">Starting from $4.99/week</p>
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="h-px bg-white/5 w-full my-2"></div>

            {/* 7. Referral Card — invite friends for premium */}
            {user?.id && (
                <ReferralCard userId={user.id} />
            )}

            {/* 8. Share Button */}
            <div className="w-full flex justify-center pb-4">
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors text-sm font-medium text-gray-300 disabled:opacity-50"
                    disabled={isSharing}
                >
                    {isSharing ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                    ) : (
                        <ShareIcon className="w-4 h-4" />
                    )}
                    {isSharing ? 'Generating...' : 'Share Results'}
                </button>
            </div>
        </div >
    );
};

export default Results;
