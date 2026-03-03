
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DailyReport } from '../types';
import { Sparkles } from './icons/SparklesIcon';
import { t, getLocale } from '../localization';

interface ProgressProps {
  history: DailyReport[];
  onSelectReport: (reportId: string) => void;
  compliment: string | null;
  latestImprovement?: string;
}

import HistoryCalendar from './HistoryCalendar';
import WeeklyRecap from './WeeklyRecap';

interface ProgressProps {
  history: DailyReport[];
  onSelectReport: (reportId: string) => void;
  compliment: string | null;
  latestImprovement?: string;
}

const Progress: React.FC<ProgressProps> = ({ history, onSelectReport, compliment, latestImprovement }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-gray-400 text-center">
        <h2 className="text-2xl font-semibold">{t.noHistoryYet}</h2>
        <p className="mt-2">{t.progressAfterFirstAnalysis}</p>
      </div>
    );
  }

  const chartData = history.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(report => ({
    name: new Date(report.date).toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' }),
    score: Math.round(report.global_score),
    id: report.id
  }));

  return (
    <div className="w-full max-w-lg mx-auto pb-20 pt-16">
      {/* 1. Compliment */}
      {compliment && (
        <div className="mb-6 bg-purple-900/30 p-4 rounded-2xl border border-purple-500/20 flex items-start gap-3 backdrop-blur-sm">
          <Sparkles className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
          <p className="text-purple-200 italic font-light">"{compliment}"</p>
        </div>
      )}

      {/* 2. Graph - REMOVED AS REQUESTED BY USER */}

      {/* 3. Calendar (History Interaction) */}
      <div className="px-1">
        <h3 className="text-sm font-semibold text-gray-400 mb-3 ml-2">History Calendar</h3>
        <HistoryCalendar history={history} onSelectReport={onSelectReport} />
      </div>

    </div>
  );
};

export default Progress;
