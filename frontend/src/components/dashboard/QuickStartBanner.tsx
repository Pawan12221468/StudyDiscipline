import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { useTimer } from '../../contexts/TimerContext';
import { Play, Sparkles, Clock } from 'lucide-react';

export const QuickStartBanner: React.FC = () => {
  const navigate = useNavigate();
  const { isRunning, start, timer } = useTimer();

  const handleLaunch = () => {
    if (!isRunning) {
      start();
    }
    navigate('/timer');
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] clay-card-mint p-7 sm:p-9 text-slate-800 border-2 border-white">
      {/* Decorative clay spheres */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 rounded-full bg-emerald-200/40 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 rounded-full bg-emerald-300/30 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full clay-pill text-emerald-800 text-xs font-black mb-3.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Ready for Deep Study</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            Build discipline, one focused session at a time.
          </h2>
          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            Eliminate cognitive drift with timestamp-calibrated focus blocks. Track your target, master your subjects, and protect your study streak.
          </p>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleLaunch}
            className="clay-btn clay-btn-emerald px-8 py-4 rounded-2xl text-sm sm:text-base font-extrabold flex items-center justify-center gap-2.5 shadow-lg"
          >
            {isRunning ? <Clock className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 fill-current text-white" />}
            <span>{isRunning ? `Resume ${timer.subject} Timer` : 'Launch Focus Timer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
