import React from 'react';
import { localized } from '../../localization';

interface Task {
  id: string;
  label: string;
  completed: boolean;
}

interface DailyRoutineCardProps {
  morning: Task[];
  evening: Task[];
}

const DailyRoutineCard: React.FC<DailyRoutineCardProps> = ({ morning, evening }) => {
  const all = [...morning, ...evening];
  const done = all.filter((t) => t.completed).length;
  const total = all.length || 1;

  return (
    <section className="w-full mb-4 bg-white rounded-2xl p-4 border border-black/[0.04] shadow-[0_2px_12px_rgba(46,47,114,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-bold text-[#464650] tracking-wide">
          {localized("Today's routine", 'Bugünün rutini')}
        </h2>
        <span className="text-[11px] font-bold text-[#2e2f72] tabular-nums">
          {done}/{total}
        </span>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-bold text-[#777681] uppercase mb-2">
            {localized('Morning', 'Sabah')}
          </p>
          {morning.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#777681] uppercase mb-2">
            {localized('Evening', 'Akşam')}
          </p>
          {evening.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      </div>
    </section>
  );
};

const TaskRow: React.FC<{ task: Task }> = ({ task }) => (
  <div className="flex items-center gap-2 mb-1.5">
    <div
      className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
        task.completed ? 'bg-[#2e7d32] border-[#2e7d32]' : 'border-[#E5E5EA]'
      }`}
    >
      {task.completed && (
        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </div>
    <span
      className={`text-[13px] font-medium ${
        task.completed ? 'text-[#777681] line-through' : 'text-[#1b1c1c]'
      }`}
    >
      {task.label}
    </span>
  </div>
);

export default DailyRoutineCard;
