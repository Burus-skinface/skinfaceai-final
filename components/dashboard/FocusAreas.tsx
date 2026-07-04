import React from 'react';
import { localized } from '../../localization';

export interface FocusAreaItem {
  id: string;
  title: string;
  impact: number;
  description?: string;
}

interface FocusAreasProps {
  areas: FocusAreaItem[];
  scanImageUrl?: string | null;
  onShowPlan?: () => void;
  onSeeAll?: () => void;
}

const FOCUS_IMAGES: Record<string, string> = {
  texture: '/images/uneven_texture.png',
  fatigue: '/images/dark_circles.png',
  pores: '/images/enlarged_pores.png',
  barrier: '/images/barrier_health.png',
  tone: '/images/uneven_tone.png',
  acne: '/images/active_acne.png',
};

function imageFor(id: string) {
  if (FOCUS_IMAGES[id]) return FOCUS_IMAGES[id];
  const lowId = id.toLowerCase();
  if (lowId.includes('texture') || lowId.includes('doku')) return FOCUS_IMAGES.texture;
  if (
    lowId.includes('fatigue') ||
    lowId.includes('circle') ||
    lowId.includes('dark') ||
    lowId.includes('göz')
  )
    return FOCUS_IMAGES.fatigue;
  if (lowId.includes('pore') || lowId.includes('gözenek')) return FOCUS_IMAGES.pores;
  if (lowId.includes('barrier') || lowId.includes('bariyer')) return FOCUS_IMAGES.barrier;
  if (lowId.includes('tone') || lowId.includes('ton')) return FOCUS_IMAGES.tone;
  if (
    lowId.includes('acne') ||
    lowId.includes('akne') ||
    lowId.includes('sivilce') ||
    lowId.includes('breakout')
  )
    return FOCUS_IMAGES.acne;
  return FOCUS_IMAGES.texture;
}

function impactConfig(impact: number) {
  const absImpact = Math.abs(impact);
  if (absImpact >= 0.5) {
    return {
      tag: localized('High', 'Yüksek'),
      tagClass: 'bg-[#FCE7F3] text-[#BE185D]',
      impactColor: 'text-[#EC4899]',
      barGradient: 'from-[#EC4899] to-[#8B5CF6]',
    };
  } else if (absImpact >= 0.3) {
    return {
      tag: localized('Medium', 'Orta'),
      tagClass: 'bg-[#FEF3C7] text-[#B45309]',
      impactColor: 'text-[#F59E0B]',
      barGradient: 'from-[#F59E0B] to-[#FBBF24]',
    };
  } else {
    return {
      tag: localized('Low', 'Düşük'),
      tagClass: 'bg-[#D1FAE5] text-[#047857]',
      impactColor: 'text-[#10B981]',
      barGradient: 'from-[#10B981] to-[#34D399]',
    };
  }
}

const FocusAreas: React.FC<FocusAreasProps> = ({ areas, onShowPlan, onSeeAll }) => {
  if (!areas.length) return null;

  return (
    <section className="bg-white rounded-3xl p-5 ambient-shadow mb-8 w-full">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-[17px] font-semibold text-[#1b1c1c]">
          {localized('Focus Areas', 'Odak Alanları')}
        </h2>
        <button
          type="button"
          onClick={onSeeAll || onShowPlan}
          className="text-[15px] font-semibold flex items-center gap-0.5 active:opacity-75"
        >
          <span className="bg-gradient-to-r from-[#2D1E3D] to-[#7E4CA8] bg-clip-text text-transparent">
            {localized('See all', 'Tümünü gör')}
          </span>
          <span className="material-symbols-outlined text-[16px] translate-y-[1px] bg-gradient-to-r from-[#2D1E3D] to-[#7E4CA8] bg-clip-text text-transparent font-bold" data-icon="chevron_right">
            chevron_right
          </span>
        </button>
      </div>

      <div className="space-y-6">
        {areas.map((area) => {
          const imgSrc = imageFor(area.id);
          const barWidthPercent = Math.min(100, Math.max(10, Math.round(Math.abs(area.impact) * 100)));
          const config = impactConfig(area.impact);
          
          return (
            <div key={`${area.id}-${area.title}`} className="flex gap-4 items-center">
              <img
                alt={area.title}
                className="w-20 h-20 rounded-2xl object-cover shrink-0 select-none bg-gray-100"
                src={imgSrc}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.endsWith('/images/uneven_texture.png')) {
                    target.src = '/images/uneven_texture.png';
                  }
                }}
                draggable={false}
              />
              
              <div className="flex-1 min-w-0 flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-[#1b1c1c] truncate">
                    {area.title}
                  </h4>
                  {area.description && (
                    <p className="text-xs text-[#464650] leading-tight mt-1">
                      {area.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${config.tagClass}`}>
                    {config.tag}
                  </span>
                  
                  <span className={`text-xs font-bold ${config.impactColor} mr-1`}>
                    {area.impact.toFixed(1)}
                  </span>
                  
                  <div className="w-16 h-1.5 bg-[#e3e2e2] rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${config.barGradient} rounded-full transition-all duration-500`}
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Embedded CTA Banner */}
      <button
        type="button"
        onClick={onShowPlan}
        className="w-full mt-6 bg-gradient-to-r from-[#2D1E3D] to-[#7E4CA8] hover:opacity-95 active:scale-[0.98] transition-all rounded-xl p-3 flex items-center gap-3 text-left shadow-[0_4px_12px_rgba(45,30,61,0.15)]"
      >
        <div className="bg-white/10 rounded-lg p-1.5 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white" data-icon="auto_awesome">
            auto_awesome
          </span>
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {localized('Focus on improving these areas', 'Bu alanlara odaklan')}
          </p>
          <p className="text-xs text-[#e1e0ff] mt-0.5 truncate">
            {localized('Small changes. Big impact.', 'Küçük adımlar. Büyük etki.')}
          </p>
        </div>
        <span className="material-symbols-outlined text-white shrink-0" data-icon="chevron_right">
          chevron_right
        </span>
      </button>
    </section>
  );
};

export default FocusAreas;
