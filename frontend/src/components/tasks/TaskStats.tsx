import React from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { CheckCircle2, Clock, ListTodo, AlertCircle } from 'lucide-react';

export const TaskStats: React.FC = () => {
  const { tasks, totalTasks, completedTasks, pendingTasks, completionRate } = useTasks();

  const totalEstimatedMinutes = tasks
    .filter((t) => !t.completed)
    .reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);

  const estimatedHours = Math.round((totalEstimatedMinutes / 60) * 10) / 10;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <div className="clay-card p-4 sm:p-5 rounded-[26px] flex flex-col justify-between border-2 border-white">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Total Tasks</span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shadow-xs">
            <ListTodo className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{totalTasks}</div>
        <div className="text-[11px] text-slate-400 font-semibold mt-1">Across all subjects</div>
      </div>

      <div className="clay-card-mint p-4 sm:p-5 rounded-[26px] flex flex-col justify-between border-2 border-white">
        <div className="flex items-center justify-between text-emerald-800 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-600/15 flex items-center justify-center text-emerald-700 shadow-xs">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">{completedTasks}</div>
        <div className="text-[11px] text-emerald-800 font-bold mt-1">{completionRate}% completion rate</div>
      </div>

      <div className="clay-card-peach p-4 sm:p-5 rounded-[26px] flex flex-col justify-between border-2 border-white">
        <div className="flex items-center justify-between text-rose-800 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
          <div className="w-8 h-8 rounded-xl bg-rose-600/15 flex items-center justify-center text-rose-700 shadow-xs">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">{pendingTasks}</div>
        <div className="text-[11px] text-rose-800 font-bold mt-1">Ready for study sessions</div>
      </div>

      <div className="clay-card-sky p-4 sm:p-5 rounded-[26px] flex flex-col justify-between border-2 border-white">
        <div className="flex items-center justify-between text-sky-800 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Remaining Work</span>
          <div className="w-8 h-8 rounded-xl bg-sky-600/15 flex items-center justify-center text-sky-700 shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-sky-800 tracking-tight">{estimatedHours}h</div>
        <div className="text-[11px] text-sky-700 font-bold mt-1">Est. focus time required</div>
      </div>
    </div>
  );
};
