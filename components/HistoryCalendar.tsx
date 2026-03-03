
import React, { useState } from 'react';
import { DailyReport } from '../types';
import { t, getLocale } from '../localization';
import { Sparkles } from './icons/SparklesIcon';

interface HistoryCalendarProps {
    history: DailyReport[];
    onSelectReport: (reportId: string) => void;
}

const HistoryCalendar: React.FC<HistoryCalendarProps> = ({ history, onSelectReport }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get days in month
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Get blanks at start of month
    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Adjust for Monday start if locale implies (Turkish starts Monday)
    // JS getDay(): 0=Sun, 1=Mon.
    // Use Simple Grid for now
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthName = currentDate.toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const getReportForDay = (day: number) => {
        return history.find(r => {
            const d = new Date(r.date);
            return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
        });
    };

    return (
        <div className="bg-white/5 p-4 rounded-3xl border border-white/10 w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6 px-2">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
                    ←
                </button>
                <h3 className="text-lg font-bold text-white capitalize">{monthName}</h3>
                <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
                    →
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-xs font-semibold text-gray-500">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {blanks.map((_, i) => (
                    <div key={`blank-${i}`} className="aspect-square"></div>
                ))}

                {days.map(day => {
                    const report = getReportForDay(day);

                    return (
                        <div key={day} className="aspect-square relative">
                            {report ? (
                                <button
                                    onClick={() => onSelectReport(report.id)}
                                    className="w-full h-full rounded-xl bg-purple-900/40 border border-purple-500/50 flex flex-col items-center justify-center relative hover:scale-105 transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)] group"
                                >
                                    <span className="text-xs font-bold text-white mb-1">{day}</span>
                                    <div className="w-full px-1">
                                        <div className="text-[10px] font-bold text-purple-200 bg-purple-500/20 rounded px-1">
                                            {Math.round(report.global_score)}
                                        </div>
                                    </div>
                                    {/* Tooltip-ish indicator */}
                                    <div className="absolute inset-0 bg-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ) : (
                                <div className="w-full h-full rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                                    <span className="text-xs text-gray-600">{day}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="w-3 h-3 rounded bg-purple-900/40 border border-purple-500/50"></div>
                <span>Analysis Complete</span>
            </div>
        </div>
    );
};

export default HistoryCalendar;
