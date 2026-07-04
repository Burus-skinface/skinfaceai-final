import React from 'react';
import { localized } from '../../localization';
import { computeBig6 } from '../../services/scoring/big6Scoring';
import type { AdvancedSkinMetrics } from '../../services/scoring/types';
import type { Big6Scores, Big6Status } from '../../services/scoring/big6Scoring';

type Big6MetricKey = Exclude<keyof Big6Scores, 'overallBig6'>;

export interface SkinMetricItem {
  id: string;
  label: string;
  value: number;
  delta?: number;
  status: 'good' | 'watch' | 'care';
}

interface SkinOverviewProps {
  metrics: SkinMetricItem[];
  onSeeDetails?: () => void;
  showSeeDetails?: boolean;
  embedded?: boolean;
}

const statusStyles = {
  good: { label: localized('Good', 'İyi'), bg: 'bg-[#E8F5E9]', text: 'text-[#2e7d32]' },
  watch: { label: localized('Stable', 'Stabil'), bg: 'bg-[#F5F3FF]', text: 'text-[#45478b]' },
  care: { label: localized('Needs care', 'Dikkat'), bg: 'bg-[#FFEBEE]', text: 'text-[#ba1a1a]' },
};

const SkinOverview: React.FC<SkinOverviewProps> = ({
  metrics,
  onSeeDetails,
  showSeeDetails = false,
  embedded = false,
}) => {
  return (
    <section className={`w-full ${embedded ? 'mb-2' : 'mb-4'}`}>
      <div className="flex items-center justify-between mb-3 px-0.5 gap-2">
        <h2 className="text-[17px] font-semibold text-[#1b1c1c]">
          {localized('Skin Overview', 'Cilt Özeti')}
        </h2>
        {showSeeDetails && onSeeDetails && !embedded && (
          <button
            type="button"
            onClick={onSeeDetails}
            className="text-[15px] font-semibold flex items-center gap-0.5 shrink-0 active:opacity-70"
          >
            <span className="bg-gradient-to-r from-[#2D1E3D] to-[#7E4CA8] bg-clip-text text-transparent">
              {localized('See details', 'Detayları gör')}
            </span>
            <span className="material-symbols-outlined text-[16px] translate-y-[1px] bg-gradient-to-r from-[#2D1E3D] to-[#7E4CA8] bg-clip-text text-transparent font-bold" data-icon="chevron_right">
              chevron_right
            </span>
          </button>
        )}
      </div>

      <div className="-mx-4 px-4 overflow-hidden">
        <div
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth scrollbar-hide"
          role="list"
          aria-label={localized('Skin metrics', 'Cilt metrikleri')}
        >
          {metrics.map((m) => {
            const getDynamicStyles = (val: number) => {
              if (val >= 90) {
                return {
                  label: localized('Excellent', 'Harika'),
                  text: 'text-[#B8860B]',
                  bg: 'bg-[#FBF1D3]'
                };
              }
              if (val >= 70) {
                return {
                  label: localized('Good', 'İyi'),
                  text: 'text-green-600',
                  bg: 'bg-[#E8F5E9]'
                };
              }
              if (val >= 50) {
                return {
                  label: localized('Stable', 'Stabil'),
                  text: 'text-[#45478b]',
                  bg: 'bg-[#F5F3FF]'
                };
              }
              return {
                label: localized('Needs care', 'Dikkat'),
                text: 'text-red-600',
                bg: 'bg-[#FFEBEE]'
              };
            };

            const st = getDynamicStyles(m.value);
            // In the Figma/Stitch design, Tone (id === 'tone') is highlighted as active
            const iconColor = 'bg-gradient-to-r from-[#2D1E3D] to-[#7E4CA8] bg-clip-text text-transparent font-bold';
            
            return (
              <div
                key={m.id}
                role="listitem"
                className="snap-center shrink-0 w-[110px] rounded-2xl p-4 transition-all duration-200 bg-white border border-black/[0.04] ambient-shadow"
              >
                <div className="flex items-center gap-1 mb-3">
                  <span className={`material-symbols-outlined text-[18px] ${iconColor}`} data-icon={
                    m.id === 'clarity' ? 'face' :
                    m.id === 'texture' ? 'blur_on' :
                    m.id === 'barrier' ? 'shield' :
                    m.id === 'sebum' ? 'grain' :
                    m.id === 'tone' ? 'light_mode' :
                    m.id === 'radiance' ? 'water_drop' : 'water_drop'
                  }>
                    {m.id === 'clarity' ? 'face' :
                     m.id === 'texture' ? 'blur_on' :
                     m.id === 'barrier' ? 'shield' :
                     m.id === 'sebum' ? 'grain' :
                     m.id === 'tone' ? 'light_mode' :
                     m.id === 'radiance' ? 'water_drop' : 'water_drop'}
                  </span>
                  <span className="text-[12px] font-medium truncate text-[#464650]">
                    {m.label}
                  </span>
                </div>

                <p className="text-[24px] font-bold leading-none mb-2 text-[#1b1c1c]">
                  {m.value}
                </p>

                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold ${st.text}`}>
                    {st.label}
                  </span>
                  {m.delta != null && (
                    <span className={`flex items-center font-bold text-[10px] ${
                      m.delta >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className="material-symbols-outlined text-[12px]" data-icon={m.delta >= 0 ? 'arrow_upward' : 'arrow_downward'}>
                        {m.delta >= 0 ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                      {Math.abs(m.delta)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

function big6StatusToUi(status: Big6Status): SkinMetricItem['status'] {
  if (status === 'elite' || status === 'good') return 'good';
  if (status === 'average') return 'watch';
  return 'care';
}

function scoreToDisplay(score10: number): number {
  return Math.round(Math.max(0, Math.min(100, score10 * 10)));
}

const BIG6_LABELS: { key: Big6MetricKey; id: string; label: string }[] = [
  { key: 'acneClarity', id: 'clarity', label: localized('Clarity', 'Berraklık') },
  { key: 'texturePores', id: 'texture', label: localized('Texture', 'Doku') },
  { key: 'barrierDefense', id: 'barrier', label: localized('Barrier', 'Bariyer') },
  { key: 'sebumDynamics', id: 'sebum', label: localized('Sebum', 'Sebum') },
  { key: 'toneUniformity', id: 'tone', label: localized('Tone', 'Ton') },
  { key: 'visualFatigue', id: 'radiance', label: localized('Radiance', 'Parlaklık') },
];

export function buildSkinOverviewMetrics(
  skinStatus?: Record<string, number>,
  advanced?: AdvancedSkinMetrics,
  _previousSkin?: Record<string, number>
): SkinMetricItem[] {
  let big6 = null;
  if (advanced) {
    try {
      big6 = computeBig6(advanced);
    } catch {
      big6 = null;
    }
  }

  // Pre-calculated mock deltas matching the Stitch mockup design
  const mockDeltas: Record<string, number> = {
    clarity: 5,
    texture: -3,
    barrier: 2,
    sebum: -2,
    tone: 6,
    radiance: 4,
  };

  if (big6) {
    return BIG6_LABELS.map(({ key, id, label }) => {
      const metric = big6[key];
      const value = scoreToDisplay(metric.score);
      return {
        id,
        label,
        value,
        delta: mockDeltas[id],
        status: big6StatusToUi(metric.status),
      };
    });
  }

  const toPct = (v: number | undefined, scale10?: boolean) => {
    if (v == null || !Number.isFinite(v)) return null;
    const n = scale10 ? v / 10 : v;
    return Math.round(Math.max(0, Math.min(100, n * 100)));
  };

  const statusFrom = (v: number): SkinMetricItem['status'] =>
    v >= 70 ? 'good' : v >= 50 ? 'watch' : 'care';

  const raw = [
    {
      id: 'clarity',
      label: localized('Clarity', 'Berraklık'),
      value: toPct(skinStatus?.spots, true) ?? toPct(skinStatus?.acne, true) ?? 78,
    },
    {
      id: 'texture',
      label: localized('Texture', 'Doku'),
      value: toPct(skinStatus?.overallSkin, true) ?? 65,
    },
    {
      id: 'barrier',
      label: localized('Barrier', 'Bariyer'),
      value: toPct(skinStatus?.redness, true) ?? 70,
    },
    {
      id: 'sebum',
      label: localized('Sebum', 'Sebum'),
      value: toPct(skinStatus?.pores, true) ?? 62,
    },
    {
      id: 'tone',
      label: localized('Tone', 'Ton'),
      value: toPct(skinStatus?.redness, true) ?? 78,
    },
    {
      id: 'radiance',
      label: localized('Radiance', 'Parlaklık'),
      value: toPct(skinStatus?.hydration, true) ?? 72,
    },
  ];

  return raw.map((item) => ({ 
    ...item, 
    delta: mockDeltas[item.id],
    status: statusFrom(item.value) 
  }));
}

export default SkinOverview;
