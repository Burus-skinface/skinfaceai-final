import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { localized } from '../../localization';
import { getStreakData } from '../../utils/streak';
import { WATER_GOAL } from './glowUpProgress';
import type { RoutineVariant } from './GlowUpOverview';

const PANEL_MS = 420;
const APPLE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

interface RoutineDetailProps {
  variant: RoutineVariant;
  steps: string[];
  checked: boolean[];
  water: number;
  onToggleStep: (index: number) => void;
  onWaterChange: (next: number) => void;
  onClose: () => void;
}

const RoutineDetail: React.FC<RoutineDetailProps> = ({
  variant,
  steps,
  checked,
  water,
  onToggleStep,
  onWaterChange,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [backPressed, setBackPressed] = useState(false);

  const isMorning = variant === 'morning';
  const done = checked.filter(Boolean).length;

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

  // Theme tokens per variant
  const theme = isMorning
    ? {
        panelBg: '#fbf7f0',
        headerText: '#1b1c1c',
        subText: '#8a7a5c',
        cardBg: 'bg-white',
        cardBorder: 'border-black/[0.02]',
        titleText: 'text-[#1b1c1c]',
        bodyText: 'text-[#777681]',
        accent: '#f59e0b',
        accentSoft: 'bg-amber-50',
        checkOn: '#f59e0b',
        checkOff: '#e5e7eb',
        heroGradient: 'linear-gradient(135deg, #fde9c8 0%, #f7d7ee 55%, #d9d6fb 100%)',
        icon: 'wb_sunny',
        title: localized('Morning Routine', 'Sabah Rutini'),
        subtitle: localized('Protect & energize your skin', 'Cildini koru ve enerji ver'),
      }
    : {
        panelBg: '#171129',
        headerText: '#ffffff',
        subText: '#b6aed6',
        cardBg: 'bg-white/[0.06]',
        cardBorder: 'border-white/[0.08]',
        titleText: 'text-white',
        bodyText: 'text-[#b6aed6]',
        accent: '#a78bfa',
        accentSoft: 'bg-white/10',
        checkOn: '#8b5cf6',
        checkOff: '#3f3563',
        heroGradient: 'linear-gradient(135deg, #241a44 0%, #1a1333 60%, #0f0b20 100%)',
        icon: 'dark_mode',
        title: localized('Evening Routine', 'Akşam Rutini'),
        subtitle: localized('Repair & recover while you sleep', 'Sen uyurken onar ve toparla'),
      };

  const streak = getStreakData();

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
        className="absolute bottom-0 left-0 right-0 top-[6%] flex flex-col rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.12)] will-change-transform overflow-hidden"
        style={{
          backgroundColor: theme.panelBg,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transitionProperty: 'transform',
          transitionDuration: `${PANEL_MS}ms`,
          transitionTimingFunction: APPLE_EASE,
        }}
        onTransitionEnd={handlePanelTransitionEnd}
      >
        {/* Grab handle */}
        <div className="w-full py-3 flex justify-center shrink-0 cursor-pointer" onClick={requestClose}>
          <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: isMorning ? '#00000018' : '#ffffff22' }} />
        </div>

        {/* Header */}
        <header className="shrink-0 px-4 pb-3 relative flex items-center justify-between" style={{ borderBottom: `1px solid ${isMorning ? '#00000009' : '#ffffff12'}` }}>
          <button
            type="button"
            onClick={requestClose}
            onPointerDown={() => setBackPressed(true)}
            onPointerUp={() => setBackPressed(false)}
            onPointerLeave={() => setBackPressed(false)}
            onPointerCancel={() => setBackPressed(false)}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm z-10 ${isMorning ? 'bg-white border border-black/[0.06] text-[#2e2f72]' : 'bg-white/10 border border-white/10 text-white'}`}
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

          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 className="text-lg font-bold flex items-center gap-1.5 justify-center" style={{ color: theme.headerText }}>
              {theme.title}
              <span className="material-symbols-outlined text-[18px]" style={{ color: theme.accent }} data-icon={theme.icon}>
                {theme.icon}
              </span>
            </h1>
            <p className="text-[10px]" style={{ color: theme.subText }}>{theme.subtitle}</p>
          </div>

          <div className="w-10" />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div
            className="max-w-lg mx-auto w-full px-5 py-5 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] space-y-4"
            style={{
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity ${PANEL_MS}ms ${APPLE_EASE}, transform ${PANEL_MS}ms ${APPLE_EASE}`,
              transitionDelay: isOpen ? '100ms' : '0ms',
            }}
          >
            {/* Hero banner */}
            <div className="rounded-3xl h-28 relative overflow-hidden flex items-center justify-center" style={{ background: theme.heroGradient }}>
              <span
                className="material-symbols-outlined text-[44px]"
                style={{ color: isMorning ? '#f59e0b' : '#c4b5fd', opacity: 0.9 }}
                data-icon={theme.icon}
              >
                {theme.icon}
              </span>
            </div>

            {/* Routine Progress */}
            <div className={`${theme.cardBg} rounded-3xl p-5 border ${theme.cardBorder}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.subText }}>
                  {localized('Routine Progress', 'Rutin İlerlemesi')}
                </p>
                <p className={`text-[13px] font-bold ${theme.titleText}`}>
                  {done} / {steps.length}{' '}
                  <span className="text-[10px] font-semibold" style={{ color: theme.subText }}>
                    {localized('completed', 'tamamlandı')}
                  </span>
                </p>
              </div>
              {/* Stepper */}
              <div className="flex items-center">
                {steps.map((_, i) => (
                  <React.Fragment key={i}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                      style={{
                        backgroundColor: checked[i] ? theme.checkOn : 'transparent',
                        border: `2px solid ${checked[i] ? theme.checkOn : theme.checkOff}`,
                        color: checked[i] ? '#fff' : theme.subText,
                      }}
                    >
                      {checked[i] ? (
                        <span className="material-symbols-outlined text-[15px]" data-icon="check">
                          check
                        </span>
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className="flex-1 h-0.5 mx-1"
                        style={{ backgroundColor: checked[i] && checked[i + 1] ? theme.checkOn : theme.checkOff }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onToggleStep(i)}
                  className={`w-full ${theme.cardBg} rounded-3xl p-4 border ${theme.cardBorder} flex items-center gap-4 text-left active:scale-[0.99] transition-transform`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold ${theme.accentSoft}`}
                    style={{ color: theme.accent }}
                  >
                    {i + 1}
                  </div>
                  <p className={`flex-1 text-[13px] leading-snug font-medium ${checked[i] ? 'line-through opacity-60' : ''} ${theme.titleText}`}>
                    {step}
                  </p>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: checked[i] ? theme.checkOn : 'transparent',
                      border: `2px solid ${checked[i] ? theme.checkOn : theme.checkOff}`,
                    }}
                  >
                    {checked[i] && (
                      <span className="material-symbols-outlined text-[16px] text-white" data-icon="check">
                        check
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Morning: Water Goal */}
            {isMorning && (
              <div className="bg-[#efe9fb] rounded-3xl p-5 border border-black/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#7c6ee0]" data-icon="water_drop">
                      water_drop
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b5fae]">
                      {localized('Water Goal', 'Su Hedefi')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onWaterChange(Math.min(WATER_GOAL, water + 1))}
                    className="bg-white text-[#6b5fae] rounded-full px-3 py-1 text-[11px] font-bold shadow-sm active:scale-95 transition-transform"
                  >
                    + {localized('Add', 'Ekle')}
                  </button>
                </div>
                <p className="text-[15px] font-bold text-[#1b1c1c] mb-3">
                  {water} / {WATER_GOAL} {localized('glasses', 'bardak')}
                </p>
                <div className="flex gap-1.5">
                  {Array.from({ length: WATER_GOAL }, (_, i) => (
                    <div
                      key={i}
                      onClick={() => onWaterChange(i + 1 === water ? i : i + 1)}
                      className="flex-1 h-9 rounded-lg cursor-pointer transition-colors"
                      style={{ backgroundColor: i < water ? '#7c6ee0' : '#ffffff' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Morning: tip */}
            {isMorning && (
              <div className="bg-[#fdf3df] rounded-3xl p-4 border border-black/[0.02] flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-amber-500 flex-shrink-0" data-icon="wb_sunny">
                  wb_sunny
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#b48a3c] mb-0.5">
                    {localized('Tip for Today', 'Bugünün İpucu')}
                  </p>
                  <p className="text-[12px] text-[#5d5344] leading-snug">
                    {localized(
                      'Reapply SPF every 2-3 hours when exposed to sunlight.',
                      'Güneşe maruz kaldığında SPF’i 2-3 saatte bir yenile.'
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Evening: sleep tip */}
            {!isMorning && (
              <div className="bg-white/[0.06] rounded-3xl p-4 border border-white/[0.08] flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-[#a78bfa] flex-shrink-0" data-icon="dark_mode">
                  dark_mode
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#b6aed6] mb-0.5">
                    {localized('Tip for Better Sleep', 'Daha İyi Uyku İçin')}
                  </p>
                  <p className="text-[12px] text-[#d5cfeb] leading-snug">
                    {localized(
                      'Avoid screens 1 hour before bed for deeper, quality sleep.',
                      'Daha derin ve kaliteli uyku için yatmadan 1 saat önce ekranlardan uzak dur.'
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Evening: consistency / streak */}
            {!isMorning && (
              <div className="bg-white/[0.06] rounded-3xl p-5 border border-white/[0.08]">
                <div className="flex items-center gap-1.5 mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b6aed6]">
                    {localized('Consistency', 'İstikrar')}
                  </p>
                  <span className="material-symbols-outlined text-[15px] text-orange-400" data-icon="local_fire_department">
                    local_fire_department
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[32px] font-extrabold text-white leading-none">{streak.currentStreak}</p>
                    <p className="text-[11px] text-[#b6aed6] mt-1">{localized('Day Streak', 'Günlük Seri')}</p>
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {[0.35, 0.5, 0.4, 0.65, 0.55, 0.8, 1].map((h, i) => (
                      <div
                        key={i}
                        className="w-3 rounded-t-sm"
                        style={{ height: `${h * 100}%`, backgroundColor: i === 6 ? '#a78bfa' : '#4c3f7a' }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between mt-1.5 pl-0.5">
                  {localized(['M', 'T', 'W', 'T', 'F', 'S', 'S'], ['P', 'S', 'Ç', 'P', 'C', 'C', 'P']).map((d, i) => (
                    <span key={i} className="text-[9px] text-[#7a6fa8] w-3 text-center">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RoutineDetail;
