import React from 'react';
import { Card } from '../common/Card';
import { ConsistencyAnalytics } from '../../services/analyticsService';
import { Flame, CheckCircle, Trophy } from 'lucide-react';

interface GoalConsistencyGridProps {
  consistency: ConsistencyAnalytics | null;
  isLoading?: boolean;
}

export const GoalConsistencyGrid: React.FC<GoalConsistencyGridProps> = ({
  consistency,
  isLoading,
}) => {
  if (isLoading || !consistency) {
    return (
      <Card title="Study Consistency & Goal Streak" subtitle="Daily focus momentum and consistency map">
        <div className="h-44 flex items-center justify-center text-xs text-slate-400">
          Loading consistency data...
        </div>
      </Card>
    );
  }

  const { consistencyScore, activeDays, totalDays, streak, heatmap } = consistency;

  const levelColorMap: Record<number, string> = {
    0: 'bg-slate-100 border-slate-200/50',
    1: 'bg-emerald-100 border-emerald-200 text-emerald-800',
    2: 'bg-emerald-300 border-emerald-400 text-emerald-900',
    3: 'bg-emerald-500 border-emerald-600 text-white',
    4: 'bg-emerald-700 border-emerald-800 text-white',
  };

  return (
    <Card
      title="Study Consistency & Goal Streak"
      subtitle="Track your daily study consistency and momentum over the past 30 days"
      action={
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{streak.currentStreak} day streak</span>
          </span>
          {streak.longestStreak > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/80">
              <Trophy className="w-3.5 h-3.5" />
              <span>Best: {streak.longestStreak}d</span>
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Consistency Stat Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Consistency Score: </span>
            <strong className="text-slate-900 text-sm font-extrabold">{consistencyScore}%</strong>
            <span className="text-slate-400 ml-1.5">
              ({activeDays} active days out of {totalDays})
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Less</span>
            <div className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-200" />
            <div className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-200" />
            <div className="w-3 h-3 rounded-xs bg-emerald-300 border border-emerald-400" />
            <div className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-600" />
            <div className="w-3 h-3 rounded-xs bg-emerald-700 border border-emerald-800" />
            <span>More</span>
          </div>
        </div>

        {/* 30-Day Heatmap Tiles Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
          {heatmap.map((item) => {
            const hasHours = item.actualMinutes > 0;
            return (
              <div
                key={item.date}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  levelColorMap[item.level]
                }`}
                title={`${item.date}: ${item.actualMinutes} mins focused`}
              >
                <span className="text-[10px] font-semibold opacity-70">
                  {item.date.split('-').slice(1).join('/')}
                </span>
                <span className="text-xs font-bold mt-0.5">
                  {hasHours ? `${item.actualMinutes}m` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
