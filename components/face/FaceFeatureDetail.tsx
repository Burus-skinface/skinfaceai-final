import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { localized } from '../../localization';
import type { FaceBig6Scores, FaceBig6Breakdown } from '../../services/scoring/faceBig6Scoring';
import {
  FACE_FEATURE_META,
  FaceFeatureId,
  getFeatureMetric,
  scoreColor,
  scoreLabel,
  scoreToTopPercent,
} from './faceFeatureMeta';

const PANEL_MS = 420;
const APPLE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

interface FaceFeatureDetailProps {
  featureId: FaceFeatureId;
  scores: FaceBig6Scores | undefined;
  /** AI paragraph for this feature (recommendations.faceBig6Insights[featureId]) */
  aiExplanation?: string;
  isFreeUser?: boolean;
  onClose: () => void;
  onShowPaywall?: () => void;
  onNavigateToRecommendations?: () => void;
}

const FaceFeatureDetail: React.FC<FaceFeatureDetailProps> = ({
  featureId,
  scores,
  aiExplanation,
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

  const handlePlanCta = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
      if (isFreeUser) {
        onShowPaywall?.();
      } else {
        onNavigateToRecommendations?.();
      }
    }, PANEL_MS);
  };

  const meta = FACE_FEATURE_META[featureId];
  const metric = getFeatureMetric(scores, featureId);
  const score = typeof metric?.score === 'number' ? metric.score : null;
  const topPercent = score != null ? scoreToTopPercent(score) : null;
  const breakdown: FaceBig6Breakdown[] = Array.isArray(metric?.breakdown) ? metric!.breakdown : [];
  const strengths = breakdown.filter((b) => b.score >= 7);
  const improvements = breakdown.filter((b) => b.score < 7);
  const tips = meta.tips();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[220]" role="dialog" aria-modal="true">
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
        className="absolute bottom-0 left-0 right-0 top-[6%] flex flex-col bg-[#fbf9f9] rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] will-change-transform overflow-hidden"
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
            {meta.title()}
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
            {/* Score card */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
              <div className="flex items-stretch divide-x divide-black/[0.06] mb-4">
                <div className="flex-1 pr-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#777681] mb-1">
                    {localized('Score', 'Skor')}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-[32px] font-extrabold tracking-tight leading-none"
                      style={{ color: score != null ? scoreColor(score) : '#1b1c1c' }}
                    >
                      {score != null ? score.toFixed(1) : '—'}
                    </span>
                    <span className="text-[14px] font-semibold text-[#c7c5d2]">/10</span>
                  </div>
                  <p
                    className="text-[12px] font-bold mt-1"
                    style={{ color: score != null ? scoreColor(score) : '#777681' }}
                  >
                    {score != null ? (metric?.statusLabel || scoreLabel(score)) : ''}
                  </p>
                </div>
                <div className="flex-1 pl-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#777681] mb-1">
                    {localized('Population', 'Popülasyon')}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] font-extrabold tracking-tight leading-none text-[#7E4CA8]">
                      {topPercent != null ? `${topPercent}%` : '—'}
                    </span>
                  </div>
                  <p className="text-[12px] font-bold mt-1 text-[#777681]">
                    {localized('Top of users', 'Kullanıcıların ilk dilimi')}
                  </p>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${score != null ? Math.min(100, (score / 10) * 100) : 0}%`,
                    backgroundColor: score != null ? scoreColor(score) : '#e5e7eb',
                  }}
                />
              </div>
            </div>

            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
                <h3 className="text-[15px] font-bold text-[#1b1c1c] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#16a34a]" data-icon="check_circle">
                    check_circle
                  </span>
                  {localized('Strengths', 'Güçlü Yönler')}
                </h3>
                <div className="space-y-2.5">
                  {strengths.map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-[#16a34a] flex-shrink-0" data-icon="check">
                        check
                      </span>
                      <span className="text-[14px] text-[#1b1c1c] font-medium flex-1">{b.label}</span>
                      <span className="text-[13px] font-extrabold text-[#16a34a]">{b.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Areas */}
            {improvements.length > 0 && (
              <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
                <h3 className="text-[15px] font-bold text-[#1b1c1c] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#d97706]" data-icon="build_circle">
                    build_circle
                  </span>
                  {localized('Improvement Areas', 'Gelişim Alanları')}
                </h3>
                <div className="space-y-2.5">
                  {improvements.map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-[#d97706] flex-shrink-0" data-icon="arrow_upward">
                        arrow_upward
                      </span>
                      <span className="text-[14px] text-[#1b1c1c] font-medium flex-1">{b.label}</span>
                      <span className="text-[13px] font-extrabold text-[#d97706]">{b.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation */}
            {aiExplanation && (
              <div className="rounded-3xl p-5 shadow-[0_4px_20px_rgba(126,76,168,0.25)] bg-gradient-to-br from-[#7E4CA8] to-[#a855f7] text-white relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <span className="material-symbols-outlined text-[18px]" data-icon="auto_awesome">
                    auto_awesome
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                    {localized('AI Explanation', 'AI Açıklaması')}
                  </span>
                </div>
                <p className="text-[14px] leading-relaxed font-medium relative z-10">{aiExplanation}</p>
              </div>
            )}

            {/* Tips */}
            {tips.length > 0 && (
              <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
                <h3 className="text-[15px] font-bold text-[#1b1c1c] mb-3">
                  {localized('Tips', 'İpuçları')}
                </h3>
                <div className="space-y-3">
                  {tips.map((tip) => (
                    <div key={tip.title} className="flex items-start gap-3 bg-[#F5F5F7] rounded-2xl p-3.5">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 text-[#7E4CA8] shadow-sm">
                        <span className="material-symbols-outlined text-[20px]" data-icon={tip.icon}>
                          {tip.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#1b1c1c]">{tip.title}</p>
                        <p className="text-[12px] text-[#777681] leading-snug">{tip.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How It Compares — bell curve */}
            {score != null && (
              <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
                <h3 className="text-[15px] font-bold text-[#1b1c1c] mb-1">
                  {localized('How It Compares', 'Nasıl Karşılaştırılıyor')}
                </h3>
                <p className="text-[11px] text-[#777681] mb-3">
                  {localized('Your position vs. the population', 'Popülasyona göre konumun')}
                </p>
                <BellCurve score={score} color={scoreColor(score)} />
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={handlePlanCta}
              className="w-full bg-[#7E4CA8] text-white rounded-full py-4 text-[15px] font-bold shadow-[0_8px_24px_rgba(126,76,168,0.35)] active:scale-[0.98] transition-transform"
            >
              {localized('View Recommended Plan', 'Önerilen Planı Gör')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const BellCurve: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const W = 320;
  const H = 100;
  const BASE = 88;
  // Normal distribution centered at x = W/2
  const sigma = W / 6.5;
  const mu = W / 2;
  const steps = 60;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const g = Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));
    pts.push({ x, y: BASE - g * 70 });
  }
  const path = `M 0,${BASE} ${pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} L ${W},${BASE} Z`;
  // Marker: map 0-10 score to x position (assume population mean ≈ 5.5)
  const markerX = Math.min(W - 10, Math.max(10, (score / 10) * W));
  const gMarker = Math.exp(-((markerX - mu) ** 2) / (2 * sigma ** 2));
  const markerY = BASE - gMarker * 70;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
      <path d={path} fill="#7E4CA8" opacity="0.1" />
      <path
        d={path.replace(/ Z$/, '')}
        fill="none"
        stroke="#7E4CA8"
        strokeWidth="2"
        opacity="0.5"
      />
      <line x1={markerX} y1={markerY} x2={markerX} y2={BASE} stroke={color} strokeWidth="2" strokeDasharray="3 3" />
      <circle cx={markerX} cy={markerY} r="5" fill={color} stroke="#fff" strokeWidth="2" />
      <text x={10} y={H - 2} fontSize="9" fill="#9ca3af">0</text>
      <text x={W / 2 - 8} y={H - 2} fontSize="9" fill="#9ca3af">5.0</text>
      <text x={W - 18} y={H - 2} fontSize="9" fill="#9ca3af">10</text>
    </svg>
  );
};

export default FaceFeatureDetail;
