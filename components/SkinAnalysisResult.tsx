import React from 'react';
import { DailyReport } from '../types';
import { Sparkles } from './icons/SparklesIcon';
import { StarIcon } from './icons/StarIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { t } from '../localization';

// Helper to get color based on score (0-1)
const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-purple-400';
    if (score >= 0.70) return 'text-green-400';
    if (score >= 0.50) return 'text-yellow-400';
    return 'text-red-400';
};

// Helper to get severity color
const getSeverityColor = (severity: string) => {
    if (severity === 'clear' || severity === 'glass' || severity === 'perfect' || severity === 'invisible' || severity === 'radiant' || severity === 'balanced' || severity === 'healthy' || severity === 'uniform') return 'text-emerald-400';
    if (severity === 'mild' || severity === 'smooth' || severity === 'even' || severity === 'minimal' || severity === 'scattered') return 'text-green-400';
    if (severity === 'moderate' || severity === 'normal' || severity === 'uneven' || severity === 'visible' || severity === 'clustered' || severity === 'dull' || severity === 'oily' || severity === 'dehydrated' || severity === 'compromised') return 'text-yellow-400';
    return 'text-red-400';
};

interface HealthMetricCardProps {
    label: string;
    score: number;
    status: string;
    details: string;
    icon?: React.ReactNode;
}

const HealthMetricCard: React.FC<HealthMetricCardProps> = ({ label, score, status, details, icon }) => {
    return (
        <div className="min-w-[280px] w-[280px] flex-shrink-0 bg-[#2C2C2E] rounded-3xl border border-white/10 p-5 flex flex-col gap-3 snap-start shadow-xl shadow-black/40 relative overflow-hidden group/card">
            {/* Active Indicator Strip */}
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 group-hover/card:bg-indigo-400 transition-colors"></div>

            <div className="flex justify-between items-start pl-2">
                <span className="text-[11px] font-black italic text-gray-400 uppercase tracking-widest group-hover/card:text-white transition-colors">
                    {label}
                </span>
                {icon || (
                    <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]"></div>
                    </div>
                )}
            </div>

            <div className="pl-2 space-y-2">
                <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black ${getScoreColor(score)}`}>
                        {(score * 10).toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-600 font-bold">/10</span>
                </div>
                <p className={`text-sm font-bold ${getSeverityColor(status)}`}>
                    {status.toUpperCase()}
                </p>
                <p className="text-xs font-medium text-gray-400 leading-relaxed">
                    {details}
                </p>
            </div>
        </div>
    );
};

interface QualityMetricCardProps {
    label: string;
    score: number;
    quality: string;
    details: string;
}

const QualityMetricCard: React.FC<QualityMetricCardProps> = ({ label, score, quality, details }) => {
    return (
        <div className="min-w-[280px] w-[280px] flex-shrink-0 bg-[#2C2C2E] rounded-3xl border border-purple-500/10 p-5 flex flex-col gap-3 snap-start shadow-xl shadow-black/40 relative overflow-hidden group/card">
            {/* Active Indicator Strip */}
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50 group-hover/card:bg-purple-400 transition-colors"></div>

            <div className="flex justify-between items-start pl-2">
                <span className="text-[11px] font-black italic text-gray-400 uppercase tracking-widest group-hover/card:text-white transition-colors">
                    {label}
                </span>
                <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]"></div>
                </div>
            </div>

            <div className="pl-2 space-y-2">
                <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black ${getScoreColor(score)}`}>
                        {(score * 10).toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-600 font-bold">/10</span>
                </div>
                <p className={`text-sm font-bold ${getSeverityColor(quality)}`}>
                    {quality.toUpperCase()}
                </p>
                <p className="text-xs font-medium text-gray-400 leading-relaxed">
                    {details}
                </p>
            </div>
        </div>
    );
};

const SkinAnalysisResult: React.FC<{ report: DailyReport }> = ({ report }) => {
    const metrics = report.faceState?.advancedSkinMetrics;

    if (!metrics) {
        // Fallback to old system if new metrics not available
        const s = report.scoring?.skin;
        if (!s) return null;

        const getScoreColor = (score: number) => {
            if (score >= 9) return 'text-purple-400';
            if (score >= 7.5) return 'text-green-400';
            if (score >= 6) return 'text-yellow-400';
            return 'text-red-400';
        };

        return (
            <div className="w-full space-y-5 mt-0">
                {/* Fallback to old UI */}
                <div className="relative p-6 rounded-[2rem] border border-indigo-500/10 bg-[#1C1C1E] overflow-hidden group shadow-2xl">
                    <div className="relative z-10 text-center space-y-2">
                        <p className="text-[10px] font-black italic text-indigo-400 tracking-[0.3em] uppercase">Daily Skin Score</p>
                        <div className="flex items-center justify-center gap-2">
                            <h2 className={`text-6xl font-black italic tracking-tighter ${getScoreColor(s.overallScore)}`}>
                                {s.overallScore.toFixed(1)}
                            </h2>
                            <span className="text-xl text-gray-600 font-bold italic self-end mb-2">/10</span>
                        </div>
                        <p className="text-xs font-bold text-gray-200 italic leading-relaxed max-w-xs mx-auto">
                            "{s.overallSentence}"
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate average metrics from all regions
    const allRegions = [metrics.forehead, metrics.leftCheek, metrics.rightCheek, metrics.chin];

    // Average health metrics (using forehead as template for string values)
    const avgHealth = {
        sebum: {
            sebumScore: allRegions.reduce((sum, r) => sum + r.health.sebum.sebumScore, 0) / 4,
            region: metrics.forehead.health.sebum.region,
            hotspotCount: Math.round(allRegions.reduce((sum, r) => sum + r.health.sebum.hotspotCount, 0) / 4),
            hotspotDensity: allRegions.reduce((sum, r) => sum + r.health.sebum.hotspotDensity, 0) / 4
        },
        poreCongestion: {
            congestionScore: allRegions.reduce((sum, r) => sum + r.health.poreCongestion.congestionScore, 0) / 4,
            severity: metrics.forehead.health.poreCongestion.severity,
            bumpCount: Math.round(allRegions.reduce((sum, r) => sum + r.health.poreCongestion.bumpCount, 0) / 4),
            bumpDensity: allRegions.reduce((sum, r) => sum + r.health.poreCongestion.bumpDensity, 0) / 4
        },
        inflammation: {
            loadScore: allRegions.reduce((sum, r) => sum + r.health.inflammation.loadScore, 0) / 4,
            distribution: metrics.forehead.health.inflammation.distribution,
            isLocalized: metrics.forehead.health.inflammation.isLocalized,
            stdDev: allRegions.reduce((sum, r) => sum + r.health.inflammation.stdDev, 0) / 4
        },
        activeAcne: {
            acneScore: allRegions.reduce((sum, r) => sum + r.health.activeAcne.acneScore, 0) / 4,
            severity: metrics.forehead.health.activeAcne.severity,
            papuleCount: Math.round(allRegions.reduce((sum, r) => sum + r.health.activeAcne.papuleCount, 0) / 4),
            pustuleCount: Math.round(allRegions.reduce((sum, r) => sum + r.health.activeAcne.pustuleCount, 0) / 4),
            totalLesions: Math.round(allRegions.reduce((sum, r) => sum + r.health.activeAcne.totalLesions, 0) / 4)
        },
        marks: {
            pieScore: allRegions.reduce((sum, r) => sum + r.health.marks.pieScore, 0) / 4,
            pihScore: allRegions.reduce((sum, r) => sum + r.health.marks.pihScore, 0) / 4,
            severity: metrics.forehead.health.marks.severity,
            pieCount: Math.round(allRegions.reduce((sum, r) => sum + r.health.marks.pieCount, 0) / 4),
            pihCount: Math.round(allRegions.reduce((sum, r) => sum + r.health.marks.pihCount, 0) / 4),
            totalMarks: Math.round(allRegions.reduce((sum, r) => sum + r.health.marks.totalMarks, 0) / 4)
        },
        barrier: {
            barrierScore: allRegions.reduce((sum, r) => sum + r.health.barrier.barrierScore, 0) / 4,
            status: metrics.forehead.health.barrier.status,
            isDamaged: metrics.forehead.health.barrier.isDamaged,
            diffuseRedness: metrics.forehead.health.barrier.diffuseRedness,
            textureNoise: metrics.forehead.health.barrier.textureNoise
        }
    };

    // Average quality metrics
    const avgQuality = {
        smoothness: {
            smoothnessScore: allRegions.reduce((sum, r) => sum + r.quality.smoothness.smoothnessScore, 0) / 4,
            quality: metrics.forehead.quality.smoothness.quality,
            highFreqRatio: allRegions.reduce((sum, r) => sum + r.quality.smoothness.highFreqRatio, 0) / 4,
            roughnessLevel: allRegions.reduce((sum, r) => sum + r.quality.smoothness.roughnessLevel, 0) / 4
        },
        poreVisibility: {
            visibilityScore: allRegions.reduce((sum, r) => sum + r.quality.poreVisibility.visibilityScore, 0) / 4,
            visibility: metrics.forehead.quality.poreVisibility.visibility,
            poreCount: Math.round(allRegions.reduce((sum, r) => sum + r.quality.poreVisibility.poreCount, 0) / 4),
            poreDensity: allRegions.reduce((sum, r) => sum + r.quality.poreVisibility.poreDensity, 0) / 4
        },
        toneEvenness: {
            evennessScore: allRegions.reduce((sum, r) => sum + r.quality.toneEvenness.evennessScore, 0) / 4,
            evenness: metrics.forehead.quality.toneEvenness.evenness,
            aVariance: allRegions.reduce((sum, r) => sum + r.quality.toneEvenness.aVariance, 0) / 4,
            bVariance: allRegions.reduce((sum, r) => sum + r.quality.toneEvenness.bVariance, 0) / 4,
            combinedVariance: allRegions.reduce((sum, r) => sum + r.quality.toneEvenness.combinedVariance, 0) / 4
        },
        radiance: {
            radianceScore: allRegions.reduce((sum, r) => sum + r.quality.radiance.radianceScore, 0) / 4,
            glow: metrics.forehead.quality.radiance.glow,
            isHomogeneous: metrics.forehead.quality.radiance.isHomogeneous,
            avgLuminance: allRegions.reduce((sum, r) => sum + r.quality.radiance.avgLuminance, 0) / 4,
            luminanceVariance: allRegions.reduce((sum, r) => sum + r.quality.radiance.luminanceVariance, 0) / 4
        },
        rednessUniformity: {
            uniformityScore: allRegions.reduce((sum, r) => sum + r.quality.rednessUniformity.uniformityScore, 0) / 4,
            distribution: metrics.forehead.quality.rednessUniformity.distribution,
            isLocalized: metrics.forehead.quality.rednessUniformity.isLocalized,
            clusteringScore: allRegions.reduce((sum, r) => sum + r.quality.rednessUniformity.clusteringScore, 0) / 4,
            redPixelCount: Math.round(allRegions.reduce((sum, r) => sum + r.quality.rednessUniformity.redPixelCount, 0) / 4)
        },
        oilHydration: {
            balanceScore: allRegions.reduce((sum, r) => sum + r.quality.oilHydration.balanceScore, 0) / 4,
            status: metrics.forehead.quality.oilHydration.status,
            isOilyDehydrated: metrics.forehead.quality.oilHydration.isOilyDehydrated,
            oilLevel: allRegions.reduce((sum, r) => sum + r.quality.oilHydration.oilLevel, 0) / 4,
            hydrationLevel: allRegions.reduce((sum, r) => sum + r.quality.oilHydration.hydrationLevel, 0) / 4,
            warning: metrics.forehead.quality.oilHydration.warning
        }
    };

    return (
        <div className="w-full space-y-5 mt-0">
            {/* 1. OVERALL SCORES CARD */}
            <div className="relative p-6 rounded-[2rem] border border-indigo-500/10 bg-[#1C1C1E] overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <StarIcon className="w-16 h-16 text-indigo-400" />
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black italic text-indigo-400 tracking-[0.3em] uppercase text-center flex-1">
                            Advanced Skin Analysis
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    // Show raw calculation data
                                    const msg = `
🔬 RAW CALCULATION DATA

📊 FOREHEAD REGION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEBUM (L channel):
  Hotspot Count: ${metrics.forehead.health.sebum.hotspotCount}
  Hotspot Density: ${(metrics.forehead.health.sebum.hotspotDensity * 100).toFixed(3)}%
  Raw Score: ${metrics.forehead.health.sebum.sebumScore.toFixed(3)}
  Threshold: Adaptive (Mean + 1.5*StdDev)
  ⚠️ If score 0: Low variance (matte skin) or dark image

INFLAMMATORY LOAD (A channel):
  Load Score: ${metrics.forehead.health.inflammation.loadScore.toFixed(3)}
  StdDev: ${metrics.forehead.health.inflammation.stdDev.toFixed(2)}
  Distribution: ${metrics.forehead.health.inflammation.distribution}
  
ACTIVE ACNE (A channel blobs):
  Total Lesions: ${metrics.forehead.health.activeAcne.totalLesions}
  Papules: ${metrics.forehead.health.activeAcne.papuleCount}
  Pustules: ${metrics.forehead.health.activeAcne.pustuleCount}
  Severity: ${metrics.forehead.health.activeAcne.severity}
  ⚠️ Threshold: Adaptive (Mean + 1.5*StdDev)

MARKS (A/B channels):
  PIE Count: ${metrics.forehead.health.marks.pieCount}
  PIH Count: ${metrics.forehead.health.marks.pihCount}
  Total Marks: ${metrics.forehead.health.marks.totalMarks}

RADIANCE (L channel):
  Radiance Score: ${metrics.forehead.quality.radiance.radianceScore.toFixed(3)}
  Avg Luminance: ${metrics.forehead.quality.radiance.avgLuminance.toFixed(1)}
  Variance: ${metrics.forehead.quality.radiance.luminanceVariance.toFixed(2)}
  Is Homogeneous: ${metrics.forehead.quality.radiance.isHomogeneous}
  Glow: ${metrics.forehead.quality.radiance.glow}
  ⚠️ Relative Logic: Check CV & BrightnessRatio

REDNESS UNIFORMITY (A channel):
  Red Pixel Count: ${metrics.forehead.quality.rednessUniformity.redPixelCount}
  Clustering Score: ${metrics.forehead.quality.rednessUniformity.clusteringScore.toFixed(3)}
  Is Localized: ${metrics.forehead.quality.rednessUniformity.isLocalized}
  Uniformity Score: ${metrics.forehead.quality.rednessUniformity.uniformityScore.toFixed(3)}
  ⚠️ Threshold: Adaptive (Mean + 1.2*StdDev)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 TROUBLESHOOTING:
- Sebum 0: L values too low (dark image)
- Acne 0: No A > 15 blobs detected
- Radiance flat: Low luminance or high variance
- Redness 0: Too many red pixels (formula issue)

Check browser console for detailed [SEBUM] logs!
                                    `.trim();
                                    alert(msg);
                                }}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-[9px] font-bold text-red-400 transition-colors"
                            >
                                📊 RAW DATA
                            </button>
                            <button
                                onClick={() => {
                                    const msg = `
🔬 12 ADVANCED SKIN METRICS DEBUG

📊 OVERALL SCORES:
Health: ${(metrics.avgHealthScore * 10).toFixed(1)}/10 (${(metrics.avgHealthScore * 100).toFixed(1)}%)
Quality: ${(metrics.avgQualityScore * 10).toFixed(1)}/10 (${(metrics.avgQualityScore * 100).toFixed(1)}%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 HEALTH METRICS (6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ SEBUM ACTIVITY
Forehead: ${(metrics.forehead.health.sebum.sebumScore * 10).toFixed(1)}/10 | ${metrics.forehead.health.sebum.region} | ${metrics.forehead.health.sebum.hotspotCount} hotspots
L.Cheek: ${(metrics.leftCheek.health.sebum.sebumScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.health.sebum.region} | ${metrics.leftCheek.health.sebum.hotspotCount} hotspots
R.Cheek: ${(metrics.rightCheek.health.sebum.sebumScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.health.sebum.region} | ${metrics.rightCheek.health.sebum.hotspotCount} hotspots
Chin: ${(metrics.chin.health.sebum.sebumScore * 10).toFixed(1)}/10 | ${metrics.chin.health.sebum.region} | ${metrics.chin.health.sebum.hotspotCount} hotspots

2️⃣ PORE CONGESTION
Forehead: ${(metrics.forehead.health.poreCongestion.congestionScore * 10).toFixed(1)}/10 | ${metrics.forehead.health.poreCongestion.severity} | ${metrics.forehead.health.poreCongestion.bumpCount} bumps
L.Cheek: ${(metrics.leftCheek.health.poreCongestion.congestionScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.health.poreCongestion.severity} | ${metrics.leftCheek.health.poreCongestion.bumpCount} bumps
R.Cheek: ${(metrics.rightCheek.health.poreCongestion.congestionScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.health.poreCongestion.severity} | ${metrics.rightCheek.health.poreCongestion.bumpCount} bumps
Chin: ${(metrics.chin.health.poreCongestion.congestionScore * 10).toFixed(1)}/10 | ${metrics.chin.health.poreCongestion.severity} | ${metrics.chin.health.poreCongestion.bumpCount} bumps

3️⃣ INFLAMMATORY LOAD
Forehead: ${(metrics.forehead.health.inflammation.loadScore * 10).toFixed(1)}/10 | ${metrics.forehead.health.inflammation.distribution}
L.Cheek: ${(metrics.leftCheek.health.inflammation.loadScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.health.inflammation.distribution}
R.Cheek: ${(metrics.rightCheek.health.inflammation.loadScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.health.inflammation.distribution}
Chin: ${(metrics.chin.health.inflammation.loadScore * 10).toFixed(1)}/10 | ${metrics.chin.health.inflammation.distribution}

4️⃣ ACTIVE ACNE
Forehead: ${(metrics.forehead.health.activeAcne.acneScore * 10).toFixed(1)}/10 | ${metrics.forehead.health.activeAcne.severity} | ${metrics.forehead.health.activeAcne.totalLesions} lesions
L.Cheek: ${(metrics.leftCheek.health.activeAcne.acneScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.health.activeAcne.severity} | ${metrics.leftCheek.health.activeAcne.totalLesions} lesions
R.Cheek: ${(metrics.rightCheek.health.activeAcne.acneScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.health.activeAcne.severity} | ${metrics.rightCheek.health.activeAcne.totalLesions} lesions
Chin: ${(metrics.chin.health.activeAcne.acneScore * 10).toFixed(1)}/10 | ${metrics.chin.health.activeAcne.severity} | ${metrics.chin.health.activeAcne.totalLesions} lesions

5️⃣ MARKS (PIE/PIH)
Forehead: PIE=${(metrics.forehead.health.marks.pieScore * 10).toFixed(1)} PIH=${(metrics.forehead.health.marks.pihScore * 10).toFixed(1)} | ${metrics.forehead.health.marks.totalMarks} marks
L.Cheek: PIE=${(metrics.leftCheek.health.marks.pieScore * 10).toFixed(1)} PIH=${(metrics.leftCheek.health.marks.pihScore * 10).toFixed(1)} | ${metrics.leftCheek.health.marks.totalMarks} marks
R.Cheek: PIE=${(metrics.rightCheek.health.marks.pieScore * 10).toFixed(1)} PIH=${(metrics.rightCheek.health.marks.pihScore * 10).toFixed(1)} | ${metrics.rightCheek.health.marks.totalMarks} marks
Chin: PIE=${(metrics.chin.health.marks.pieScore * 10).toFixed(1)} PIH=${(metrics.chin.health.marks.pihScore * 10).toFixed(1)} | ${metrics.chin.health.marks.totalMarks} marks

6️⃣ BARRIER INTEGRITY
Forehead: ${(metrics.forehead.health.barrier.barrierScore * 10).toFixed(1)}/10 | ${metrics.forehead.health.barrier.status}
L.Cheek: ${(metrics.leftCheek.health.barrier.barrierScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.health.barrier.status}
R.Cheek: ${(metrics.rightCheek.health.barrier.barrierScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.health.barrier.status}
Chin: ${(metrics.chin.health.barrier.barrierScore * 10).toFixed(1)}/10 | ${metrics.chin.health.barrier.status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ QUALITY METRICS (6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ TEXTURE SMOOTHNESS
Forehead: ${(metrics.forehead.quality.smoothness.smoothnessScore * 10).toFixed(1)}/10 | ${metrics.forehead.quality.smoothness.quality}
L.Cheek: ${(metrics.leftCheek.quality.smoothness.smoothnessScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.quality.smoothness.quality}
R.Cheek: ${(metrics.rightCheek.quality.smoothness.smoothnessScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.quality.smoothness.quality}
Chin: ${(metrics.chin.quality.smoothness.smoothnessScore * 10).toFixed(1)}/10 | ${metrics.chin.quality.smoothness.quality}

2️⃣ PORE VISIBILITY
Forehead: ${(metrics.forehead.quality.poreVisibility.visibilityScore * 10).toFixed(1)}/10 | ${metrics.forehead.quality.poreVisibility.poreCount} pores
L.Cheek: ${(metrics.leftCheek.quality.poreVisibility.visibilityScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.quality.poreVisibility.poreCount} pores
R.Cheek: ${(metrics.rightCheek.quality.poreVisibility.visibilityScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.quality.poreVisibility.poreCount} pores
Chin: ${(metrics.chin.quality.poreVisibility.visibilityScore * 10).toFixed(1)}/10 | ${metrics.chin.quality.poreVisibility.poreCount} pores

3️⃣ TONE EVENNESS
Forehead: ${(metrics.forehead.quality.toneEvenness.evennessScore * 10).toFixed(1)}/10 | ${metrics.forehead.quality.toneEvenness.evenness}
L.Cheek: ${(metrics.leftCheek.quality.toneEvenness.evennessScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.quality.toneEvenness.evenness}
R.Cheek: ${(metrics.rightCheek.quality.toneEvenness.evennessScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.quality.toneEvenness.evenness}
Chin: ${(metrics.chin.quality.toneEvenness.evennessScore * 10).toFixed(1)}/10 | ${metrics.chin.quality.toneEvenness.evenness}

4️⃣ RADIANCE
Forehead: ${(metrics.forehead.quality.radiance.radianceScore * 10).toFixed(1)}/10 | ${metrics.forehead.quality.radiance.glow}
L.Cheek: ${(metrics.leftCheek.quality.radiance.radianceScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.quality.radiance.glow}
R.Cheek: ${(metrics.rightCheek.quality.radiance.radianceScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.quality.radiance.glow}
Chin: ${(metrics.chin.quality.radiance.radianceScore * 10).toFixed(1)}/10 | ${metrics.chin.quality.radiance.glow}

5️⃣ REDNESS UNIFORMITY
Forehead: ${(metrics.forehead.quality.rednessUniformity.uniformityScore * 10).toFixed(1)}/10 | ${metrics.forehead.quality.rednessUniformity.redPixelCount} red px
L.Cheek: ${(metrics.leftCheek.quality.rednessUniformity.uniformityScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.quality.rednessUniformity.redPixelCount} red px
R.Cheek: ${(metrics.rightCheek.quality.rednessUniformity.uniformityScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.quality.rednessUniformity.redPixelCount} red px
Chin: ${(metrics.chin.quality.rednessUniformity.uniformityScore * 10).toFixed(1)}/10 | ${metrics.chin.quality.rednessUniformity.redPixelCount} red px

6️⃣ OIL-HYDRATION BALANCE
Forehead: ${(metrics.forehead.quality.oilHydration.balanceScore * 10).toFixed(1)}/10 | ${metrics.forehead.quality.oilHydration.status}
L.Cheek: ${(metrics.leftCheek.quality.oilHydration.balanceScore * 10).toFixed(1)}/10 | ${metrics.leftCheek.quality.oilHydration.status}
R.Cheek: ${(metrics.rightCheek.quality.oilHydration.balanceScore * 10).toFixed(1)}/10 | ${metrics.rightCheek.quality.oilHydration.status}
Chin: ${(metrics.chin.quality.oilHydration.balanceScore * 10).toFixed(1)}/10 | ${metrics.chin.quality.oilHydration.status}

Check console for detailed calculation logs!
                                `.trim();
                                    alert(msg);
                                }}
                                className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-[9px] font-bold text-indigo-400 transition-colors"
                            >
                                🔬 DEBUG
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center space-y-1">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Health Score</p>
                            <div className="flex items-center justify-center gap-1">
                                <h2 className={`text-4xl font-black italic tracking-tighter ${getScoreColor(metrics.avgHealthScore)}`}>
                                    {(metrics.avgHealthScore * 10).toFixed(1)}
                                </h2>
                                <span className="text-sm text-gray-600 font-bold italic self-end mb-1">/10</span>
                            </div>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Quality Score</p>
                            <div className="flex items-center justify-center gap-1">
                                <h2 className={`text-4xl font-black italic tracking-tighter ${getScoreColor(metrics.avgQualityScore)}`}>
                                    {(metrics.avgQualityScore * 10).toFixed(1)}
                                </h2>
                                <span className="text-sm text-gray-600 font-bold italic self-end mb-1">/10</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. HEALTH METRICS (6 metrics) */}
            <div className="bg-[#1C1C1E] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-lg relative">
                <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-[#1C1C1E] to-transparent z-10 pointer-events-none"></div>

                <div className="p-6 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center">
                            <ShieldCheckIcon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black italic text-white tracking-tight uppercase">
                                Skin Health
                            </h4>
                            <p className="text-[10px] font-black italic text-indigo-400/60 uppercase tracking-widest">
                                6 Medical Metrics
                            </p>
                        </div>
                    </div>
                    <span className={`text-2xl font-black italic ${getScoreColor(metrics.avgHealthScore)}`}>
                        {(metrics.avgHealthScore * 10).toFixed(1)}
                    </span>
                </div>

                <div className="w-full overflow-x-auto pb-8 pt-4 px-6 scrollbar-hide flex gap-4 snap-x">
                    <HealthMetricCard
                        label="Sebum Activity"
                        score={avgHealth.sebum.sebumScore}
                        status={avgHealth.sebum.region}
                        details={`${avgHealth.sebum.hotspotCount} oil hotspots detected`}
                    />
                    <HealthMetricCard
                        label="Pore Congestion"
                        score={1 - avgHealth.poreCongestion.congestionScore}
                        status={avgHealth.poreCongestion.severity}
                        details={`${avgHealth.poreCongestion.bumpCount} clogged pores found`}
                    />
                    <HealthMetricCard
                        label="Inflammatory Load"
                        score={1 - avgHealth.inflammation.loadScore}
                        status={avgHealth.inflammation.distribution}
                        details={avgHealth.inflammation.isLocalized ? 'Localized inflammation' : 'Diffuse redness'}
                    />
                    <HealthMetricCard
                        label="Active Acne"
                        score={1 - avgHealth.activeAcne.acneScore}
                        status={avgHealth.activeAcne.severity}
                        details={`${avgHealth.activeAcne.totalLesions} active lesions (${avgHealth.activeAcne.papuleCount} papules, ${avgHealth.activeAcne.pustuleCount} pustules)`}
                    />
                    <HealthMetricCard
                        label="Marks (PIE/PIH)"
                        score={1 - (avgHealth.marks.pieScore + avgHealth.marks.pihScore) / 2}
                        status={avgHealth.marks.severity}
                        details={`${avgHealth.marks.totalMarks} marks (${avgHealth.marks.pieCount} red, ${avgHealth.marks.pihCount} brown)`}
                    />
                    <HealthMetricCard
                        label="Barrier Integrity"
                        score={avgHealth.barrier.barrierScore}
                        status={avgHealth.barrier.status}
                        details={avgHealth.barrier.isDamaged ? 'Barrier compromised' : 'Barrier healthy'}
                    />
                    <div className="min-w-[20px]"></div>
                </div>
            </div>

            {/* 3. QUALITY METRICS (6 metrics) */}
            <div className="bg-[#1C1C1E] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-lg relative">
                <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-[#1C1C1E] to-transparent z-10 pointer-events-none"></div>

                <div className="p-6 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl border border-purple-500/20 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full border-2 border-purple-400/50 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-black italic text-white tracking-tight uppercase">
                                Skin Quality
                            </h4>
                            <p className="text-[10px] font-black italic text-purple-400/60 uppercase tracking-widest">
                                6 Aesthetic Metrics
                            </p>
                        </div>
                    </div>
                    <span className={`text-2xl font-black italic ${getScoreColor(metrics.avgQualityScore)}`}>
                        {(metrics.avgQualityScore * 10).toFixed(1)}
                    </span>
                </div>

                <div className="w-full overflow-x-auto pb-8 pt-4 px-6 scrollbar-hide flex gap-4 snap-x">
                    <QualityMetricCard
                        label="Texture Smoothness"
                        score={avgQuality.smoothness.smoothnessScore}
                        quality={avgQuality.smoothness.quality}
                        details={`${(avgQuality.smoothness.highFreqRatio * 100).toFixed(1)}% rough texture detected`}
                    />
                    <QualityMetricCard
                        label="Pore Visibility"
                        score={avgQuality.poreVisibility.visibilityScore}
                        quality={avgQuality.poreVisibility.visibility}
                        details={`${avgQuality.poreVisibility.poreCount} visible pores`}
                    />
                    <QualityMetricCard
                        label="Tone Evenness"
                        score={avgQuality.toneEvenness.evennessScore}
                        quality={avgQuality.toneEvenness.evenness}
                        details={`Color variance: ${avgQuality.toneEvenness.combinedVariance.toFixed(1)}`}
                    />
                    <QualityMetricCard
                        label="Radiance"
                        score={avgQuality.radiance.radianceScore}
                        quality={avgQuality.radiance.glow}
                        details={avgQuality.radiance.isHomogeneous ? 'Homogeneous glow' : 'Uneven luminance'}
                    />
                    <QualityMetricCard
                        label="Redness Uniformity"
                        score={avgQuality.rednessUniformity.uniformityScore}
                        quality={avgQuality.rednessUniformity.distribution}
                        details={`${avgQuality.rednessUniformity.redPixelCount} red pixels detected`}
                    />
                    <QualityMetricCard
                        label="Oil-Hydration Balance"
                        score={avgQuality.oilHydration.balanceScore}
                        quality={avgQuality.oilHydration.status}
                        details={avgQuality.oilHydration.warning || 'Balanced skin'}
                    />
                    <div className="min-w-[20px]"></div>
                </div>
            </div>

            {/* 4. WARNINGS (if any) */}
            {avgQuality.oilHydration.warning && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-yellow-400 text-lg">⚠️</span>
                        </div>
                        <div>
                            <h5 className="text-sm font-black text-yellow-400 uppercase tracking-wide">Skin Alert</h5>
                            <p className="text-xs font-medium text-gray-300 mt-1">{avgQuality.oilHydration.warning}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkinAnalysisResult;
