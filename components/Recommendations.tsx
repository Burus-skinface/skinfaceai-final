
import React, { useMemo, useState } from 'react';
import { DailyReport } from '../types';
import { Sparkles } from './icons/SparklesIcon';
import { t } from '../localization';
import GlowUpOverview, { RoutineVariant } from './glowup/GlowUpOverview';
import RoutineDetail from './glowup/RoutineDetail';
import { completedCount, getDayProgress, saveDayProgress, GlowUpDayProgress } from './glowup/glowUpProgress';

interface RecommendationsProps {
    data: DailyReport | null;
    gender?: string;
    user?: { user_metadata?: { full_name?: string; name?: string } } | null;
    isFreeUser?: boolean;
    onShowPaywall?: () => void;
}

/** DEV-only sample report so the Glow Up tab renders without a real scan. */
function buildDevMockReport(data: DailyReport | null): DailyReport {
    return {
        ...data,
        id: data?.id || 'mock-glowup-dev',
        date: data?.date || new Date().toISOString(),
        imageUrl: data?.imageUrl || '/images/hero-scan-default.png',
        global_score: data?.global_score ?? 7.8,
        scoring: {
            ...data?.scoring,
            scanId: data?.scoring?.scanId || 'mock-glowup-scan',
            globalScore: data?.scoring?.globalScore ?? 7.8,
            potentialScore: data?.scoring?.potentialScore ?? 8.9,
            skin: data?.scoring?.skin ?? {
                statusScores: { overallSkin: 7.8, hydration: 7.2, redness: 8.5, pores: 7.0, spots: 8.0 },
                overallScore: 7.8,
                ageEstimate: 26,
            },
        },
        recommendations: {
            ...data?.recommendations,
            motivationalNote:
                data?.recommendations?.motivationalNote ||
                'Your structure is elite. Stay consistent with your routine to maximize your natural potential.',
            priorityOrder: data?.recommendations?.priorityOrder || [
                'Hydration & Skin Barrier',
                'Sun Protection',
                'Under-eye Care',
            ],
            focusAreas: data?.recommendations?.focusAreas || [
                {
                    area: 'Hydration & Skin Barrier',
                    why: 'Your barrier needs reinforcement to lock in moisture and reduce transepidermal water loss.',
                    actions: [
                        'Apply hyaluronic acid on damp skin',
                        'Use a ceramide-rich moisturizer',
                        'Drink 8 glasses of water daily',
                    ],
                    timeline: '3_months',
                },
                {
                    area: 'Reduce under-eye darkness',
                    why: 'Visual fatigue is your biggest score drag — consistent sleep and targeted care will lift radiance fast.',
                    actions: ['Get 7–8 hours of sleep', 'Use caffeine eye cream in the morning'],
                    timeline: '3_months',
                },
            ],
            dailyRoutine: {
                morning: data?.recommendations?.dailyRoutine?.morning || [
                    'Gentle Cleanser — remove overnight oil without stripping',
                    'Vitamin C Serum — brighten and protect against free radicals',
                    'Moisturizer — lock in hydration for the day',
                    'SPF 50 — shield from UV damage (reapply every 2–3 hrs)',
                    'Lip Hydration — keep lips soft and protected',
                ],
                evening: data?.recommendations?.dailyRoutine?.evening || [
                    'Double Cleanse — oil cleanser then gel to remove SPF & makeup',
                    'Retinoid — accelerate cell turnover (start 2×/week)',
                    'Moisturizer — repair barrier overnight',
                    'Eye Cream — target dark circles and puffiness',
                    'Sleep Goal — aim for 7–8 hours for skin recovery',
                ],
            },
            monthlyGoals: data?.recommendations?.monthlyGoals || {
                month1: 'Establish consistent AM/PM routine',
                month3: 'Improve under-eye elasticity',
                month6: 'Reach 8.5+ skin score',
                month12: 'Achieve maximal glow potential',
            },
            recommendedProducts: data?.recommendations?.recommendedProducts || [
                {
                    productId: 'LRP-MOISTURIZER-01',
                    confidenceScore: 95,
                    reason: 'Perfect for reinforcing your current barrier strength and locking in hydration.',
                },
                {
                    productId: 'PC-BHA-01',
                    confidenceScore: 88,
                    reason: 'Gently clears pores without disrupting your lipid barrier.',
                },
                {
                    productId: 'CRV-CLEANSER-01',
                    confidenceScore: 82,
                    reason: 'Ideal gentle cleanser for your morning double-cleanse routine.',
                },
            ],
            big6Insights: data?.recommendations?.big6Insights || {
                acneClarity: 'Minimal active breakouts. Focus on preventing congestion in the T-zone.',
                texturePores: 'Generally smooth, but visible pores around the cheeks and nose.',
                barrierDefense: 'Strong overall, but slight compromise detected on the chin area.',
                sebumDynamics: 'Slightly oily in the T-zone, well-balanced elsewhere.',
                toneUniformity: 'Even tone with minor post-inflammatory hyperpigmentation.',
                visualFatigue: 'Good radiance, but dark circles indicate slight visual fatigue.',
            },
        },
    } as DailyReport;
}

/** Seed partial completion in DEV so the dashboard ring shows ~67% like the mockup. */
function getInitialProgress(mLen: number, eLen: number): GlowUpDayProgress {
    const saved = getDayProgress(mLen, eLen);
    const alreadyStarted =
        completedCount(saved.morning) + completedCount(saved.evening) + saved.water > 0;
    if (!import.meta.env.DEV || alreadyStarted) return saved;

    const morning = Array.from({ length: mLen }, (_, i) => i < Math.min(4, mLen));
    const evening = Array.from({ length: eLen }, (_, i) => i < Math.min(2, eLen));
    const seeded: GlowUpDayProgress = { morning, evening, water: 6 };
    saveDayProgress(seeded);
    return seeded;
}

const Recommendations: React.FC<RecommendationsProps> = ({ data, user, isFreeUser = true, onShowPaywall }) => {
    const [openRoutine, setOpenRoutine] = useState<RoutineVariant | null>(null);

    // In dev mode, hydrate missing recommendations so the tab renders like a completed scan
    let reportData = data;
    if (
        import.meta.env.DEV &&
        (!data || !data.recommendations?.dailyRoutine?.morning?.length || !data.recommendations?.dailyRoutine?.evening?.length)
    ) {
        reportData = buildDevMockReport(data);
    }

    const recommendations = reportData?.recommendations;
    const dailyRoutine = recommendations?.dailyRoutine;
    const morning = Array.isArray(dailyRoutine?.morning) ? dailyRoutine.morning : null;
    const evening = Array.isArray(dailyRoutine?.evening) ? dailyRoutine.evening : null;

    const [progress, setProgress] = useState<GlowUpDayProgress>(() =>
        getInitialProgress(morning?.length ?? 0, evening?.length ?? 0)
    );

    // Re-sync step arrays if the routine lengths change (new report loaded)
    const syncedProgress = useMemo(() => {
        const mLen = morning?.length ?? 0;
        const eLen = evening?.length ?? 0;
        if (progress.morning.length === mLen && progress.evening.length === eLen) return progress;
        return getDayProgress(mLen, eLen);
    }, [progress, morning?.length, evening?.length]);

    const updateProgress = (next: GlowUpDayProgress) => {
        setProgress(next);
        saveDayProgress(next);
    };

    const toggleStep = (variant: RoutineVariant, index: number) => {
        const next: GlowUpDayProgress = {
            ...syncedProgress,
            [variant]: syncedProgress[variant].map((v, i) => (i === index ? !v : v)),
        };
        updateProgress(next);
    };

    const setWater = (value: number) => {
        updateProgress({ ...syncedProgress, water: Math.max(0, value) });
    };

    if (!recommendations || !reportData?.scoring || !morning || !evening) {
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

    const userName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        (import.meta.env.DEV ? 'Sofia' : null);

    return (
        <div className="w-full">
            {/* PAGE 1 — Glow Up Dashboard */}
            <GlowUpOverview
                data={reportData}
                userName={userName}
                progress={syncedProgress}
                isFreeUser={isFreeUser}
                onOpenRoutine={setOpenRoutine}
                onShowPaywall={onShowPaywall}
            />

            {/* PAGE 2 / 3 — Morning or Evening routine slide-up */}
            {openRoutine && (
                <RoutineDetail
                    variant={openRoutine}
                    steps={openRoutine === 'morning' ? morning : evening}
                    checked={syncedProgress[openRoutine]}
                    water={syncedProgress.water}
                    onToggleStep={(i) => toggleStep(openRoutine, i)}
                    onWaterChange={setWater}
                    onClose={() => setOpenRoutine(null)}
                />
            )}
        </div>
    );
};

export default Recommendations;
