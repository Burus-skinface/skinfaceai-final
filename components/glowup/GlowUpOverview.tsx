import React from 'react';
import { DailyReport } from '../../types';
import { localized, translateDynamicNote } from '../../localization';
import { PRODUCT_CATALOG } from '../../utils/products';
import { Sparkles } from '../icons/SparklesIcon';
import { resolveScanImageUrl } from '../dashboard/constants';
import { getStreakData } from '../../utils/streak';
import {
  GlowUpDayProgress,
  completedCount,
  expectedTransformation,
  overallPercent,
} from './glowUpProgress';

export type RoutineVariant = 'morning' | 'evening';

interface GlowUpOverviewProps {
  data: DailyReport;
  userName?: string | null;
  progress: GlowUpDayProgress;
  isFreeUser?: boolean;
  onOpenRoutine: (variant: RoutineVariant) => void;
  onShowPaywall?: () => void;
}

function greetingText(): string {
  const h = new Date().getHours();
  if (h < 12) return localized('Good morning,', 'Günaydın,');
  if (h < 18) return localized('Good afternoon,', 'İyi günler,');
  return localized('Good evening,', 'İyi akşamlar,');
}

const GlowUpOverview: React.FC<GlowUpOverviewProps> = ({
  data,
  userName,
  progress,
  isFreeUser = true,
  onOpenRoutine,
  onShowPaywall,
}) => {
  const recommendations = data.recommendations!;
  const morningSteps = recommendations.dailyRoutine?.morning ?? [];
  const eveningSteps = recommendations.dailyRoutine?.evening ?? [];
  const percent = overallPercent(progress);
  const morningDone = completedCount(progress.morning);
  const eveningDone = completedCount(progress.evening);

  const focusArea = Array.isArray(recommendations.focusAreas) ? recommendations.focusAreas[0] : undefined;
  const priority = recommendations.priorityOrder?.[0] || focusArea?.area;

  const currentScore = data.scoring?.globalScore ?? null;
  const potentialScore = data.scoring?.potentialScore ?? null;
  const gap = currentScore != null && potentialScore != null ? Math.max(0, potentialScore - currentScore) : 0.4;
  const skinImpact = Math.max(0.1, Math.round(gap * 0.6 * 10) / 10);
  const faceImpact = Math.max(0.1, Math.round(gap * 0.2 * 10) / 10);

  const transformation = expectedTransformation(currentScore, potentialScore);

  const streak = getStreakData();
  const weekDays = Math.min(7, streak.currentStreak);

  const isMock = !data.imageUrl || data.imageUrl.includes('hero-scan-default.png');
  const portraitSrc = isMock ? '/images/sofia_portrait.png' : resolveScanImageUrl(data.imageUrl);

  const recommendedProducts = Array.isArray(recommendations.recommendedProducts)
    ? recommendations.recommendedProducts
    : [];
  const motivationalNote = translateDynamicNote(recommendations.motivationalNote ?? '');

  // Completion ring geometry
  const R = 34;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-6 space-y-4">
      {/* Greeting */}
      <div className="pt-4 pb-1 px-1 flex items-center justify-between">
        <div>
          <p className="text-[13px] text-[#777681]">{greetingText()}</p>
          <h1 className="text-[26px] font-extrabold tracking-tight text-[#1b1c1c] flex items-center gap-1.5">
            {userName || localized('Glow Up', 'Glow Up')}
            <span className="material-symbols-outlined text-[20px] text-amber-400" data-icon="wb_sunny">
              wb_sunny
            </span>
          </h1>
        </div>
      </div>

      {/* TODAY'S GLOW UP — completion ring */}
      <section className="bg-gradient-to-br from-[#fdf6ec] to-[#f6ecfb] rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b48a3c] mb-3">
          {localized("Today's Glow Up", 'Bugünkü Glow Up')}
        </p>
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 84 84" className="w-24 h-24 -rotate-90">
              <circle cx="42" cy="42" r={R} fill="none" stroke="#00000010" strokeWidth="7" />
              <circle
                cx="42"
                cy="42"
                r={R}
                fill="none"
                stroke="url(#glowRingGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - percent / 100)}
                style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.32, 0.72, 0, 1)' }}
              />
              <defs>
                <linearGradient id="glowRingGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-extrabold text-[#1b1c1c] leading-none">{percent}%</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#777681]">
                {localized('Complete', 'Tamamlandı')}
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#1b1c1c] mb-1">
              {percent >= 100
                ? localized('All done for today!', 'Bugünlük hepsi tamam!')
                : localized("You're doing great!", 'Harika gidiyorsun!')}
            </p>
            <p className="text-[13px] text-[#777681] leading-snug">
              {localized('Consistency is your superpower.', 'İstikrar senin süper gücün.')}
            </p>
          </div>
        </div>
      </section>

      {/* AI PRIORITY FOR TODAY */}
      {(priority || focusArea) && (
        <section className="bg-gradient-to-br from-[#f3ebfc] to-[#fdf1f8] rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02] relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#a855f7]/10 rounded-full blur-2xl" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7E4CA8] mb-2">
            {localized('AI Priority for Today', 'Bugünün AI Önceliği')}
          </p>
          <h2 className="text-[19px] font-extrabold text-[#1b1c1c] tracking-tight mb-1.5">
            {priority || focusArea?.area}
          </h2>
          {focusArea?.why && (
            <p className="text-[13px] text-[#464650] leading-relaxed mb-3">{focusArea.why}</p>
          )}
          <div className="flex gap-2">
            <span className="px-2.5 py-1 bg-white/70 rounded-lg text-[11px] font-bold text-[#1b1c1c] border border-black/[0.04]">
              +{skinImpact.toFixed(1)} {localized('Skin Score', 'Cilt Skoru')}
            </span>
            <span className="px-2.5 py-1 bg-white/70 rounded-lg text-[11px] font-bold text-[#1b1c1c] border border-black/[0.04]">
              +{faceImpact.toFixed(1)} {localized('Face Score', 'Yüz Skoru')}
            </span>
          </div>
        </section>
      )}

      {/* TODAY'S ROUTINES */}
      <section>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777681] mb-3 px-1">
          {localized("Today's Routines", 'Bugünkü Rutinler')}
        </p>
        <div className="space-y-3">
          {/* Morning */}
          <button
            type="button"
            onClick={() => onOpenRoutine('morning')}
            className="w-full bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02] flex items-center gap-4 text-left active:scale-[0.99] transition-transform"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px] text-amber-500" data-icon="wb_sunny">
                wb_sunny
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-[15px] font-bold text-[#1b1c1c]">
                  {localized('Morning Routine', 'Sabah Rutini')}
                </h3>
                <span className="text-[12px] font-bold text-[#777681]">
                  {morningDone} / {morningSteps.length}
                </span>
              </div>
              <p className="text-[11px] text-[#777681] mb-2">
                {localized('Protect & energize', 'Koru ve enerji ver')}
                <span className="ml-1 text-[10px] uppercase tracking-wide">
                  {localized('completed', 'tamamlandı')}
                </span>
              </p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${morningSteps.length ? (morningDone / morningSteps.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-300 text-xl flex-shrink-0" data-icon="chevron_right">
              chevron_right
            </span>
          </button>

          {/* Evening */}
          <button
            type="button"
            onClick={() => onOpenRoutine('evening')}
            className="w-full bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02] flex items-center gap-4 text-left active:scale-[0.99] transition-transform"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px] text-indigo-500" data-icon="dark_mode">
                dark_mode
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-[15px] font-bold text-[#1b1c1c]">
                  {localized('Evening Routine', 'Akşam Rutini')}
                </h3>
                <span className="text-[12px] font-bold text-[#777681]">
                  {eveningDone} / {eveningSteps.length}
                </span>
              </div>
              <p className="text-[11px] text-[#777681] mb-2">
                {localized('Repair & recover', 'Onar ve toparla')}
                <span className="ml-1 text-[10px] uppercase tracking-wide">
                  {localized('completed', 'tamamlandı')}
                </span>
              </p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${eveningSteps.length ? (eveningDone / eveningSteps.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-300 text-xl flex-shrink-0" data-icon="chevron_right">
              chevron_right
            </span>
          </button>
        </div>
      </section>

      {/* WEEKLY FOCUS */}
      {focusArea && (
        <section className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777681]">
              {localized('Weekly Focus', 'Haftalık Odak')}
            </p>
            <span className="material-symbols-outlined text-[14px] text-[#7E4CA8]" data-icon="target">
              target
            </span>
          </div>
          <p className="text-[12px] text-[#777681] mb-0.5">{localized("This week's goal", 'Bu haftanın hedefi')}</p>
          <h3 className="text-[17px] font-extrabold text-[#1b1c1c] tracking-tight mb-1">{focusArea.area}</h3>
          <p className="text-[12px] text-[#777681] mb-3">
            {localized('Estimated impact:', 'Tahmini etki:')}{' '}
            <span className="font-bold text-[#16a34a]">+{skinImpact.toFixed(1)} {localized('Score', 'Skor')}</span>
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#a855f7] to-[#ec4899] rounded-full"
                style={{ width: `${(weekDays / 7) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-[#777681] flex-shrink-0">
              {weekDays} / 7 {localized('days completed', 'gün tamamlandı')}
            </span>
          </div>
        </section>
      )}

      {/* PRODUCT RECOMMENDATIONS (existing affiliate carousel) */}
      {recommendedProducts.length > 0 && (
        <section className="pt-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777681] mb-3 px-1">
            {localized('Matched Products', 'Eşleşen Ürünler')}
          </p>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide">
            {recommendedProducts.map((aiRec, idx) => {
              const product = PRODUCT_CATALOG.find((p) => p.id === aiRec.productId);
              if (!product) return null;
              return (
                <a
                  key={idx}
                  href={product.amazonAffiliateLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0 w-[240px] snap-center bg-white border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden relative group block cursor-pointer hover:border-purple-500/30 transition-colors"
                >
                  <div className="h-36 w-full relative bg-gray-50 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="relative w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-black/10 shadow-sm flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span className="text-[10px] font-black text-[#1D1D1F] tracking-widest uppercase">
                        {aiRec.confidenceScore}% {localized('match', 'eşleşme')}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 bg-teal-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                      {product.priceEstimation}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <div>
                      <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mb-1">
                        {product.category}
                      </p>
                      <h4 className="text-[#1D1D1F] font-bold leading-tight text-[14px]">{product.name}</h4>
                    </div>
                    <p className="text-[11px] text-[#48484A] leading-relaxed">"{aiRec.reason}"</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* EXPECTED TRANSFORMATION */}
      <section className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777681] mb-4">
          {localized('Expected Transformation', 'Beklenen Dönüşüm')}
        </p>
        <TransformationTimeline points={transformation} />
        <div className="flex justify-between mt-2">
          {transformation.map((p, i) => (
            <div key={p.days} className="text-center flex-1">
              <p className="text-[11px] font-bold text-[#1b1c1c]">
                {p.days} {localized('Days', 'Gün')}
              </p>
              <p className="text-[11px] font-extrabold text-[#7E4CA8]">+{p.gain.toFixed(1)}</p>
              <p className="text-[9px] text-[#777681] leading-tight">
                {i === 0
                  ? localized('Glow Boost', 'Işıltı Artışı')
                  : i === 1
                    ? localized('Stronger Barrier', 'Güçlü Bariyer')
                    : localized('Overall Potential', 'Genel Potansiyel')}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FUTURE YOU */}
      <section className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.02]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777681]">
              {localized('Future You', 'Gelecekteki Sen')}
            </p>
            <span className="material-symbols-outlined text-[14px] text-[#a855f7]" data-icon="auto_awesome">
              auto_awesome
            </span>
          </div>
          {!isFreeUser && potentialScore != null && (
            <span className="text-[11px] font-extrabold text-[#7E4CA8]">
              {localized('Potential', 'Potansiyel')} {potentialScore.toFixed(1)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={isFreeUser ? onShowPaywall : undefined}
          className={`relative w-full h-44 rounded-2xl overflow-hidden block ${isFreeUser ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'} transition-transform`}
        >
          <img
            src={portraitSrc}
            alt={localized('Future you', 'Gelecekteki sen')}
            className="w-full h-full object-cover object-top"
            draggable={false}
          />
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/80" />
          <span className="absolute bottom-2 left-3 text-[10px] font-bold text-white drop-shadow">
            {localized('Today', 'Bugün')}
          </span>
          <span className="absolute bottom-2 right-3 text-[10px] font-bold text-white drop-shadow">
            {localized('In 60 Days', '60 Gün Sonra')}
          </span>
          {isFreeUser && (
            <>
              <div className="absolute inset-y-0 right-0 w-1/2 backdrop-blur-md bg-black/10" />
              <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-[20px] text-[#1b1c1c]" data-icon="lock">
                    lock
                  </span>
                </div>
              </div>
            </>
          )}
        </button>
      </section>

      {/* MOTIVATIONAL NOTE */}
      {motivationalNote && (
        <section className="bg-[#F5F5F7] rounded-3xl p-6 border border-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04]">
            <Sparkles className="w-16 h-16 text-black" />
          </div>
          <p className="text-[14px] font-semibold text-[#1b1c1c] italic leading-relaxed relative z-10">
            "{motivationalNote}"
          </p>
        </section>
      )}
    </div>
  );
};

const TransformationTimeline: React.FC<{ points: { days: number; gain: number }[] }> = ({ points }) => {
  const W = 320;
  const H = 56;
  const PAD = 24;
  const maxGain = Math.max(...points.map((p) => p.gain), 0.1);
  const stepX = (W - PAD * 2) / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: PAD + i * stepX,
    y: H - 12 - (p.gain / maxGain) * (H - 24),
  }));
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none">
      <polyline
        points={polyline}
        fill="none"
        stroke="#a855f7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 0"
      />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="5" fill="#fff" stroke="#a855f7" strokeWidth="2.5" />
      ))}
    </svg>
  );
};

export default GlowUpOverview;
