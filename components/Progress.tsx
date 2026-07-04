
import React, { useEffect, useState } from 'react';
import { DailyReport } from '../types';
import { Sparkles } from './icons/SparklesIcon';
import HistoryCalendar from './HistoryCalendar';
import TrendChart from './TrendChart';
import { getStreakData, getStreakBadge, StreakData } from '../utils/streak';
import { localized } from '../localization';
import ReferralCard from './ReferralCard';
import WeeklyRecap from './WeeklyRecap';

interface ProgressProps {
  history: DailyReport[];
  onSelectReport: (reportId: string) => void;
  compliment: string | null;
  latestImprovement?: string;
  onNewScan?: () => void;
  userId?: string | null;
}

// Determine whether the user already scanned today, by checking the most recent
// report date against the local "today". History is the source of truth — the
// streak's lastScanDate is treated as a hint only.
function hasScannedToday(history: DailyReport[]): boolean {
  if (history.length === 0) return false;
  const today = new Date().toDateString();
  return history.some(r => {
    if (!r?.date) return false;
    try {
      return new Date(r.date).toDateString() === today;
    } catch {
      return false;
    }
  });
}

const FlameIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2.5s4.5 4 4.5 8.5a4.5 4.5 0 1 1-9 0c0-1.6.7-3 1.5-4-.2 1.2.3 2.3 1.3 2.8C9.5 7 10.5 4.5 12 2.5Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M12 13c1.6 0 2.8 1.2 2.8 2.7 0 1.5-1.2 2.8-2.8 2.8s-2.8-1.3-2.8-2.8c0-.7.3-1.4.8-1.9.1.6.6 1 1.2 1 .6 0 1-.3 1.1-.9.4.3.7.6.7 1.1 0 .6-.4 1-1 1Z"
      fill="currentColor"
    />
  </svg>
);

const DailyCheckInCard: React.FC<{
  streak: StreakData;
  scannedToday: boolean;
  onNewScan?: () => void;
}> = ({ streak, scannedToday, onNewScan }) => {
  const badge = getStreakBadge(streak.currentStreak);

  // Pick the right copy for the current state
  let title: string;
  let body: string;
  if (scannedToday) {
    title = localized('Today’s glow check is done', 'Bugünkü glow check tamam');
    body = streak.currentStreak > 1
      ? localized(
        `${streak.currentStreak}-day glow streak is alive. Do not leave tomorrow blank; keep the line clean.`,
        `${streak.currentStreak} günlük glow serisi yaşıyor. Yarın boş geçme, çizgi kırılmasın.`
      )
      : localized('First ring complete. Scan again tomorrow and start the glow streak.', 'İlk halka tamam. Yarın tekrar tara, glow serisi başlasın.');
  } else if (streak.currentStreak > 0) {
    title = localized(`${streak.currentStreak}-day glow streak at risk`, `${streak.currentStreak} günlük glow serisi riskte`);
    body = localized('No glow check today. Duolingo rule: miss the day, weaken the streak.', 'Bugün glow check yok. Duolingo kuralı: günü kaçırırsan seri zayıflar.');
  } else {
    title = localized('Today’s glow check', 'Bugünün glow check görevi');
    body = localized('Take the first scan. Your glow score only gets real when the streak starts.', 'İlk taramayı al. Glow skorun ancak seri başlayınca gerçek olur.');
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-black/5 mb-6"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F7 100%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      {/* Subtle accent glow */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, rgba(168,85,247,0) 70%)' }}
        aria-hidden="true"
      />

      <div className="relative p-5 flex flex-col gap-4">
        {/* Top row: streak + status pill */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br ${
                streak.currentStreak > 0
                  ? badge?.color ?? 'from-orange-500 to-red-500'
                  : 'from-zinc-300 to-zinc-400'
              }`}
            >
              <FlameIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#1D1D1F] leading-none">
                  {streak.currentStreak}
                </span>
                <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
                  {localized('day glow streak', 'günlük glow serisi')}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#86868B] mt-0.5 uppercase tracking-widest">
                {localized('Record', 'Rekor')}: {streak.longestStreak} • {localized('Scans', 'Ölçüm')}: {streak.totalScans}
              </span>
            </div>
          </div>

          {scannedToday ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/20">
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4L8.5 12 15.3 5.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
              {localized('Today', 'Bugün')}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-[11px] font-bold uppercase tracking-wider border border-amber-500/20">
              {localized('Glow check open', 'Glow check açık')}
            </span>
          )}
        </div>

        {/* Title + body */}
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-[#1D1D1F] leading-snug">{title}</h3>
          <p className="text-[13px] text-[#48484A] leading-relaxed">{body}</p>
        </div>

        {/* CTA */}
        {!scannedToday && onNewScan && (
          <button
            onClick={onNewScan}
            className="w-full h-12 rounded-2xl bg-[#1D1D1F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-colors active:scale-[0.99]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {localized('Complete glow check', 'Glow check’i tamamla')}
          </button>
        )}

        {/* Badge ribbon */}
        {badge && streak.currentStreak > 0 && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-black/5 bg-gradient-to-r ${badge.color}`}>
            <span className="text-base">{badge.emoji}</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">{badge.title}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Progress: React.FC<ProgressProps> = ({ history, onSelectReport, compliment, onNewScan, userId }) => {
  const [streak, setStreak] = useState<StreakData>(() => getStreakData());

  // Re-read streak whenever history length changes (a new scan likely just landed).
  useEffect(() => {
    setStreak(getStreakData());
  }, [history.length]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 pt-16">
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.15)] mx-auto">
            <svg className="w-14 h-14 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <div className="absolute inset-0 w-28 h-28 mx-auto rounded-[2.5rem] border border-emerald-500/10 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-3">
          {localized('Start Your', 'İlk')}<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{localized('Glow Streak', 'Glow Serini Başlat')}</span>
        </h2>
        <p className="text-[15px] text-gray-400 leading-relaxed max-w-[280px] mb-8">
          {localized('No streak, no level up. Take the first scan and give tomorrow something to beat.', 'Seri yoksa level up yok. İlk taramayı al, yarına geçilecek bir skor bırak.')}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {localized(['Glow score', 'Daily streak', 'Before / After', 'Looksmaxx plan'], ['Glow skoru', 'Günlük seri', 'Önce / Sonra', 'Looksmaxx planı']).map(f => (
            <div key={f} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 font-medium">
              {f}
            </div>
          ))}
        </div>
        {onNewScan && (
          <button
            onClick={onNewScan}
            className="mt-8 px-6 h-12 rounded-2xl bg-white text-black font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            {localized('Start first glow check', 'İlk glow check’i başlat')}
          </button>
        )}
      </div>
    );
  }

  const scannedToday = hasScannedToday(history);

  return (
    <div className="w-full max-w-lg mx-auto pb-20 pt-14 px-4">
      {/* 0. Daily Check-in + Streak — pinned at the top */}
      <DailyCheckInCard streak={streak} scannedToday={scannedToday} onNewScan={onNewScan} />

      {userId && <ReferralCard userId={userId} />}

      {history.length >= 1 && <WeeklyRecap history={history} />}

      {/* 1. Compliment */}
      {compliment && (
        <div className="mb-6 bg-[#F5F5F7] p-4 rounded-2xl border border-black/5 flex items-start gap-3 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
          <p className="text-[#48484A] italic font-medium leading-relaxed">"{compliment}"</p>
        </div>
      )}

      {/* 2. Analytics Trend Chart */}
      <TrendChart history={history} />

      {/* 3. Calendar (History Interaction) */}
      <div className="px-1 mt-4">
        <h3 className="text-sm font-semibold text-[#86868B] mb-3 ml-2 uppercase tracking-widest">{localized('Measurement Calendar', 'Ölçüm Takvimi')}</h3>
        <HistoryCalendar history={history} onSelectReport={onSelectReport} />
      </div>

    </div>
  );
};

export default Progress;
