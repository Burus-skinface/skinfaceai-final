import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { localized } from '../../localization';

const PANEL_MS = 420;
const APPLE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export interface FocusAreaItem {
  id: string;
  title: string;
  impact: number;
  description?: string;
}

interface FocusDetailsScreenProps {
  areas: FocusAreaItem[];
  isFreeUser?: boolean;
  onClose: () => void;
  onShowPaywall?: () => void;
  onNavigateToRecommendations?: () => void;
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
      tag: localized('High Impact', 'Yüksek Etki'),
      tagClass: 'bg-[#FCE7F3] text-[#BE185D]',
      impactColor: 'text-[#EC4899]',
      barGradient: 'from-[#EC4899] to-[#8B5CF6]',
    };
  } else if (absImpact >= 0.3) {
    return {
      tag: localized('Medium Impact', 'Orta Etki'),
      tagClass: 'bg-[#FEF3C7] text-[#B45309]',
      impactColor: 'text-[#F59E0B]',
      barGradient: 'from-[#F59E0B] to-[#FBBF24]',
    };
  } else {
    return {
      tag: localized('Low Impact', 'Düşük Etki'),
      tagClass: 'bg-[#D1FAE5] text-[#047857]',
      impactColor: 'text-[#10B981]',
      barGradient: 'from-[#10B981] to-[#34D399]',
    };
  }
}

const FocusDetailsScreen: React.FC<FocusDetailsScreenProps> = ({
  areas,
  isFreeUser = true,
  onClose,
  onShowPaywall,
  onNavigateToRecommendations,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [backPressed, setBackPressed] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsOpen(true));
    });
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = prev;
    };
  }, []);

  const requestClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handlePanelTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    if (!isOpen) onClose();
  };

  const handleBackPointerDown = () => setBackPressed(true);
  const handleBackPointerUp = () => setBackPressed(false);

  const handleGlowUp = () => {
    if (isFreeUser) {
      setIsOpen(false);
      setTimeout(() => {
        onClose();
        onShowPaywall?.();
      }, PANEL_MS);
    } else {
      setIsOpen(false);
      setTimeout(() => {
        onClose();
        onNavigateToRecommendations?.();
      }, PANEL_MS);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true">
      {/* Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        style={{
          opacity: isOpen ? 1 : 0,
          transitionDuration: `${PANEL_MS}ms`,
          transitionTimingFunction: APPLE_EASE,
        }}
        onClick={requestClose}
        aria-hidden
      />

      {/* Drawer Panel */}
      <div
        className="absolute bottom-0 left-0 right-0 top-[10%] flex flex-col bg-[#fbf9f9] rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] will-change-transform overflow-hidden"
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transitionProperty: 'transform',
          transitionDuration: `${PANEL_MS}ms`,
          transitionTimingFunction: APPLE_EASE,
        }}
        onTransitionEnd={handlePanelTransitionEnd}
      >
        {/* Grab Handle */}
        <div className="w-full py-3 flex justify-center shrink-0 cursor-pointer" onClick={requestClose}>
          <div className="w-12 h-1.5 bg-black/10 rounded-full" />
        </div>

        {/* Top Header */}
        <header className="shrink-0 px-4 pb-3 bg-[#fbf9f9] border-b border-black/[0.04] relative flex items-center justify-between">
          <button
            type="button"
            onClick={requestClose}
            onPointerDown={handleBackPointerDown}
            onPointerUp={handleBackPointerUp}
            onPointerLeave={handleBackPointerUp}
            onPointerCancel={handleBackPointerUp}
            className="w-10 h-10 rounded-full bg-white border border-black/[0.06] flex items-center justify-center text-[#2e2f72] shadow-sm active:scale-95 transition-all z-10"
            style={{
              transform: backPressed ? 'scale(0.88)' : 'scale(1)',
              transition: 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
            aria-label={localized('Back', 'Geri')}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="arrow_back_ios_new">
              arrow_back_ios_new
            </span>
          </button>

          <h1 className="text-lg font-bold text-[#1b1c1c] absolute left-1/2 -translate-x-1/2">
            {localized('Focus Areas', 'Odak Alanları')}
          </h1>

          <div className="w-10" />
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div
            className="max-w-lg mx-auto w-full px-6 py-6 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] space-y-6"
            style={{
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity ${PANEL_MS}ms ${APPLE_EASE}, transform ${PANEL_MS}ms ${APPLE_EASE}`,
              transitionDelay: isOpen ? '100ms' : '0ms',
            }}
          >
            {/* Intro Card */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-start gap-4 border border-black/[0.02]">
              <div className="bg-[#e1e0ff]/40 p-2.5 rounded-2xl flex-shrink-0 text-[#2e2f72]">
                <span className="material-symbols-outlined text-[24px]" data-icon="auto_awesome">
                  auto_awesome
                </span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#2e2f72] mb-1">
                  {localized('Focus on what matters most', 'En önemli noktalara odaklan')}
                </h2>
                <p className="text-sm text-[#464650] leading-relaxed">
                  {localized(
                    'These areas impact your skin score the most.',
                    'Bu alanlar cilt skorunuzu en çok etkileyen kısımlardır.'
                  )}
                </p>
              </div>
            </div>

            {/* Focus List */}
            <div className="space-y-4">
              {areas.map((area) => {
                const imgSrc = imageFor(area.id);
                const barWidthPercent = Math.min(
                  100,
                  Math.max(10, Math.round(Math.abs(area.impact) * 100))
                );
                const config = impactConfig(area.impact);

                return (
                  <div
                    key={`${area.id}-${area.title}`}
                    onClick={handleGlowUp}
                    className="bg-white rounded-[32px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex gap-5 border border-black/[0.02] items-center hover:scale-[0.99] transition-transform cursor-pointer group active:opacity-90"
                  >
                    {/* Image Area */}
                    <div className="w-24 h-24 rounded-[24px] overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        alt={area.title}
                        className="w-full h-full object-cover"
                        src={imgSrc}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.endsWith('/images/uneven_texture.png')) {
                            target.src = '/images/uneven_texture.png';
                          }
                        }}
                        draggable={false}
                      />
                    </div>

                    {/* Meta Area */}
                    <div className="flex-1 py-1">
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.tagClass}`}
                        >
                          {config.tag}
                        </span>
                        <span
                          className="material-symbols-outlined text-gray-300 group-hover:text-[#2e2f72] transition-colors text-xl"
                          data-icon="chevron_right"
                        >
                          chevron_right
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-[#1b1c1c] mb-0.5">{area.title}</h3>
                      {area.description && (
                        <p className="text-xs text-[#777681] mb-3 line-clamp-2 leading-tight">
                          {area.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#777681]">
                          {localized('Score impact', 'Skor etkisi')}
                        </span>
                        <span className={`text-sm font-bold ${config.impactColor}`}>
                          {area.impact.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden flex">
                        <div
                          className={`h-full bg-gradient-to-r ${config.barGradient} rounded-full`}
                          style={{ width: `${barWidthPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Call to Action Banner */}
            <div className="bg-[#e1e0ff]/40 rounded-3xl p-5 mt-8 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#2e2f72]/5 rounded-full blur-2xl"></div>
              <div className="relative z-10 w-2/3">
                <h3 className="text-sm font-bold text-[#2e2f72] mb-1">
                  {localized('Not sure how to fix these?', 'Bunları nasıl gidereceğini bilmiyor musun?')}
                </h3>
                <p className="text-xs text-[#45478b] opacity-80">
                  {localized(
                    'Get your personalized plan with steps and timings.',
                    'Adımlar ve zamanlamalar içeren kişisel planını al.'
                  )}
                </p>
              </div>
              <div className="relative z-10">
                <button
                  type="button"
                  onClick={handleGlowUp}
                  className="bg-[#2e2f72] text-white rounded-full px-4 py-2 text-xs font-bold shadow-md hover:bg-opacity-90 active:scale-95 transition-all"
                >
                  {localized('Glow Up!', 'Işılda!')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FocusDetailsScreen;
