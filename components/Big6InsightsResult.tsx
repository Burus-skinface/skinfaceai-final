import React from 'react';
import type { Big6Insights } from '../services/recommendations/recommendsEngine';
import type { AdvancedSkinMetrics } from '../services/scoring/types';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { FaceIcon } from './icons/FaceIcon';
import { DropIcon } from './icons/DropIcon';
import { EyeIcon } from './icons/EyeIcon';
import { SpectrumIcon } from './icons/SpectrumIcon';
import { Sparkles } from './icons/SparklesIcon';

interface Big6InsightsResultProps {
  insights?: Big6Insights;
  metrics?: AdvancedSkinMetrics;
}

// Compute Big 6 scores from averaged region data (0-1 scale → display as /10)
function computeBig6Scores(m: AdvancedSkinMetrics) {
  const regions = [m.forehead, m.leftCheek, m.rightCheek, m.chin];
  const avg = (fn: (r: typeof regions[0]) => number) =>
    regions.reduce((sum, r) => sum + fn(r), 0) / regions.length;

  return {
    acneClarity: avg(r => (r.health.activeAcne.acneScore + ((r.health.marks.pieScore + r.health.marks.pihScore) / 2)) / 2),
    texturePores: avg(r => (r.quality.smoothness.smoothnessScore + r.quality.poreVisibility.visibilityScore) / 2),
    barrierDefense: avg(r => (r.health.barrier.barrierScore + (1 - r.health.inflammation.loadScore)) / 2),
    sebumDynamics: avg(r => (r.health.sebum.sebumScore + r.quality.oilHydration.balanceScore) / 2),
    toneUniformity: avg(r => (r.quality.toneEvenness.evennessScore + r.quality.rednessUniformity.uniformityScore) / 2),
    visualFatigue: avg(r => r.quality.radiance.radianceScore),
  };
}

// Color for score pill (0-1 scale)
const pillColor = (s: number) => {
  if (s >= 0.85) return { bg: 'bg-emerald-500/15', text: 'text-emerald-600', ring: 'ring-emerald-500/20' };
  if (s >= 0.70) return { bg: 'bg-green-500/10', text: 'text-green-600', ring: 'ring-green-500/15' };
  if (s >= 0.50) return { bg: 'bg-amber-500/10', text: 'text-amber-600', ring: 'ring-amber-500/15' };
  return { bg: 'bg-red-500/10', text: 'text-red-600', ring: 'ring-red-500/15' };
};

const Big6Card: React.FC<{
  title: string;
  insight: string;
  icon: React.ReactNode;
  score?: number; // 0-1
}> = ({ title, insight, icon, score }) => {
  const displayScore = score !== undefined ? (score * 10).toFixed(1) : null;
  const colors = score !== undefined ? pillColor(score) : null;

  return (
    <div className="w-full bg-white rounded-2xl p-4 border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-colors">
      {/* Top row: icon + title + score pill */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
            {icon}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
            {title}
          </span>
        </div>

        {displayScore && colors && (
          <div className={`px-2.5 py-1 rounded-lg ${colors.bg} ring-1 ${colors.ring}`}>
            <span className={`text-sm font-bold tabular-nums ${colors.text}`}>
              {displayScore}
            </span>
          </div>
        )}
      </div>

      {/* AI Insight text */}
      <p className="text-[13px] text-[#48484A] leading-relaxed">
        {insight}
      </p>
    </div>
  );
};

const Big6InsightsResult: React.FC<Big6InsightsResultProps> = ({ insights, metrics }) => {
  if (!insights) return null;

  const scores = metrics ? computeBig6Scores(metrics) : undefined;

  const cards = [
    {
      title: 'Acne & Clarity',
      insight: insights.acneClarity,
      icon: <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />,
      score: scores?.acneClarity,
    },
    {
      title: 'Texture & Pores',
      insight: insights.texturePores,
      icon: <FaceIcon className="w-3.5 h-3.5 text-purple-400" />,
      score: scores?.texturePores,
    },
    {
      title: 'Barrier Defense',
      insight: insights.barrierDefense,
      icon: <ShieldCheckIcon className="w-3.5 h-3.5 text-blue-400" />,
      score: scores?.barrierDefense,
    },
    {
      title: 'Sebum Dynamics',
      insight: insights.sebumDynamics,
      icon: <DropIcon className="w-3.5 h-3.5 text-cyan-400" />,
      score: scores?.sebumDynamics,
    },
    {
      title: 'Tone Uniformity',
      insight: insights.toneUniformity,
      icon: <SpectrumIcon className="w-3.5 h-3.5 text-pink-400" />,
      score: scores?.toneUniformity,
    },
    {
      title: 'Visual Fatigue',
      insight: insights.visualFatigue,
      icon: <EyeIcon className="w-3.5 h-3.5 text-amber-400" />,
      score: scores?.visualFatigue,
    },
  ];

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">
          AI Synthesis · The Big 6
        </span>
      </div>

      {/* Cards stacked vertically */}
      <div className="flex flex-col gap-2">
        {cards.map((card) => (
          <Big6Card
            key={card.title}
            title={card.title}
            insight={card.insight}
            icon={card.icon}
            score={card.score}
          />
        ))}
      </div>
    </div>
  );
};

export default Big6InsightsResult;
