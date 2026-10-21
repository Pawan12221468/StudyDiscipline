import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { PriorityBadge } from '../common/Badge';
import { useTasks } from '../../contexts/TaskContext';
import { useTimer } from '../../contexts/TimerContext';
import { CheckSquare, ArrowRight, Play, Check } from 'lucide-react';
import { StudyTask } from '../../types';

export const TodayChecklist: React.FC = () => {
  const navigate = useNavigate();
  const { todayChecklist, toggleTask, completedTasks, totalTasks, isLoading, error, refreshTasks } = useTasks();
  const { linkTask, start } = useTimer();

  const handleStartTaskTimer = (task: StudyTask) => {
    linkTask(task);
    start();
    navigate('/timer');
  };

  return (
    <Card
      title="Today's Study Checklist"
      subtitle="Prioritize critical topics and maintain focus momentum"
      action={
        <button
          onClick={() => navigate('/tasks')}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
        >
          View All ({totalTasks}) <ArrowRight className="w-3.5 h-3.5" />
        </button>
      }
      badge={
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {completedTasks}/{totalTasks} done
        </span>
      }
    >
      <div className="space-y-2.5">
        {isLoading && todayChecklist.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Loading tasks...
          </div>
        ) : error ? (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => refreshTasks()}
              className="font-semibold underline ml-2 hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        ) : todayChecklist.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No active tasks. Create tasks in the Study Tasks tab to get started!
          </div>
        ) : (
          todayChecklist.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-2xl transition-all flex items-center justify-between gap-3.5 ${
                task.completed
                  ? 'clay-inset opacity-70'
                  : 'bg-white border border-white/80 shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.95),_4px_6px_16px_rgba(160,172,195,0.18)] hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    task.completed
                      ? 'clay-btn-emerald text-white'
                      : 'clay-inset hover:border-emerald-500'
                  }`}
                  aria-label={task.completed ? 'Mark task pending' : 'Mark task completed'}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-bold leading-snug truncate ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-slate-500 truncate">{task.subject}</span>
                    <span className="text-[11px] text-slate-300">•</span>
                    <span className="text-[11px] font-bold text-emerald-700">{task.estimatedMinutes}m</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={task.priority} />
                {!task.completed && (
                  <button
                    onClick={() => handleStartTaskTimer(task)}
                    className="clay-btn-white p-2 text-emerald-700 hover:text-emerald-900 rounded-xl transition-transform hover:scale-105"
                    title="Start focus timer on this task"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
