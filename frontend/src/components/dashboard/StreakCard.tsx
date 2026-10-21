import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { useSessions } from '../../contexts/SessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { goalService, StreakData } from '../../services/goalService';
import { Flame, CheckCircle2 } from 'lucide-react';
import { DemoDataBanner } from '../common/DemoDataBanner';

export const StreakCard: React.FC = () => {
  const { streakDays, weeklyLogs, hasRealSessions } = useSessions();
  const { isAuthenticated } = useAuth();

  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadStreak() {
      if (!isAuthenticated) return;
      try {
        setIsLoading(true);
        const res = await goalService.getStreak();
        if (res?.streak) {
          setStreakData(res.streak);
        }
      } catch (err) {
        console.warn('Could not fetch streak data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStreak();
  }, [isAuthenticated, hasRealSessions]);

  // Use real backend streak count if available, or session context calculation
  const currentStreak = streakData ? streakData.currentStreak : streakDays;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wider">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Study Streak</span>
        </div>
        {!hasRealSessions && <DemoDataBanner compact />}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {currentStreak}
        </span>
        <span className="text-sm font-semibold text-slate-600">
          {currentStreak === 1 ? 'Day Active' : 'Days Active'}
        </span>
        <span className="text-lg">🔥</span>
      </div>

      {/* 7-day tactile clay indicators */}
      <div className="grid grid-cols-7 gap-2.5 mb-3.5">
        {streakData?.weeklyLogs
          ? streakData.weeklyLogs.map((log) => (
              <div key={log.date} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                    log.targetMet
                      ? 'clay-btn-emerald text-white font-extrabold shadow-sm'
                      : log.completedMinutes > 0
                      ? 'clay-btn-amber text-white font-extrabold shadow-sm'
                      : 'clay-inset text-slate-400 font-medium'
                  }`}
                  title={`${log.dayLabel} (${log.date}): ${log.completedMinutes}m / ${log.targetMinutes}m target`}
                >
                  {log.targetMet ? (
                    <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
                  ) : log.completedMinutes > 0 ? (
                    <span className="text-[10px] font-black">{log.completedMinutes}m</span>
                  ) : (
                    <span className="text-xs font-bold">·</span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-500">{log.dayLabel}</span>
              </div>
            ))
          : weeklyLogs.map((log) => {
              const hasStudied = log.actualHours > 0;
              return (
                <div key={log.date} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                      hasStudied
                        ? 'clay-btn-emerald text-white font-extrabold shadow-sm'
                        : 'clay-inset text-slate-400 font-medium'
                    }`}
                    title={`${log.dayLabel} (${log.date}): ${log.actualHours}h studied`}
                  >
                    {hasStudied ? <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" /> : <span className="text-xs font-bold">·</span>}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{log.dayLabel}</span>
                </div>
              );
            })}
      </div>

      <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">
        {streakData?.longestStreak && streakData.longestStreak > 0
          ? `Best streak: ${streakData.longestStreak} days. Keep the momentum going!`
          : 'Achieve your daily study target to build and maintain your streak.'}
      </p>
    </Card>
  );
};
