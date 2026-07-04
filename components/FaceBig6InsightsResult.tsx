import React from 'react';
import type { FaceBig6Insights } from '../services/recommendations/recommendsEngine';
import type { FaceBig6Scores } from '../services/scoring/faceBig6Scoring';
import { EyeIcon } from './icons/EyeIcon';
import { NoseIcon } from './icons/NoseIcon';
import { JawIcon } from './icons/JawIcon';
import { FaceIcon } from './icons/FaceIcon';
import { SpectrumIcon } from './icons/SpectrumIcon';
import { Sparkles } from './icons/SparklesIcon';

interface FaceBig6InsightsResultProps {
  insights?: FaceBig6Insights;
  scores?: FaceBig6Scores;
}

// Score pill color (0-10 scale)
const pillColor = (s: number) => {
  if (s >= 9.0) return { bg: 'bg-[#FBF1D3]', text: 'text-[#B8860B]', ring: 'ring-[#D4AF37]/25' }; // Gold
  if (s >= 7.0) return { bg: 'bg-green-500/10', text: 'text-green-600', ring: 'ring-green-500/15' }; // Green
  if (s >= 5.0) return { bg: 'bg-[#009EE0]/10', text: 'text-[#009EE0]', ring: 'ring-[#009EE0]/15' }; // La Roche Blue
  return { bg: 'bg-red-500/10', text: 'text-red-600', ring: 'ring-red-500/15' }; // Red
};

// Tag badge color
const tagColor = (tag: string) => {
  switch (tag) {
    case 'angle':      return 'text-purple-400/70 bg-purple-500/10';
    case 'ratio':      return 'text-blue-400/70 bg-blue-500/10';
    case 'projection': return 'text-cyan-400/70 bg-cyan-500/10';
    case 'symmetry':   return 'text-pink-400/70 bg-pink-500/10';
    case 'morphology': return 'text-amber-400/70 bg-amber-500/10';
    default:           return 'text-gray-400/70 bg-white/5';
  }
};

// Individual card
const FaceBig6Card: React.FC<{
  title: string;
  insight: string;
  icon: React.ReactNode;
  metric?: FaceBig6Scores['eyes'];
}> = ({ title, insight, icon, metric }) => {
  const score = metric?.score;
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

        {score !== undefined && colors && (
          <div className={`px-2.5 py-1 rounded-lg ${colors.bg} ring-1 ${colors.ring}`}>
            <span className={`text-sm font-bold tabular-nums ${colors.text}`}>
              {score.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* AI Insight text */}
      <p className="text-[13px] text-[#48484A] leading-relaxed mb-3">
        {insight}
      </p>

      {/* Breakdown sub-metrics */}
      {metric?.breakdown && metric.breakdown.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-black/5">
          {metric.breakdown.map((b) => {
            const tc = tagColor(b.tag);
            const bc = pillColor(b.score);
            return (
              <div
                key={b.label}
                className="flex items-center gap-1.5 px-2 py-1 bg-[#F5F5F7] rounded-lg border border-black/5"
              >
                <span className="text-[9px] font-semibold text-[#86868B] uppercase tracking-wide">{b.label}</span>
                <span className={`text-[9px] font-mono px-1 rounded ${tc}`}>{b.tag}</span>
                <span className={`text-[10px] font-bold tabular-nums ${bc.text}`}>{b.score.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FaceBig6InsightsResult: React.FC<FaceBig6InsightsResultProps> = ({ insights, scores }) => {
  if (!insights) return null;

  const cards: {
    title: string;
    insight: string;
    icon: React.ReactNode;
    metric?: FaceBig6Scores[keyof Omit<FaceBig6Scores, 'overallFaceBig6'>];
  }[] = [
    {
      title: 'Eyes',
      insight: insights.eyes,
      icon: <EyeIcon className="w-3.5 h-3.5 text-amber-400" />,
      metric: scores?.eyes,
    },
    {
      title: 'Nose',
      insight: insights.nose,
      icon: <NoseIcon className="w-3.5 h-3.5 text-blue-400" />,
      metric: scores?.nose,
    },
    {
      title: 'Jawline',
      insight: insights.jawline,
      icon: <JawIcon className="w-3.5 h-3.5 text-teal-400" />,
      metric: scores?.jawline,
    },
    {
      title: 'Chin',
      insight: insights.chin,
      icon: <FaceIcon className="w-3.5 h-3.5 text-cyan-400" />,
      metric: scores?.chin,
    },
    {
      title: 'Midface',
      insight: insights.midface,
      icon: <SpectrumIcon className="w-3.5 h-3.5 text-purple-400" />,
      metric: scores?.midface,
    },
    {
      title: 'Harmony',
      insight: insights.harmony,
      icon: <Sparkles className="w-3.5 h-3.5 text-rose-400" />,
      metric: scores?.harmony,
    },
  ];

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">
            AI Synthesis · Face Big 6
          </span>
        </div>
        {scores?.overallFaceBig6 !== undefined && (
          <div className={`px-2.5 py-1 rounded-lg ring-1 ${pillColor(scores.overallFaceBig6).bg} ${pillColor(scores.overallFaceBig6).ring}`}>
            <span className={`text-[11px] font-black tabular-nums ${pillColor(scores.overallFaceBig6).text}`}>
              {scores.overallFaceBig6.toFixed(1)} / 10
            </span>
          </div>
        )}
      </div>

      {/* Cards stacked vertically */}
      <div className="flex flex-col gap-2">
        {cards.map((card) => (
          <FaceBig6Card
            key={card.title}
            title={card.title}
            insight={card.insight}
            icon={card.icon}
            metric={card.metric as any}
          />
        ))}
      </div>
    </div>
  );
};

export default FaceBig6InsightsResult;
