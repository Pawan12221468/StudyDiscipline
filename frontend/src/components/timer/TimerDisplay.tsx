import React from 'react';
import { useTimer } from '../../contexts/TimerContext';
import { formatMillisecondsToDisplay } from '../../utils/formatTime';
import { CheckCircle } from 'lucide-react';

export const TimerDisplay: React.FC = () => {
  const { timer, elapsedMs, remainingMs, progressPercent, isRunning, isPaused } = useTimer();

  const isStopwatch = timer.mode === 'stopwatch';
  const displayMs = isStopwatch ? elapsedMs : remainingMs;
  const time = formatMillisecondsToDisplay(displayMs);

  // SVG Circle Parameters for 3D Clay Dial (Enlarged for prominent timer card)
  const radius = 132;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // For countdown, strokeDashoffset decreases as progress increases
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-2 select-none">
      {/* Linked Task Pill (if any) */}
      {timer.taskTitle && (
        <div className="flex items-center justify-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-white/80 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),_2px_3px_6px_rgba(160,172,195,0.15)] max-w-xs truncate">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{timer.taskTitle}</span>
          </div>
        </div>
      )}

      {/* 3D Embossed Circular Clay Dial Plate (Enlarged) */}
      <div className="relative p-4 sm:p-5 rounded-full clay-dial-plate flex items-center justify-center">
        {/* Inner Dish with subtle sunken depth */}
        <div className="relative p-1.5 rounded-full bg-white/70 shadow-[inset_3px_3px_8px_rgba(150,165,190,0.22),_inset_-3px_-3px_8px_rgba(255,255,255,0.9)] flex items-center justify-center">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            {/* Background Sunken Ring */}
            <circle
              stroke="#e9e5dc"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Animated Puffy Clay Progress Ring */}
            <circle
              stroke="#10b981"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.3s ease',
                filter: 'drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.12))',
              }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>

          {/* Center Timer Digits & Status */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="timer-digits text-5xl sm:text-6xl font-black text-slate-800 tracking-tight leading-none drop-shadow-xs">
              {time.formatted}
            </div>

            <div className="mt-3 text-xs font-bold">
              {isRunning ? (
                <span className="text-emerald-700 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Focusing
                </span>
              ) : isPaused ? (
                <span className="text-amber-700 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 shadow-xs">
                  Paused
                </span>
              ) : (
                <span className="text-slate-400 font-semibold">Ready to Focus</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
