import React from 'react';
import { DailyReport } from '../types';
import { StarIcon } from './icons/StarIcon';

// Helper to get color based on score (0-1)
const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-purple-400';
    if (score >= 0.70) return 'text-green-400';
    if (score >= 0.50) return 'text-yellow-400';
    return 'text-red-400';
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

    return (
        <div className="w-full space-y-5 mt-0">
            {/* OVERALL SCORES CARD */}
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
                                    const msg = `
🔬 RAW CALCULATION DATA

📊 FOREHEAD REGION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEBUM (L channel):
  Hotspot Count: ${metrics.forehead.health.sebum.hotspotCount}
  Hotspot Density: ${(metrics.forehead.health.sebum.hotspotDensity * 100).toFixed(3)}%
  Raw Score: ${metrics.forehead.health.sebum.sebumScore.toFixed(3)}

INFLAMMATORY LOAD (A channel):
  Load Score: ${metrics.forehead.health.inflammation.loadScore.toFixed(3)}
  StdDev: ${metrics.forehead.health.inflammation.stdDev.toFixed(2)}
  Distribution: ${metrics.forehead.health.inflammation.distribution}
  
ACTIVE ACNE (A channel blobs):
  Total Lesions: ${metrics.forehead.health.activeAcne.totalLesions}
  Papules: ${metrics.forehead.health.activeAcne.papuleCount}
  Pustules: ${metrics.forehead.health.activeAcne.pustuleCount}
  Severity: ${metrics.forehead.health.activeAcne.severity}

MARKS (A/B channels):
  PIE Count: ${metrics.forehead.health.marks.pieCount}
  PIH Count: ${metrics.forehead.health.marks.pihCount}
  Total Marks: ${metrics.forehead.health.marks.totalMarks}

RADIANCE (L channel):
  Radiance Score: ${metrics.forehead.quality.radiance.radianceScore.toFixed(3)}
  Avg Luminance: ${metrics.forehead.quality.radiance.avgLuminance.toFixed(1)}
  Variance: ${metrics.forehead.quality.radiance.luminanceVariance.toFixed(2)}

Check browser console for detailed logs!
                                    `.trim();
                                    alert(msg);
                                }}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-[9px] font-bold text-red-400 transition-colors"
                            >
                                📊 RAW DATA
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

            {/* Big 6 replaces the old Skin Health & Skin Quality sections */}
        </div>
    );
};

export default SkinAnalysisResult;
