import React from 'react';
import { useTimer } from '../../contexts/TimerContext';
import { STUDY_SUBJECTS } from '../../data/initialData';
import { X } from 'lucide-react';

export const SubjectPicker: React.FC = () => {
  const { timer, setSubject, unlinkTask } = useTimer();

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl">
        {STUDY_SUBJECTS.map((subj) => {
          const isSelected = timer.subject === subj.name;
          return (
            <button
              key={subj.id}
              onClick={() => setSubject(subj.name)}
              className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'clay-btn bg-white text-slate-900 border-2 !border-emerald-500 shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),_3px_4px_10px_rgba(16,185,129,0.22)] scale-[1.03]'
                  : 'clay-btn-white text-slate-600 hover:text-slate-900 hover:scale-[1.01]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shadow-xs shrink-0"
                style={{ backgroundColor: subj.color }}
              />
              <span>{subj.name}</span>
            </button>
          );
        })}
      </div>

      {timer.taskTitle && (
        <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs border border-slate-200/80">
          <span>Linked task: <strong>{timer.taskTitle}</strong></span>
          <button
            onClick={unlinkTask}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            title="Unlink task"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
