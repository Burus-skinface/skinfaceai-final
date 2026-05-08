import React, { useState, useEffect, useMemo } from 'react';
import { DailyReport } from '../types';
import { Sparkles } from './icons/SparklesIcon';
import { t, localized } from '../localization';
import { ShareIcon } from './icons/ShareIcon';
import { LockIcon } from './icons/LockIcon';

import Big6InsightsResult from './Big6InsightsResult';
import { generateShareCard } from '../utils/shareCard';
import ReferralCard from './ReferralCard';

// Dashboard Components
import DashboardHeader from './dashboard/DashboardHeader';
import HeroScoreCard from './dashboard/HeroScoreCard';
import SecondaryScores from './dashboard/SecondaryScores';
import UpsellBanner from './dashboard/UpsellBanner';
import ActionableInsights from './dashboard/ActionableInsights';

interface ResultsProps {
    data: DailyReport;
    dayNumber: number;
    onShowPaywall?: () => void;
    isFreeUser?: boolean;
    user?: any;
    history?: DailyReport[];
    onNavigateToProgress?: () => void;
    onLogout?: () => void;
    onNewScan?: () => void;
}

const Results: React.FC<ResultsProps> = ({ data, dayNumber, onShowPaywall, isFreeUser = true, user, history = [], onNavigateToProgress, onLogout, onNewScan }) => {
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

    // ==========================================
    // EMPTY STATE — No data yet
    // ==========================================
    if (!data || !data.scoring || !data.analysis) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 pt-16">
                <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.2)] mx-auto">
                        <svg className="w-14 h-14 text-purple-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                        </svg>
                    </div>
                    <div className="absolute inset-0 w-28 h-28 mx-auto rounded-[2.5rem] border border-purple-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                </div>

                <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tight mb-3">
                    İlk Skorun<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Kilitli</span>
                </h2>
                <p className="text-[15px] text-[#86868B] leading-relaxed max-w-[280px] mb-10">
                    İlk taramayı yap. Cilt ve yüz sinyalini çıkaralım; sonra seri, trend ve görev planı çalışmaya başlar.
                </p>

                <div className="flex flex-wrap gap-2 justify-center mb-10">
                    {localized(['Face signal', 'Skin signal', '7-day plan', 'Daily streak'], ['Yüz sinyali', 'Cilt sinyali', '7 günlük plan', 'Günlük seri']).map(f => (
                        <div key={f} className="px-3 py-1.5 bg-black/[0.03] border border-black/[0.06] rounded-full text-xs text-[#86868B] font-medium">
                            {f}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 text-[#C7C7CC] text-xs">
                    <svg className="w-4 h-4 text-purple-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>Tap the camera button below to scan</span>
                    <svg className="w-4 h-4 text-purple-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        );
    }

    // ==========================================
    // DATA AVAILABLE — Full Dashboard
    // ==========================================
    const score = data.scoring?.globalScore ?? null;
    const potential = data.scoring?.potentialScore ?? null;
    const skinScore = data.scoring?.skin?.overallScore ?? null;
    const faceScoreRaw = data.scoring?.face?.statusScores;

    // Calculate face score as average of key metrics
    const faceScore = faceScoreRaw ? (() => {
        const vals = [
            faceScoreRaw.faceLengthWidthBalance,
            faceScoreRaw.verticalFacialDistribution,
            faceScoreRaw.jawCheekboneRatio,
            faceScoreRaw.overallStructure,
        ].filter(v => v != null && !isNaN(v));
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    })() : null;

    // Demographics: Real age from customer profile
    const userDemographics = (() => {
        try {
            const saved = localStorage.getItem('user_demographics');
            if (saved) return JSON.parse(saved);
        } catch {}
        return null;
    })();

    const realAge = (() => {
        const ageStr = userDemographics?.age;
        if (!ageStr) return null;
        // Parse age ranges like "18-24", "25-34", etc.
        const match = ageStr.match(/(\d+)/);
        if (match) return parseInt(match[1], 10);
        return null;
    })();

    // Skin age estimation from AI advanced metrics (uses radiance + barrier + quality)
    const skinAge = (() => {
        if (!realAge) return null;
        const metrics = data.scoring?.advancedSkinMetrics;
        if (!metrics) return realAge;
        // Simple model: base age + adjustments based on quality scores
        const qualityPenalty = (1 - metrics.avgQualityScore) * 8; // worse quality = older skin
        const healthPenalty = (1 - metrics.avgHealthScore) * 5;
        return Math.round(realAge + qualityPenalty + healthPenalty - 3); // slight offset for calibration
    })();

    // Previous scan for delta calculations
    const previousReport = history.length >= 2 ? history[history.length - 2] : null;
    const prevSkinScore = previousReport?.scoring?.skin?.overallScore ?? null;
    const prevFaceScoreRaw = previousReport?.scoring?.face?.statusScores;
    const prevFaceScore = prevFaceScoreRaw ? (() => {
        const vals = [
            prevFaceScoreRaw.faceLengthWidthBalance,
            prevFaceScoreRaw.verticalFacialDistribution,
            prevFaceScoreRaw.jawCheekboneRatio,
            prevFaceScoreRaw.overallStructure,
        ].filter(v => v != null && !isNaN(v));
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    })() : null;

    // Compute weak point from Big6 scores
    const weakPoint = useMemo(() => {
        const metrics = data.scoring?.advancedSkinMetrics;
        if (!metrics) return undefined;

        const regions = [metrics.forehead, metrics.leftCheek, metrics.rightCheek, metrics.chin];
        const avg = (fn: (r: typeof regions[0]) => number) =>
            regions.reduce((sum, r) => sum + fn(r), 0) / regions.length;

        const scores = [
            { name: localized('Skin Texture', 'Cilt Dokusu'), score: avg(r => (r.quality.smoothness.smoothnessScore + r.quality.poreVisibility.visibilityScore) / 2), desc: localized('Rough and matte signal', 'Pürüzlü ve mat görünüm') },
            { name: localized('Acne & Clarity', 'Akne & Temizlik'), score: avg(r => r.health.activeAcne.acneScore), desc: localized('Active formations detected', 'Aktif oluşumlar mevcut') },
            { name: localized('Barrier Health', 'Bariyer Sağlığı'), score: avg(r => r.health.barrier.barrierScore), desc: localized('Skin barrier is weakened', 'Cilt bariyeri zayıflamış') },
            { name: localized('Tone Uniformity', 'Ton Düzgünlüğü'), score: avg(r => r.quality.toneEvenness.evennessScore), desc: localized('Tone unevenness detected', 'Ton eşitsizliği mevcut') },
            { name: localized('Radiance', 'Parlaklık'), score: avg(r => r.quality.radiance.radianceScore), desc: localized('Dull and matte signal', 'Donuk ve mat görünüm') },
        ];

        const worst = scores.reduce((min, s) => s.score < min.score ? s : min, scores[0]);
        const impact = -((1 - worst.score) * 1.2);

        return {
            name: worst.name,
            impact: Math.round(impact * 10) / 10,
            description: worst.desc,
            goalText: localized(`Improve ${worst.name}`, `${worst.name} iyileştir`),
            goalTimeline: localized('Do not miss the 7-day task.', '7 günlük görevi kaçırma.'),
        };
    }, [data]);

    // Daily routine from recommendations
    const morningRoutine = data.recommendations?.dailyRoutine?.morning ?? ['Nazik temizleyici kullan', 'Nemlendirici uygula', 'SPF kullanmayı unutma'];
    const eveningRoutine = data.recommendations?.dailyRoutine?.evening ?? ['Cildini arındır', 'Nemlendirici uygula', 'Göz çevresi bakımını yap'];

    return (
        <div className="flex flex-col w-full pt-14 px-4 pb-10">

            {/* 1. DASHBOARD HEADER */}
            <DashboardHeader
                scanDate={data.date}
                onShare={handleShare}
                isSharing={isSharing}
                onNewScan={onNewScan}
            />

            {/* 2. HERO SCORE CARD */}
            <HeroScoreCard
                score={score}
                potential={potential}
                animatedScore={animatedScore}
                imageUrl={data.imageUrl}
                onShowPaywall={onShowPaywall}
            />

            {/* 3. SECONDARY SCORES (Skin + Face) */}
            <SecondaryScores
                skinScore={skinScore}
                faceScore={faceScore}
                potentialScore={potential}
                skinAge={skinAge}
                realAge={realAge}
                previousSkinScore={prevSkinScore}
                previousFaceScore={prevFaceScore}
                onShowPaywall={onShowPaywall}
            />

            {/* 4. UPSELL BANNER */}
            {onShowPaywall && (
                <UpsellBanner
                    score={score ?? 7}
                    potential={potential ?? 9}
                    onShowPaywall={onShowPaywall}
                />
            )}

            {/* 5. ACTIONABLE INSIGHTS (Daily Plan + Weak Point) */}
            <ActionableInsights
                routines={{
                    morning: morningRoutine.map((r, i) => ({ id: `m-${i}`, label: r, completed: i === 0 })),
                    evening: eveningRoutine.map((r, i) => ({ id: `e-${i}`, label: r, completed: false }))
                }}
                weakPoint={weakPoint ? {
                    category: weakPoint.name,
                    description: weakPoint.description,
                    impact: weakPoint.impact,
                    goalTitle: weakPoint.goalText,
                    goalDescription: weakPoint.goalTimeline
                } : {
                    category: localized('Skin Texture', 'Cilt Dokusu'),
                    description: localized('Rough and matte signal.', 'Pürüzlü ve mat görünüm.'),
                    impact: -0.6,
                    goalTitle: localized('Repair skin texture', 'Cilt dokusunu toparla'),
                    goalDescription: localized('Do not miss the 7-day task.', '7 günlük görevi kaçırma.')
                }}
            />

            {/* 6. BIG 6 AI SYNTHESIS */}
            {data.recommendations?.big6Insights && (
                <div className="w-full mt-1">
                    <Big6InsightsResult
                        insights={data.recommendations.big6Insights}
                        metrics={data.scoring?.advancedSkinMetrics}
                    />
                </div>
            )}

            {/* 7. Divider */}
            <div className="h-px bg-black/5 w-full my-2"></div>

            {/* 8. Referral Card */}
            {user?.id && (
                <ReferralCard userId={user.id} />
            )}

            {/* 9. Share Button */}
            <div className="w-full flex justify-center pb-4">
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 rounded-full border border-black/[0.06] shadow-sm transition-colors text-sm font-bold text-[#1D1D1F] disabled:opacity-50"
                    disabled={isSharing}
                >
                    {isSharing ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-[#1D1D1F] rounded-full animate-spin" />
                    ) : (
                        <ShareIcon className="w-4 h-4" />
                    )}
                    {isSharing ? 'Generating...' : 'Share Results'}
                </button>
            </div>
        </div>
    );
};

export default Results;
