import React from 'react';
import { localized } from '../localization';
import type { Big6Insights } from '../services/recommendations/recommendsEngine';
import type { AdvancedSkinMetrics } from '../services/scoring/types';
import { Sparkles } from './icons/SparklesIcon';

interface Big6InsightsResultProps {
  insights?: Big6Insights;
  metrics?: AdvancedSkinMetrics;
  /** detail = full-screen Figma stack; masonry = legacy grid (unused on skin tab) */
  variant?: 'detail' | 'masonry';
}

// Compute Big 6 scores from averaged region data (0-1 scale → display as /10).
// Defensive: legacy/partial scans may be missing whole regions or sub-metrics; in that
// case the affected score returns `undefined` and the UI renders the card without a pill
// instead of crashing.
type RegionMetrics = AdvancedSkinMetrics['forehead'];

function safeAvg(regions: (RegionMetrics | undefined)[], fn: (r: RegionMetrics) => number | undefined): number | undefined {
  const values: number[] = [];
  for (const r of regions) {
    if (!r) continue;
    const v = fn(r);
    if (typeof v === 'number' && Number.isFinite(v)) {
      values.push(v);
    }
  }
  if (values.length === 0) return undefined;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function computeBig6Scores(m: AdvancedSkinMetrics) {
  const regions: (RegionMetrics | undefined)[] = [m?.forehead, m?.leftCheek, m?.rightCheek, m?.chin];

  return {
    acneClarity: safeAvg(regions, r => {
      const acne = r.health?.activeAcne?.acneScore;
      const pie = r.health?.marks?.pieScore;
      const pih = r.health?.marks?.pihScore;
      if (typeof acne !== 'number' || typeof pie !== 'number' || typeof pih !== 'number') return undefined;
      return (acne + ((pie + pih) / 2)) / 2;
    }),
    texturePores: safeAvg(regions, r => {
      const smooth = r.quality?.smoothness?.smoothnessScore;
      const pore = r.quality?.poreVisibility?.visibilityScore;
      if (typeof smooth !== 'number' || typeof pore !== 'number') return undefined;
      return (smooth + pore) / 2;
    }),
    barrierDefense: safeAvg(regions, r => {
      const barrier = r.health?.barrier?.barrierScore;
      const inflammation = r.health?.inflammation?.loadScore;
      if (typeof barrier !== 'number' || typeof inflammation !== 'number') return undefined;
      return (barrier + (1 - inflammation)) / 2;
    }),
    sebumDynamics: safeAvg(regions, r => {
      const sebum = r.health?.sebum?.sebumScore;
      const balance = r.quality?.oilHydration?.balanceScore;
      if (typeof sebum !== 'number' || typeof balance !== 'number') return undefined;
      return (sebum + balance) / 2;
    }),
    toneUniformity: safeAvg(regions, r => {
      const evenness = r.quality?.toneEvenness?.evennessScore;
      const uniformity = r.quality?.rednessUniformity?.uniformityScore;
      if (typeof evenness !== 'number' || typeof uniformity !== 'number') return undefined;
      return (evenness + uniformity) / 2;
    }),
    visualFatigue: safeAvg(regions, r => r.quality?.radiance?.radianceScore),
  };
}

// Color for score pill (0-1 scale)
const pillColor = (s: number) => {
  if (s >= 0.90) return { bg: 'bg-[#FBF1D3]', text: 'text-[#B8860B]', ring: 'ring-[#D4AF37]/25' }; // Gold
  if (s >= 0.70) return { bg: 'bg-green-500/10', text: 'text-green-600', ring: 'ring-green-500/15' }; // Green
  if (s >= 0.50) return { bg: 'bg-[#009EE0]/10', text: 'text-[#009EE0]', ring: 'ring-[#009EE0]/15' }; // La Roche Blue
  return { bg: 'bg-red-500/10', text: 'text-red-600', ring: 'ring-red-500/15' }; // Red
};

// ==========================================
// PREMIUM ICONS
// ==========================================
const PremiumAcneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="acne-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
      <filter id="acne-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path d="M12 22S4 16.5 4 9C4 5.5 8 3 12 3s8 2.5 8 6c0 7.5-8 13-8 13z" fill="url(#acne-grad)" fillOpacity="0.2" stroke="url(#acne-grad)" strokeWidth="2" />
    <path d="M9 12l2 2 4-4" stroke="url(#acne-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#acne-glow)" />
  </svg>
);

const PremiumTextureIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="texture-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" fill="url(#texture-grad)" fillOpacity="0.15" stroke="url(#texture-grad)" strokeWidth="2" strokeDasharray="4 4" />
    <circle cx="12" cy="12" r="4" fill="url(#texture-grad)" />
    <circle cx="8" cy="8" r="1.5" fill="url(#texture-grad)" fillOpacity="0.6" />
    <circle cx="16" cy="16" r="1.5" fill="url(#texture-grad)" fillOpacity="0.6" />
    <circle cx="16" cy="8" r="1.5" fill="url(#texture-grad)" fillOpacity="0.6" />
    <circle cx="8" cy="16" r="1.5" fill="url(#texture-grad)" fillOpacity="0.6" />
  </svg>
);

const PremiumBarrierIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="barrier-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" fill="url(#barrier-grad)" fillOpacity="0.15" stroke="url(#barrier-grad)" strokeWidth="2" />
    <path d="M12 6v14" stroke="url(#barrier-grad)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 4" />
    <path d="M8 12h8" stroke="url(#barrier-grad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PremiumSebumIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="sebum-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06B6D4" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" fill="url(#sebum-grad)" fillOpacity="0.2" stroke="url(#sebum-grad)" strokeWidth="2" />
    <path d="M12 11v4" stroke="url(#sebum-grad)" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 19h.01" stroke="url(#sebum-grad)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const PremiumToneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="tone-grad" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EC4899" />
        <stop offset="0.5" stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="url(#tone-grad)" strokeWidth="2" fill="none" />
    <path d="M2 12h20" stroke="url(#tone-grad)" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 2v20" stroke="url(#tone-grad)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="5" fill="url(#tone-grad)" fillOpacity="0.2" stroke="url(#tone-grad)" strokeWidth="1.5" />
  </svg>
);

const PremiumFatigueIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="fatigue-grad" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <path d="M2 12c0 0 4-7 10-7s10 7 10 7-4 7-10 7-10-7-10-7z" fill="url(#fatigue-grad)" fillOpacity="0.1" stroke="url(#fatigue-grad)" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="url(#fatigue-grad)" stroke="url(#fatigue-grad)" strokeWidth="2" />
    <path d="M14 10l2-2" stroke="url(#fatigue-grad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ==========================================

const Big6Card: React.FC<{
  title: string;
  insight: string;
  icon: React.ReactNode;
  score?: number;
  variant: 'detail' | 'masonry';
  gridStyle?: React.CSSProperties;
}> = ({ title, insight, icon, score, variant, gridStyle }) => {
  const displayScore = score !== undefined ? (score * 10).toFixed(1) : null;
  const colors = score !== undefined ? pillColor(score) : null;

  if (variant === 'detail') {
    return (
      <article className="w-full bg-white rounded-2xl p-4 border border-black/[0.04] shadow-[0_2px_12px_rgba(46,47,114,0.06)]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-[#fbf9f9] border border-[#e1e0ff] flex items-center justify-center shrink-0">
            {icon}
          </div>
          {displayScore && colors && (
            <div className={`px-2.5 py-1 rounded-lg ${colors.bg} ring-1 ${colors.ring}`}>
              <span className={`text-[14px] font-extrabold tabular-nums ${colors.text}`}>
                {displayScore}
                <span className="text-[11px] font-semibold opacity-70">/10</span>
              </span>
            </div>
          )}
        </div>
        <h3 className="text-[12px] font-bold text-[#2e2f72] uppercase tracking-wide mb-2">
          {title}
        </h3>
        <p className="text-[14px] text-[#464650] leading-relaxed font-medium m-0">
          {insight}
        </p>
      </article>
    );
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        ...gridStyle,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -20,
          left: -20,
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
          {displayScore && colors && (
            <div className={colors.bg} style={{ padding: '4px 8px', borderRadius: '8px' }}>
              <span className={colors.text} style={{ fontSize: '13px', fontWeight: 800 }}>
                {displayScore}
              </span>
            </div>
          )}
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#1D1D1F',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px',
          }}
        >
          {title}
        </span>
        <p style={{ fontSize: '13px', color: '#48484A', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
          {insight}
        </p>
      </div>
    </div>
  );
};

const Big6InsightsResult: React.FC<Big6InsightsResultProps> = ({
  insights,
  metrics,
  variant = 'masonry',
}) => {
  if (!insights) return null;

  const scores = metrics ? computeBig6Scores(metrics) : undefined;

  const cards = [
    {
      title: localized('Acne & Clarity', 'Akne & Berraklık'),
      insight: insights.acneClarity,
      icon: <PremiumAcneIcon />,
      score: scores?.acneClarity,
    },
    {
      title: localized('Texture & Pores', 'Doku & Gözenekler'),
      insight: insights.texturePores,
      icon: <PremiumTextureIcon />,
      score: scores?.texturePores,
    },
    {
      title: localized('Barrier Defense', 'Bariyer Savunması'),
      insight: insights.barrierDefense,
      icon: <PremiumBarrierIcon />,
      score: scores?.barrierDefense,
    },
    {
      title: localized('Sebum Dynamics', 'Sebum Dinamikleri'),
      insight: insights.sebumDynamics,
      icon: <PremiumSebumIcon />,
      score: scores?.sebumDynamics,
    },
    {
      title: localized('Tone Uniformity', 'Ton Eşitliği'),
      insight: insights.toneUniformity,
      icon: <PremiumToneIcon />,
      score: scores?.toneUniformity,
    },
    {
      title: localized('Visual Fatigue', 'Görsel Yorgunluk'),
      insight: insights.visualFatigue,
      icon: <PremiumFatigueIcon />,
      score: scores?.visualFatigue,
    },
  ];

  if (variant === 'detail') {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-4 px-0.5">
          <Sparkles className="w-4 h-4 text-[#2e2f72]" />
          <h2 className="text-[13px] font-bold text-[#464650] tracking-wide">
            {localized('AI · Big 6', 'AI · Big 6')}
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <Big6Card key={card.title} {...card} variant="detail" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          paddingLeft: '4px',
        }}
      >
        <Sparkles className="w-5 h-5 text-purple-600" />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#1D1D1F',
          }}
        >
          {localized('AI · Big 6', 'AI · Big 6')}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          gridAutoRows: 'min-content',
        }}
      >
        <Big6Card {...cards[0]} variant="masonry" gridStyle={{ gridColumn: '1 / -1' }} />
        <Big6Card {...cards[1]} variant="masonry" gridStyle={{ gridColumn: '1 / 2', gridRow: 'span 2' }} />
        <Big6Card {...cards[2]} variant="masonry" gridStyle={{ gridColumn: '2 / 3' }} />
        <Big6Card {...cards[3]} variant="masonry" gridStyle={{ gridColumn: '2 / 3' }} />
        <Big6Card {...cards[4]} variant="masonry" gridStyle={{ gridColumn: '1 / 2' }} />
        <Big6Card {...cards[5]} variant="masonry" gridStyle={{ gridColumn: '2 / 3' }} />
      </div>
    </div>
  );
};

export default Big6InsightsResult;

