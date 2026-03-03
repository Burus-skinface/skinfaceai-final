import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DailyReport } from '../types';

interface ProgressTrackerProps {
  history: DailyReport[];
  onSelectReport: (reportId: string) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ history, onSelectReport }) => {
  const chartData = history.map(report => ({
    name: new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: report.scoring?.globalScore ?? report.global_score ?? 0,
  }));

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4">Progress Overview</h2>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
            <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                borderColor: '#334155',
                color: '#f1f5f9',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="score" name="Progress Score" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Analysis History</h3>
        <div className="flex overflow-x-auto space-x-3 pb-4">
          {history.slice().reverse().map(report => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className="flex-shrink-0 cursor-pointer group bg-slate-100 dark:bg-slate-700 rounded-lg p-3 text-center hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors duration-200"
            >
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-800 dark:group-hover:text-teal-100">
                {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Score: {(report.scoring?.globalScore ?? report.global_score ?? 0).toFixed(0)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;