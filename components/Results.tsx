import React, { useState, useEffect, useMemo } from 'react';
import { DailyReport } from '../types';
import { localized } from '../localization';
import { getScanThumbnail } from '../utils/pendingScan';
import { ShareIcon } from './icons/ShareIcon';
import { generateShareCard } from '../utils/shareCard';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Dashboard Components
import ResultsTopBar from './dashboard/ResultsTopBar';
import HeroScanSection from './dashboard/HeroScanSection';
import SecondaryScores from './dashboard/SecondaryScores';
import SkinOverview, { buildSkinOverviewMetrics } from './dashboard/SkinOverview';
import FocusAreas, { type FocusAreaItem } from './dashboard/FocusAreas';
import SkinDetailsScreen from './dashboard/SkinDetailsScreen';
import FocusDetailsScreen from './dashboard/FocusDetailsScreen';
import KeyRecommendations from './dashboard/KeyRecommendations';

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
    onShowNotificationSettings?: () => void;
    onNavigateToRecommendations?: () => void;
}

const Results: React.FC<ResultsProps> = ({
    data,
    dayNumber,
    onShowPaywall,
    isFreeUser = true,
    user,
    history = [],
    onNavigateToProgress,
    onLogout,
    onNewScan,
    onShowNotificationSettings,
    onNavigateToRecommendations,
}) => {
    const [isSharing, setIsSharing] = useState(false);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [showSkinDetails, setShowSkinDetails] = useState(false);
    const [showFocusDetails, setShowFocusDetails] = useState(false);

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
                data.imageUrl || getScanThumbnail(data.id),
                data.scoring.globalScore,
                data.scoring.potentialScore,
                dayNumber
            );

            await new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64data = reader.result as string;
                    try {
                        const base64Raw = base64data.split(',')[1];
                        const fileName = `skinface-results-${Date.now()}.png`;

                        const savedFile = await Filesystem.writeFile({
                            path: fileName,
                            data: base64Raw,
                            directory: Directory.Cache,
                        });

                        await Share.share({
                            title: 'My SkinFace AI Results',
                            text: `My SkinFace AI score card: ${data.scoring.globalScore.toFixed(1)}/10`,
                            files: [savedFile.uri],
                        });
                        resolve();
                    } catch (shareErr) {
                        console.error('Native share error, falling back to download:', shareErr);
                        try {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'skinface-results.png';
                            a.click();
                            URL.revokeObjectURL(url);
                            resolve();
                        } catch (fallbackErr) {
                            reject(fallbackErr);
                        }
                    }
                };
                reader.onerror = () => reject(new Error('FileReader error'));
            });
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
                    {localized('Your First Score', 'İlk Skorun')}
                    <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {localized('Is Locked', 'Kilitli')}
                    </span>
                </h2>
                <p className="text-[15px] text-[#86868B] leading-relaxed max-w-[280px] mb-10">
                    {localized(
                        'Complete your first scan. We will extract skin and face signals, then your streak, trends, and daily plan unlock.',
                        'İlk taramayı yap. Cilt ve yüz sinyalini çıkaralım; sonra seri, trend ve görev planı çalışmaya başlar.'
                    )}
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
                    <span>{localized('Tap the camera button below to scan', 'Taramak için alttaki kamera düğmesine dokun')}</span>
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
    const skinScore = data.scoring?.skin?.overallScore ?? null;

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

    const skinStatus = data.scoring?.skin?.statusScores as Record<string, number> | undefined;
    const prevSkinStatus = previousReport?.scoring?.skin?.statusScores as Record<string, number> | undefined;
    const skinOverviewMetrics = useMemo(
        () => buildSkinOverviewMetrics(skinStatus, data.scoring?.advancedSkinMetrics, prevSkinStatus),
        [skinStatus, data.scoring?.advancedSkinMetrics, prevSkinStatus]
    );

    const allFocusAreasList = useMemo((): FocusAreaItem[] => {
        const fromRec = data.recommendations?.focusAreas;
        if (fromRec?.length) {
            const areaToId = (area: string) => {
                const a = area.toLowerCase();
                if (a.includes('texture') || a.includes('doku')) return 'texture';
                if (a.includes('circle') || a.includes('fatigue') || a.includes('göz')) return 'fatigue';
                if (a.includes('pore') || a.includes('gözenek')) return 'pores';
                if (a.includes('barrier') || a.includes('bariyer')) return 'barrier';
                if (a.includes('tone') || a.includes('ton')) return 'tone';
                if (a.includes('acne') || a.includes('akne') || a.includes('sivilce')) return 'acne';
                return 'texture';
            };
            const areaToTitle = (area: string) => {
                const a = area.toLowerCase();
                if (a.includes('texture') || a.includes('doku')) return localized('Uneven Texture', 'Düzensiz Doku');
                if (a.includes('circle') || a.includes('fatigue') || a.includes('göz')) return localized('Dark Circles', 'Göz Altı');
                if (a.includes('pore') || a.includes('gözenek')) return localized('Enlarged Pores', 'Geniş Gözenek');
                if (a.includes('barrier') || a.includes('bariyer')) return localized('Dehydration Lines', 'Dehidrasyon Çizgileri');
                if (a.includes('tone') || a.includes('ton')) return localized('Dull Skin Tone', 'Mat Cilt Tonu');
                if (a.includes('acne') || a.includes('akne') || a.includes('sivilce')) return localized('Active Acne', 'Aktif Sivilce');
                return area;
            };
            return fromRec.map((f, i) => ({
                id: areaToId(f.area),
                title: areaToTitle(f.area),
                impact: -0.4 - i * 0.1,
                description: f.why,
            }));
        }

        const metrics = data.scoring?.advancedSkinMetrics;
        if (!metrics) {
            return [
                {
                    id: 'texture',
                    title: localized('Uneven Texture', 'Düzensiz Doku'),
                    impact: -0.6,
                    description: localized('Makes skin look rough and dull, lowering texture smoothness rating.', 'Cildin pürüzlü görünmesine neden olarak doku pürüzsüzlüğü derecesini düşürür.'),
                },
                {
                    id: 'fatigue',
                    title: localized('Dark Circles', 'Göz Altı'),
                    impact: -0.4,
                    description: localized('Under-eye darkness affects brightness and elevates fatigue signals.', 'Göz altındaki koyuluk parlaklığı etkiler ve yorgunluk sinyalini yükseltir.'),
                },
                {
                    id: 'pores',
                    title: localized('Enlarged Pores', 'Geniş Gözenek'),
                    impact: -0.3,
                    description: localized('Pores are more visible in T-zone, reducing skin quality clarity.', 'Gözenekler T bölgesinde belirgindir ve cilt kalitesi berraklığını azaltır.'),
                },
                {
                    id: 'barrier',
                    title: localized('Dehydration Lines', 'Dehidrasyon Çizgileri'),
                    impact: -0.2,
                    description: localized('Fine lines appear when skin lacks moisture, impacting barrier defense.', 'Cilt nemsiz kaldığında ince çizgiler belirerek bariyer korumasını etkiler.'),
                },
                {
                    id: 'tone',
                    title: localized('Dull Skin Tone', 'Mat Cilt Tonu'),
                    impact: -0.2,
                    description: localized('Uneven tone reduces natural glow, lowering radiance and uniformity.', 'Eşit olmayan cilt tonu doğal ışıltıyı azaltır, parlaklık ve ton eşitliğini düşürür.'),
                },
                {
                    id: 'acne',
                    title: localized('Active Acne', 'Aktif Sivilce'),
                    impact: -0.1,
                    description: localized('Occasional breakouts and blemishes, reducing overall skin clarity.', 'Ara sıra oluşan sivilceler genel cilt berraklığı puanını düşürür.'),
                },
            ];
        }

        const regions = [metrics.forehead, metrics.leftCheek, metrics.rightCheek, metrics.chin];
        const avg = (fn: (r: typeof regions[0]) => number | undefined) => {
            const values: number[] = [];
            for (const r of regions) {
                if (!r) continue;
                const v = fn(r);
                if (typeof v === 'number' && Number.isFinite(v)) {
                    values.push(v);
                }
            }
            if (values.length === 0) return 0.8;
            return values.reduce((sum, v) => sum + v, 0) / values.length;
        };

        const scores = [
            {
                id: 'acne',
                name: localized('Active Acne', 'Aktif Sivilce'),
                score: avg(r => r.health?.activeAcne?.acneScore),
                desc: localized('Occasional breakouts and blemishes, reducing overall skin clarity.', 'Ara sıra oluşan sivilceler genel cilt berraklığı puanını düşürür.'),
            },
            {
                id: 'texture',
                name: localized('Uneven Texture', 'Düzensiz Doku'),
                score: avg(r => {
                    const smooth = r.quality?.smoothness?.smoothnessScore;
                    const pore = r.quality?.poreVisibility?.visibilityScore;
                    if (typeof smooth === 'number' && typeof pore === 'number') {
                        return (smooth + pore) / 2;
                    }
                    return smooth ?? pore ?? undefined;
                }),
                desc: localized('Makes skin look rough and dull, lowering texture smoothness rating.', 'Cildin pürüzlü görünmesine neden olarak doku pürüzsüzlüğü derecesini düşürür.'),
            },
            {
                id: 'fatigue',
                name: localized('Dark Circles', 'Göz Altı'),
                score: avg(r => r.quality?.radiance?.radianceScore),
                desc: localized('Under-eye darkness affects brightness and elevates fatigue signals.', 'Göz altındaki koyuluk parlaklığı etkiler ve yorgunluk sinyalini yükseltir.'),
            },
            {
                id: 'pores',
                name: localized('Enlarged Pores', 'Geniş Gözenek'),
                score: avg(r => r.quality?.poreVisibility?.visibilityScore),
                desc: localized('Pores are more visible in T-zone, reducing skin quality clarity.', 'Gözenekler T bölgesinde belirgindir ve cilt kalitesi berraklığını azaltır.'),
            },
            {
                id: 'barrier',
                name: localized('Dehydration Lines', 'Dehidrasyon Çizgileri'),
                score: avg(r => r.health?.barrier?.barrierScore),
                desc: localized('Fine lines appear when skin lacks moisture, impacting barrier defense.', 'Cilt nemsiz kaldığında ince çizgiler belirerek bariyer korumasını etkiler.'),
            },
            {
                id: 'tone',
                name: localized('Dull Skin Tone', 'Mat Cilt Tonu'),
                score: avg(r => r.quality?.toneEvenness?.evennessScore),
                desc: localized('Uneven tone reduces natural glow, lowering radiance and uniformity.', 'Eşit olmayan cilt tonu doğal ışıltıyı azaltır, parlaklık ve ton eşitliğini düşürür.'),
            },
        ];

        return [...scores]
            .sort((a, b) => a.score - b.score)
            .map((s) => ({
                id: s.id,
                title: s.name,
                impact: Math.round(-((1 - s.score) * 1.2) * 10) / 10,
                description: s.desc,
            }));
    }, [data]);

    const focusAreasList = useMemo(() => {
        return allFocusAreasList.slice(0, 3);
    }, [allFocusAreasList]);

    const userName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0];

    const hasDevMockData = data.id?.toString().startsWith('mock-report');

    return (
        <div className="flex flex-col w-full min-h-full bg-[#fbf9f9] pb-10">
            <ResultsTopBar
                userName={userName}
                user={user}
                onShowNotificationSettings={onShowNotificationSettings}
                onLogout={onLogout}
                onShare={handleShare}
                isSharing={isSharing}
            />

            <div className="w-full max-w-lg mx-auto px-4">
            <HeroScanSection
                imageUrl={data.imageUrl}
                score={score}
                animatedScore={animatedScore}
                topPercentile={hasDevMockData ? 28 : null}
            />

            <SecondaryScores
                skinScore={skinScore}
                skinAge={skinAge}
                realAge={realAge}
                previousSkinScore={prevSkinScore}
                useDevDefaults={hasDevMockData}
            />

            <SkinOverview
                metrics={skinOverviewMetrics}
                showSeeDetails={!!data.recommendations?.big6Insights}
                onSeeDetails={() => setShowSkinDetails(true)}
            />

            <FocusAreas
                areas={focusAreasList}
                scanImageUrl={data.imageUrl}
                onShowPlan={onShowPaywall}
                onSeeAll={() => setShowFocusDetails(true)}
            />

            <KeyRecommendations
                data={data}
                isFreeUser={isFreeUser}
                onShowPaywall={onShowPaywall}
                onNavigateToRecommendations={onNavigateToRecommendations}
            />

            {showSkinDetails && data.recommendations?.big6Insights && (
                <SkinDetailsScreen
                    insights={data.recommendations.big6Insights}
                    advancedMetrics={data.scoring?.advancedSkinMetrics}
                    onClose={() => setShowSkinDetails(false)}
                />
            )}

            {showFocusDetails && (
                <FocusDetailsScreen
                    areas={allFocusAreasList}
                    isFreeUser={isFreeUser}
                    onClose={() => setShowFocusDetails(false)}
                    onShowPaywall={onShowPaywall}
                    onNavigateToRecommendations={onNavigateToRecommendations}
                />
            )}

            <div className="w-full flex justify-center pb-4 pt-2">
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#f5f4f4] rounded-full border border-black/[0.06] shadow-sm transition-colors text-sm font-bold text-[#1b1c1c] disabled:opacity-50"
                    disabled={isSharing}
                >
                    {isSharing ? (
                        <div className="w-4 h-4 border-2 border-[#777681] border-t-[#2e2f72] rounded-full animate-spin" />
                    ) : (
                        <ShareIcon className="w-4 h-4" />
                    )}
                    {isSharing ? localized('Generating...', 'Oluşturuluyor...') : localized('Share my score', 'Skorumu paylaş')}
                </button>
            </div>
            </div>
        </div>
    );
};

export default Results;
