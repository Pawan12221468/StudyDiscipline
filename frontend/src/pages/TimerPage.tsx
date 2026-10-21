import React from 'react';
import { Card } from '../components/common/Card';
import { ModeSelector } from '../components/timer/ModeSelector';
import { TimerDisplay } from '../components/timer/TimerDisplay';
import { TimerControls } from '../components/timer/TimerControls';
import { PomodoroCycleTracker } from '../components/timer/PomodoroCycleTracker';
import { SessionFinishModal } from '../components/timer/SessionFinishModal';
import { FocusMonitorPanel } from '../components/timer/FocusMonitorPanel';
import { useTimer } from '../contexts/TimerContext';

export const TimerPage: React.FC = () => {
  const { timer } = useTimer();

  return (
    <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col h-full min-h-0">
      {/* 2 Side-by-Side Cards: Full height matching Sidebar and Daily Goal bottom */}
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-5 w-full flex-1 min-h-0 h-full">
        {/* Card 1: Left - Full Height Timer Watch & Controls Card */}
        <Card
          className="!rounded-[36px] sm:!rounded-[40px] flex-1 min-w-0 h-full min-h-0 flex flex-col justify-between shadow-xl border-2 border-white/90"
          bodyClassName="!p-5 sm:!p-6 flex flex-col items-center justify-between gap-4 h-full"
        >
          {/* Watch Dial */}
          <div className="w-full flex-1 flex items-center justify-center py-1 min-h-0">
            <TimerDisplay />
          </div>

          {/* Primary Controls at bottom of Timer Card */}
          <div className="pt-3 border-t border-slate-100/90 w-full flex justify-center shrink-0">
            <TimerControls />
          </div>
        </Card>

        {/* Card 2: Right - Full Height Mode Options & Focus Monitor Card */}
        <Card
          className="!rounded-[36px] sm:!rounded-[40px] w-full md:w-64 lg:w-68 h-full min-h-0 flex flex-col justify-between shrink-0 shadow-lg border-2 border-white/90"
          bodyClassName="!p-3.5 sm:!p-4 flex flex-col justify-between h-full overflow-hidden"
        >
          {/* Top Section: Mode Selection & Cycle Indicator */}
          <div className="space-y-2.5">
            <ModeSelector />

            {/* Pomodoro Cycle Indicator (if Pomodoro) */}
            {timer.mode === 'pomodoro' && (
              <div className="w-full">
                <PomodoroCycleTracker />
              </div>
            )}
          </div>

          {/* Bottom Section: Compact Focus Monitor docked at bottom */}
          <div className="mt-auto pt-2">
            <FocusMonitorPanel />
          </div>
        </Card>
      </div>

      {/* Modal for saving completed session */}
      <SessionFinishModal />
    </div>
  );
};
