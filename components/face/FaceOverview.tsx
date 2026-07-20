import React from 'react';
import { DailyReport } from '../../types';
import { localized } from '../../localization';
import { resolveScanImageUrl } from '../dashboard/constants';
import {
  FACE_FEATURE_IDS,
  FACE_FEATURE_META,
  FaceFeatureId,
  computeOpportunities,
  getFeatureMetric,
  resolveFaceBig6,
  scoreColor,
  scoreLabel,
  scoreToTopPercent,
} from './faceFeatureMeta';
import { getArchetypeMeta } from './archetypeMeta';

interface FaceOverviewProps {
  data: DailyReport;
  history: DailyReport[];
  onSeeAll: () => void;
  onSelectFeature: (id: FaceFeatureId) => void;
  onArchetypeClick?: () => void;
}

function journeyScoreOf(report: DailyReport): number | null {
  const big6 = resolveFaceBig6(report);
  if (typeof big6?.overallFaceBig6 === 'number') return big6.overallFaceBig6;
  if (typeof report.scoring?.globalScore === 'number') return report.scoring.globalScore;
  if (typeof report.global_score === 'number') return report.global_score;
  return null;
}

const FaceOverview: React.FC<FaceOverviewProps> = ({
  data,
  history,
  onSeeAll,
  onSelectFeature,
  onArchetypeClick,
}) => {
  const big6 = resolveFaceBig6(data);
  const overall = typeof big6?.overallFaceBig6 === 'number' ? big6.overallFaceBig6 : null;
  const potential = typeof data.scoring?.potentialScore === 'number' ? data.scoring.potentialScore : null;
  const archetype = data.scoring?.face?.archetype;
  const archetypeMeta = getArchetypeMeta(archetype);
  const topPercent = overall != null ? scoreToTopPercent(overall) : null;

  const isMock = !data.imageUrl || data.imageUrl.includes('hero-scan-default.png');
  const heroSrc = isMock ? '/images/sofia_portrait.png' : resolveScanImageUrl(data.imageUrl);

  const featureRows = FACE_FEATURE_IDS.map((id) => {
    const metric = getFeatureMetric(big6, id);
    const score = typeof metric?.score === 'number' ? metric.score : null;
    return { id, meta: FACE_FEATURE_META[id], score, statusLabel: metric?.statusLabel };
  });

  // Trait chips: top 3 strongest features
  const traitChips = featureRows
    .filter((r) => r.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .map((r) => r.meta.traitChip());

  const opportunities = computeOpportunities(big6, 3);

  const insightText =
    data.recommendations?.eliteReport?.structuralVerdict ||
    data.recommendations?.motivationalNote ||
    null;

  // Face Journey: last 7 scored reports, oldest → newest
  const journeyPoints = [...history]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(journeyScoreOf)
    .filter((s): s is number => s != null)
    .slice(-7);
  const showJourney = journeyPoints.length >= 2;

  const progressPercent =
    overall != null ? Math.min(100, Math.max(0, (overall / 10) * 100)) : 0;
  const potentialPercent =
    potential != null ? Math.min(100, Math.max(0, (potential / 10) * 100)) : null;

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-6 space-y-4">
      {/* Page Title */}
      <div className="pt-4 pb-1 px-1">
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#1b1c1c]">
          {localized('Face Analysis', 'Yüz Analizi')}
        </h1>
        <p className="text-[13px] text-[#777681] mt-0.5">
          {localized('Your facial structure, decoded', 'Yüz yapın, çözümlendi')}
        </p>
      </div>

      {/* HERO — score + scan portrait */}
      <section className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02] relative overflow-hidden flex justify-between items-center">
        <div className="z-10 flex flex-col justify-center min-w-0">
          <span className="text-[15px] font-semibold text-[#1b1c1c] mb-2">
            {localized('Your Face Score', 'Yüz Skorun')}
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className="text-[52px] font-extrabold tracking-[-0.04em] leading-none"
              style={{ color: overall != null ? scoreColor(overall) : '#1b1c1c' }}
            >
              {overall != null ? overall.toFixed(1) : '—'}
            </span>
            <span className="text-[20px] font-semibold text-[#c7c5d2]">/10</span>
          </div>
          <p
            className="font-semibold mt-1 text-[14px]"
            style={{ color: overall != null ? scoreColor(overall) : '#777681' }}
          >
            {overall != null ? scoreLabel(overall) : '—'}
          </p>

          {potential != null && (
            <div className="mt-4 w-[150px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777681]">
                  {localized('Potential', 'Potansiyel')}
                </span>
                <span className="text-[13px] font-extrabold text-[#7E4CA8]">
                  {potential.toFixed(1)}
                </span>
              </div>
              <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                {potentialPercent != null && (
                  <div
                    className="absolute h-full bg-[#7E4CA8]/20 rounded-full"
                    style={{ width: `${potentialPercent}%` }}
                  />
                )}
                <div
                  className="absolute h-full bg-gradient-to-r from-[#7E4CA8] to-[#a855f7] rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Portrait on the right */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 flex justify-end items-end pointer-events-none select-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#c0c1ff]/20 to-[#f86dfd]/10 rounded-l-full blur-xl transform translate-x-8 scale-150" />
          <img
            alt={localized('Your scan', 'Taraman')}
            className="h-[120%] object-cover object-center relative z-10 translate-y-4 right-[-10%]"
            src={heroSrc}
            draggable={false}
          />
        </div>
      </section>

      {/* FACE IDENTITY — archetype card */}
      {archetype && (
        <section
          onClick={onArchetypeClick}
          className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02] cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7E4CA8]">
              {localized('Face Identity', 'Yüz Kimliği')}
            </span>
            {topPercent != null && (
              <div className="inline-flex items-center gap-1 bg-black/[0.04] px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[14px] text-[#a311ae]" data-icon="trending_up">
                  trending_up
                </span>
                <span className="text-[10px] font-bold tracking-[0.05em] uppercase text-[#1b1c1c]">
                  {localized('Top', 'İlk')} {topPercent}% {localized('of users', 'kullanıcı')}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-4 items-center">
            <img
              src={archetypeMeta.wireframeSrc}
              alt=""
              className="w-20 h-20 rounded-2xl object-cover bg-[#f5f5f7] border border-black/[0.04]"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-[#1b1c1c] tracking-wide mb-1">
                {archetypeMeta.label}
              </h2>
              <p className="text-xs text-[#777681] leading-relaxed">{archetypeMeta.subtitle}</p>
            </div>
          </div>
          {traitChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {traitChips.map((chip) => (
                <span
                  key={chip}
                  className="px-3 py-1 bg-[#7E4CA8]/[0.07] text-[#7E4CA8] rounded-full text-[11px] font-bold"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* WHAT SHAPES YOUR FACE */}
      <section className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-[#1b1c1c]">
            {localized('What shapes your face', 'Yüzünü şekillendirenler')}
          </h3>
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-0.5 text-[13px] font-bold text-[#7E4CA8] active:opacity-70 transition-opacity"
          >
            {localized('See All', 'Tümü')}
            <span className="material-symbols-outlined text-[16px]" data-icon="chevron_right">
              chevron_right
            </span>
          </button>
        </div>
        <div className="space-y-1">
          {featureRows.map(({ id, meta, score, statusLabel }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelectFeature(id)}
              className="w-full flex items-center gap-3 py-2.5 px-1 rounded-2xl hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] flex items-center justify-center flex-shrink-0 text-[#7E4CA8]">
                <span className="material-symbols-outlined text-[20px]" data-icon={meta.icon}>
                  {meta.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] font-semibold text-[#1b1c1c]">{meta.title()}</span>
                  <span className="flex items-baseline gap-1.5">
                    <span
                      className="text-[14px] font-extrabold"
                      style={{ color: score != null ? scoreColor(score) : '#777681' }}
                    >
                      {score != null ? score.toFixed(1) : '—'}
                    </span>
                    <span className="text-[10px] font-bold text-[#777681] uppercase tracking-wide">
                      {score != null ? (statusLabel || scoreLabel(score)) : ''}
                    </span>
                  </span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${score != null ? Math.min(100, (score / 10) * 100) : 0}%`,
                      backgroundColor: score != null ? scoreColor(score) : '#e5e7eb',
                    }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* BIGGEST OPPORTUNITIES */}
      {opportunities.length > 0 && (
        <section className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
          <h3 className="text-[16px] font-bold text-[#1b1c1c] mb-4">
            {localized('Biggest Opportunities', 'En Büyük Fırsatlar')}
          </h3>
          <div className="space-y-3">
            {opportunities.map((opp) => {
              const meta = FACE_FEATURE_META[opp.id];
              return (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => onSelectFeature(opp.id)}
                  className="w-full flex items-center gap-3 bg-[#F5F5F7] rounded-2xl p-3.5 text-left active:scale-[0.99] transition-transform"
                >
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 text-[#7E4CA8] shadow-sm">
                    <span className="material-symbols-outlined text-[20px]" data-icon={meta.icon}>
                      {meta.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1b1c1c]">{meta.title()}</p>
                    <p className="text-[11px] text-[#777681] truncate">{meta.opportunityHint()}</p>
                  </div>
                  <span className="text-[13px] font-extrabold text-[#16a34a] flex-shrink-0">
                    +{opp.impact.toFixed(1)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* AI FACE INSIGHT */}
      {insightText && (
        <section className="rounded-3xl p-5 shadow-[0_4px_20px_rgba(126,76,168,0.25)] bg-gradient-to-br from-[#7E4CA8] to-[#a855f7] text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <span className="material-symbols-outlined text-[18px]" data-icon="auto_awesome">
              auto_awesome
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
              {localized('AI Face Insight', 'AI Yüz Analizi')}
            </span>
          </div>
          <p className="text-[14px] leading-relaxed font-medium relative z-10">
            {insightText}
          </p>
        </section>
      )}

      {/* FACE JOURNEY */}
      {showJourney && (
        <section className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
          <h3 className="text-[16px] font-bold text-[#1b1c1c] mb-1">
            {localized('Face Journey', 'Yüz Yolculuğun')}
          </h3>
          <p className="text-[11px] text-[#777681] mb-4">
            {localized('Your score across recent scans', 'Son taramalardaki skorun')}
          </p>
          <FaceJourneyChart points={journeyPoints} />
        </section>
      )}
    </div>
  );
};

const FaceJourneyChart: React.FC<{ points: number[] }> = ({ points }) => {
  const W = 320;
  const H = 96;
  const PAD = 12;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(0.5, max - min);
  const stepX = (W - PAD * 2) / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: PAD + i * stepX,
    y: PAD + (1 - (p - min) / range) * (H - PAD * 2),
  }));
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPath = `M ${coords[0].x},${H} L ${polyline.split(' ').join(' L ')} L ${coords[coords.length - 1].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
      <path d={areaPath} fill="url(#faceJourneyGradient)" opacity="0.25" />
      <defs>
        <linearGradient id="faceJourneyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7E4CA8" />
          <stop offset="100%" stopColor="#7E4CA8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={polyline}
        fill="none"
        stroke="#7E4CA8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={i === coords.length - 1 ? 4 : 2.5}
          fill={i === coords.length - 1 ? '#7E4CA8' : '#fff'}
          stroke="#7E4CA8"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
};

export default FaceOverview;
