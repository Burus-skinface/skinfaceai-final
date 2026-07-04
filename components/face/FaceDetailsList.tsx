import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { localized } from '../../localization';
import type { FaceBig6Scores } from '../../services/scoring/faceBig6Scoring';
import {
  FACE_FEATURE_IDS,
  FACE_FEATURE_META,
  FaceFeatureId,
  getFeatureMetric,
  scoreColor,
  scoreLabel,
} from './faceFeatureMeta';

const PANEL_MS = 420;
const APPLE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

interface FaceDetailsListProps {
  scores: FaceBig6Scores | undefined;
  onClose: () => void;
  onSelectFeature: (id: FaceFeatureId) => void;
}

const FaceDetailsList: React.FC<FaceDetailsListProps> = ({
  scores,
  onClose,
  onSelectFeature,
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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true">
      {/* Backdrop */}
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

      {/* Panel */}
      <div
        className="absolute bottom-0 left-0 right-0 top-[8%] flex flex-col bg-[#fbf9f9] rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] will-change-transform overflow-hidden"
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transitionProperty: 'transform',
          transitionDuration: `${PANEL_MS}ms`,
          transitionTimingFunction: APPLE_EASE,
        }}
        onTransitionEnd={handlePanelTransitionEnd}
      >
        {/* Grab handle */}
        <div className="w-full py-3 flex justify-center shrink-0 cursor-pointer" onClick={requestClose}>
          <div className="w-12 h-1.5 bg-black/10 rounded-full" />
        </div>

        {/* Header */}
        <header className="shrink-0 px-4 pb-3 bg-[#fbf9f9] border-b border-black/[0.04] relative flex items-center justify-between">
          <button
            type="button"
            onClick={requestClose}
            onPointerDown={() => setBackPressed(true)}
            onPointerUp={() => setBackPressed(false)}
            onPointerLeave={() => setBackPressed(false)}
            onPointerCancel={() => setBackPressed(false)}
            className="w-10 h-10 rounded-full bg-white border border-black/[0.06] flex items-center justify-center text-[#2e2f72] shadow-sm z-10"
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
            {localized('See Your Details', 'Detaylarını Gör')}
          </h1>

          <div className="w-10" />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div
            className="max-w-lg mx-auto w-full px-5 py-6 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] space-y-4"
            style={{
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity ${PANEL_MS}ms ${APPLE_EASE}, transform ${PANEL_MS}ms ${APPLE_EASE}`,
              transitionDelay: isOpen ? '100ms' : '0ms',
            }}
          >
            {/* Intro card */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-start gap-4 border border-black/[0.02]">
              <div className="bg-[#7E4CA8]/[0.08] p-2.5 rounded-2xl flex-shrink-0 text-[#7E4CA8]">
                <span className="material-symbols-outlined text-[24px]" data-icon="face_retouching_natural">
                  face_retouching_natural
                </span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1b1c1c] mb-1">
                  {localized('Your face at a glance', 'Bir bakışta yüzün')}
                </h2>
                <p className="text-sm text-[#464650] leading-relaxed">
                  {localized(
                    'Tap any feature to see its full breakdown.',
                    'Tam dökümünü görmek için bir özelliğe dokun.'
                  )}
                </p>
              </div>
            </div>

            {/* Feature rows */}
            <div className="space-y-3">
              {FACE_FEATURE_IDS.map((id) => {
                const meta = FACE_FEATURE_META[id];
                const metric = getFeatureMetric(scores, id);
                const score = typeof metric?.score === 'number' ? metric.score : null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectFeature(id)}
                    className="w-full bg-white rounded-[28px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex gap-4 border border-black/[0.02] items-center hover:scale-[0.99] transition-transform text-left group active:opacity-90"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: `${score != null ? scoreColor(score) : '#7E4CA8'}14` }}
                    >
                      <span
                        className="material-symbols-outlined text-[26px]"
                        style={{ color: score != null ? scoreColor(score) : '#7E4CA8' }}
                        data-icon={meta.icon}
                      >
                        {meta.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-bold text-[15px] text-[#1b1c1c]">{meta.title()}</h3>
                        <span
                          className="material-symbols-outlined text-gray-300 group-hover:text-[#7E4CA8] transition-colors text-xl"
                          data-icon="chevron_right"
                        >
                          chevron_right
                        </span>
                      </div>
                      <p className="text-[12px] text-[#777681] leading-tight line-clamp-2 mb-2">
                        {meta.description()}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[15px] font-extrabold"
                          style={{ color: score != null ? scoreColor(score) : '#777681' }}
                        >
                          {score != null ? score.toFixed(1) : '—'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#777681]">
                          {score != null ? (metric?.statusLabel || scoreLabel(score)) : ''}
                        </span>
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden ml-1">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${score != null ? Math.min(100, (score / 10) * 100) : 0}%`,
                              backgroundColor: score != null ? scoreColor(score) : '#e5e7eb',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FaceDetailsList;
