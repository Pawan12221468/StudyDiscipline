import React from 'react';
import { useTimer } from '../../contexts/TimerContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Check, Flame } from 'lucide-react';

export const PomodoroCycleTracker: React.FC = () => {
  const { timer } = useTimer();
  const { settings } = useSettings();

  if (timer.mode !== 'pomodoro') return null;

  const totalCycles = settings.pomodoroLongBreakInterval;
  const currentInSet = timer.pomodoroCycles % totalCycles;

  return (
    <div className="flex items-center justify-between gap-1.5 px-3 py-2 rounded-2xl clay-card-sm w-full">
      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
        <span>Cycle {currentInSet + 1}/{totalCycles}</span>
      </div>

      {/* 4 3D Clay Pebbles */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalCycles }).map((_, index) => {
          const isDone = index < currentInSet;
          const isCurrent = index === currentInSet;
          return (
            <div
              key={index}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                isDone
                  ? 'clay-btn-emerald shadow-2xs scale-105'
                  : isCurrent
                  ? 'clay-btn-amber shadow-2xs animate-pulse ring-1.5 ring-amber-300'
                  : 'clay-inset text-slate-400'
              }`}
            >
              {isDone ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : index + 1}
            </div>
          );
        })}
      </div>

      <span className="text-[10px] font-extrabold text-emerald-700">
        {timer.pomodoroCycles} done
      </span>
    </div>
  );
};
