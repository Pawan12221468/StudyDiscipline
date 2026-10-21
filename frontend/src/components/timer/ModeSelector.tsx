import React, { useState } from 'react';
import { useTimer } from '../../contexts/TimerContext';
import { TimerMode } from '../../types';
import { Zap, Clock, Hourglass, Sliders } from 'lucide-react';

export const ModeSelector: React.FC = () => {
  const { timer, setMode, setCountdownDuration, isRunning } = useTimer();
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const presets = [
    { label: '25m', minutes: 25 },
    { label: '50m', minutes: 50 },
    { label: '60m', minutes: 60 },
  ];

  const handlePresetClick = (minutes: number) => {
    if (isRunning) {
      if (!window.confirm('Switching modes will reset your currently active timer. Proceed?')) {
        return;
      }
    }
    setMode('countdown', minutes);
    setIsCustomOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMinutes > 0) {
      if (isRunning) {
        if (!window.confirm('Switching modes will reset your currently active timer. Proceed?')) {
          return;
        }
      }
      setCountdownDuration(customMinutes);
      setIsCustomOpen(false);
    }
  };

  const currentMinutes = Math.round(timer.targetSeconds / 60);

  return (
    <div className="w-full space-y-2.5">
      {/* Title Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
          Timer Mode
        </span>
        <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
          {timer.mode}
        </span>
      </div>

      {/* Primary Mode Tabs Well (Vertical 3D Clay Stack next to the Watch) */}
      <div className="p-1.5 clay-inset rounded-[24px] flex flex-col gap-1.5 w-full">
        {/* Pomodoro */}
        <button
          onClick={() => {
            if (isRunning && !window.confirm('Switching modes will reset your active timer. Proceed?')) return;
            setMode('pomodoro');
            setIsCustomOpen(false);
          }}
          className={`w-full py-2 px-3 rounded-[16px] text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
            timer.mode === 'pomodoro'
              ? 'clay-btn-white !text-emerald-900 shadow-sm scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 ${
                timer.mode === 'pomodoro'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200/60 text-slate-500'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <span>Pomodoro (25/5)</span>
          </div>
          {timer.mode === 'pomodoro' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shrink-0" />
          )}
        </button>

        {/* Countdown */}
        <button
          onClick={() => {
            if (isRunning && !window.confirm('Switching modes will reset your active timer. Proceed?')) return;
            setMode('countdown', 25);
            setIsCustomOpen(false);
          }}
          className={`w-full py-2 px-3 rounded-[16px] text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
            timer.mode === 'countdown'
              ? 'clay-btn-white !text-emerald-950 shadow-sm scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 ${
                timer.mode === 'countdown'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200/60 text-slate-500'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
            </div>
            <span>Countdown</span>
          </div>
          {timer.mode === 'countdown' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shrink-0" />
          )}
        </button>

        {/* Stopwatch */}
        <button
          onClick={() => {
            if (isRunning && !window.confirm('Switching modes will reset your active timer. Proceed?')) return;
            setMode('stopwatch');
            setIsCustomOpen(false);
          }}
          className={`w-full py-2 px-3 rounded-[16px] text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
            timer.mode === 'stopwatch'
              ? 'clay-btn-white !text-slate-900 shadow-sm scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 ${
                timer.mode === 'stopwatch'
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-slate-200/60 text-slate-500'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span>Stopwatch</span>
          </div>
          {timer.mode === 'stopwatch' && (
            <span className="w-2 h-2 rounded-full bg-slate-700 shadow-xs shrink-0" />
          )}
        </button>
      </div>

      {/* Countdown Presets & Custom Input (shown when Countdown mode is selected) */}
      {timer.mode === 'countdown' && (
        <div className="p-2.5 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-0.5">
            <span>Duration:</span>
            <span className="text-emerald-800 font-extrabold">{currentMinutes} min</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {presets.map((preset) => {
              const isSelected = !isCustomOpen && currentMinutes === preset.minutes;
              return (
                <button
                  key={preset.minutes}
                  onClick={() => handlePresetClick(preset.minutes)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'clay-btn clay-btn-emerald !text-white shadow-xs'
                      : 'clay-btn-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}

            <button
              onClick={() => setIsCustomOpen(!isCustomOpen)}
              className={`col-span-3 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isCustomOpen || (timer.mode === 'countdown' && !presets.some((p) => p.minutes === currentMinutes))
                  ? 'clay-btn clay-btn-emerald !text-white shadow-xs'
                  : 'clay-btn-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Custom ({currentMinutes}m)</span>
            </button>
          </div>

          {isCustomOpen && (
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 text-center text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  placeholder="Minutes"
                />
                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 pointer-events-none">min</span>
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-xs cursor-pointer"
              >
                Set
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
