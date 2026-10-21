import React from 'react';
import { useTimer } from '../../contexts/TimerContext';
import { Button } from '../common/Button';
import { Play, Pause, RotateCcw, Check, SkipForward } from 'lucide-react';

export const TimerControls: React.FC = () => {
  const {
    timer,
    isRunning,
    isPaused,
    isIdle,
    start,
    pause,
    resume,
    reset,
    skipBreak,
    setShowFinishModal,
  } = useTimer();

  const isPomodoroBreak =
    timer.mode === 'pomodoro' &&
    (timer.pomodoroPhase === 'short_break' || timer.pomodoroPhase === 'long_break');

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md mx-auto pt-1 pb-0.5">
      {/* Primary Action Button: Start / Pause / Resume */}
      {isIdle && (
        <button
          onClick={start}
          className="clay-btn clay-btn-emerald px-8 py-3 rounded-2xl text-sm sm:text-base font-extrabold tracking-wide flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isPomodoroBreak ? 'Start Break' : 'Start Focus Session'}</span>
        </button>
      )}

      {isRunning && (
        <>
          <button
            onClick={pause}
            className="clay-btn clay-btn-amber px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pause</span>
          </button>

          <button
            onClick={() => setShowFinishModal(true)}
            className="clay-btn clay-btn-emerald px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Finish & Log</span>
          </button>
        </>
      )}

      {isPaused && (
        <>
          <button
            onClick={resume}
            className="clay-btn clay-btn-emerald px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>

          <button
            onClick={() => setShowFinishModal(true)}
            className="clay-btn clay-btn-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>Finish & Log</span>
          </button>
        </>
      )}

      {/* Reset Button (only shown when not idle or paused) */}
      {!isIdle && (
        <button
          onClick={reset}
          className="clay-btn clay-btn-coral px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm"
          title="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      )}

      {/* Skip Break Button for Pomodoro break */}
      {isPomodoroBreak && (
        <button
          onClick={skipBreak}
          className="clay-btn clay-btn-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-indigo-700 shadow-sm"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Skip Break</span>
        </button>
      )}
    </div>
  );
};
