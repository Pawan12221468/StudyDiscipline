import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StudyTask } from '../../types';
import { PriorityBadge } from '../common/Badge';
import { STUDY_SUBJECTS } from '../../data/initialData';
import { useTasks } from '../../contexts/TaskContext';
import { useTimer } from '../../contexts/TimerContext';
import { Check, Clock, Calendar, Edit2, Trash2, Play, FileText } from 'lucide-react';

interface TaskItemProps {
  task: StudyTask;
  onEdit: (task: StudyTask) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit }) => {
  const navigate = useNavigate();
  const { toggleTask, deleteTask } = useTasks();
  const { linkTask, start } = useTimer();

  const subject = STUDY_SUBJECTS.find((s) => s.name === task.subject);

  const handleStartTimer = () => {
    linkTask(task);
    start();
    navigate('/timer');
  };

  const handleDelete = () => {
    if (window.confirm(`Delete task "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-[24px] border-2 border-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        task.completed
          ? 'clay-inset opacity-70'
          : 'clay-card hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Checkbox */}
        <button
          onClick={() => toggleTask(task.id)}
          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 mt-0.5 cursor-pointer ${
            task.completed
              ? 'clay-btn-emerald text-white shadow-xs'
              : 'bg-[#f5efe4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.18),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] hover:scale-105'
          }`}
          aria-label={task.completed ? 'Mark pending' : 'Mark completed'}
        >
          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),_2px_3px_6px_rgba(0,0,0,0.06)]"
              style={{
                backgroundColor: `${subject?.color || '#10b981'}20`,
                color: subject?.color || '#10b981',
              }}
            >
              {task.subject}
            </span>
            <PriorityBadge priority={task.priority} />
            {task.isDemo && (
              <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-xs">
                Demo
              </span>
            )}
          </div>

          <h4
            className={`text-base font-bold leading-snug break-words ${
              task.completed ? 'line-through text-slate-400' : 'text-slate-900'
            }`}
          >
            {task.title}
          </h4>

          {task.notes && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 line-clamp-1 font-medium">
              <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>{task.notes}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-semibold">
            {task.estimatedMinutes > 0 && (
              <span className="flex items-center gap-1 text-emerald-700">
                <Clock className="w-3.5 h-3.5" />
                <span>{task.estimatedMinutes}m est.</span>
              </span>
            )}

            {task.dueDate && (
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Due: {task.dueDate}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
        {!task.completed && (
          <button
            onClick={handleStartTimer}
            className="clay-btn clay-btn-emerald px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            title="Start timer for this task"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Focus</span>
          </button>
        )}

        <button
          onClick={() => onEdit(task)}
          className="clay-btn-white p-2.5 text-slate-600 hover:text-slate-900 rounded-xl transition-transform hover:scale-105"
          title="Edit task"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleDelete}
          className="clay-btn-white p-2.5 text-slate-400 hover:text-rose-600 rounded-xl transition-transform hover:scale-105"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
