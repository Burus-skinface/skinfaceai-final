
import React from 'react';
import { DailyReport } from '../types';
import { Sparkles } from './icons/SparklesIcon';
import { t, getLocale } from '../localization';
import HistoryCalendar from './HistoryCalendar';
import TrendChart from './TrendChart';

interface ProgressProps {
  history: DailyReport[];
  onSelectReport: (reportId: string) => void;
  compliment: string | null;
  latestImprovement?: string;
}

const Progress: React.FC<ProgressProps> = ({ history, onSelectReport, compliment, latestImprovement }) => {
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
          Track Your<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Glow-Up Progress</span>
        </h2>
        <p className="text-[15px] text-gray-400 leading-relaxed max-w-[280px] mb-8">
          Complete your first scan to start tracking daily improvements in your Face Score, Skin Health, and Aesthetics.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['Score History', 'Daily Streaks', 'Before & After', 'Trend Analysis'].map(f => (
            <div key={f} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 font-medium">
              {f}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto pb-20 pt-16">
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
        <h3 className="text-sm font-semibold text-[#86868B] mb-3 ml-2 uppercase tracking-widest">History Calendar</h3>
        <HistoryCalendar history={history} onSelectReport={onSelectReport} />
      </div>

    </div>
  );
};

export default Progress;
