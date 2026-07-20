import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { localized } from '../../localization';
import Big6InsightsResult from '../Big6InsightsResult';
import type { Big6Insights } from '../../services/recommendations/recommendsEngine';
import type { AdvancedSkinMetrics } from '../../services/scoring/types';

const PANEL_MS = 420;
const APPLE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

interface SkinDetailsScreenProps {
  insights: Big6Insights;
  advancedMetrics?: AdvancedSkinMetrics;
  onClose: () => void;
}

const SkinDetailsScreen: React.FC<SkinDetailsScreenProps> = ({
  insights,
  advancedMetrics,
  onClose,
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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true">
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

        <header className="shrink-0 px-4 pb-3 bg-[#fbf9f9] border-b border-black/[0.04]">
          <div className="flex items-center gap-3 max-w-lg mx-auto w-full">
            <button
              type="button"
              onClick={requestClose}
              onPointerDown={handleBackPointerDown}
              onPointerUp={handleBackPointerUp}
              onPointerLeave={handleBackPointerUp}
              onPointerCancel={handleBackPointerUp}
              className="w-10 h-10 rounded-full bg-white border border-black/[0.06] flex items-center justify-center text-[#2e2f72] shadow-sm"
              style={{
                transform: backPressed ? 'scale(0.88)' : 'scale(1)',
                transition: 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
              aria-label={localized('Back', 'Geri')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div
              className="min-w-0 flex-1"
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity ${PANEL_MS}ms ${APPLE_EASE}, transform ${PANEL_MS}ms ${APPLE_EASE}`,
                transitionDelay: isOpen ? '80ms' : '0ms',
              }}
            >
              <p className="text-[11px] font-bold text-[#777681] uppercase tracking-wide">
                {localized('Skin Overview', 'Cilt Özeti')}
              </p>
              <h1 className="text-[20px] font-extrabold text-[#1b1c1c] tracking-tight truncate">
                {localized('Detailed analysis', 'Detaylı analiz')}
              </h1>
            </div>
          </div>
        </header>
 
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div
            className="max-w-lg mx-auto w-full px-4 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)]"
            style={{
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity ${PANEL_MS}ms ${APPLE_EASE}, transform ${PANEL_MS}ms ${APPLE_EASE}`,
              transitionDelay: isOpen ? '100ms' : '0ms',
            }}
          >
            <Big6InsightsResult
              insights={insights}
              metrics={advancedMetrics}
              variant="detail"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SkinDetailsScreen;
