import React from 'react';
import { AnalyticsOverview } from '../../services/analyticsService';
import { formatDurationHuman } from '../../utils/formatTime';
import { Clock, Calendar, Award, TrendingUp, TrendingDown, Target, Layers } from 'lucide-react';

interface MetricsSummaryProps {
  overview: AnalyticsOverview | null;
  isLoading?: boolean;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ overview, isLoading }) => {
  if (isLoading || !overview) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs animate-pulse">
            <div className="h-3 w-20 bg-slate-100 rounded mb-3" />
            <div className="h-7 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-2.5 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalFocusedSeconds,
    totalFocusedHours,
    totalSessions,
    activeDays,
    avgDailyMinutes,
    avgSessionMinutes,
    goalAchievementRate,
    goalsAchievedDays,
    totalGoalDays,
    comparison,
    period,
  } = overview;

  const periodLabel = period === 'week' ? 'last week' : 'last month';
  const isPositiveChange = comparison.percentChange >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Focus Time with Comparison Badge */}
      <div className="clay-card-mint p-4 sm:p-5 rounded-[26px] border-2 border-white flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Focus Time</span>
            <Clock className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
            {totalFocusedHours}h
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <span className="text-[11px] text-emerald-800 font-bold">
            {formatDurationHuman(totalFocusedSeconds)}
          </span>
          {comparison.previousFocusedSeconds > 0 && (
            <span
              className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full ${
                isPositiveChange
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'bg-white text-rose-700 shadow-xs'
              }`}
              title={`${comparison.hoursDelta >= 0 ? '+' : ''}${comparison.hoursDelta}h vs ${periodLabel}`}
            >
              {isPositiveChange ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              <span>{Math.abs(comparison.percentChange)}%</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Active Days */}
      <div className="clay-card-sky p-4 sm:p-5 rounded-[26px] border-2 border-white flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-sky-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Study Days</span>
            <Calendar className="w-4 h-4 text-sky-600 stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-950 tracking-tight">
            {activeDays} <span className="text-sm font-bold text-sky-600 font-normal">/ {period === 'week' ? '7' : '30'}</span>
          </div>
        </div>
        <div className="mt-2.5 text-[11px] text-sky-800 font-bold flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>{totalSessions} focus blocks completed</span>
        </div>
      </div>

      {/* 3. Daily & Session Average */}
      <div className="clay-card-peach p-4 sm:p-5 rounded-[26px] border-2 border-white flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-rose-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Daily Focus</span>
            <Award className="w-4 h-4 text-rose-600 stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
            {avgDailyMinutes}m
          </div>
        </div>
        <div className="mt-2.5 text-[11px] text-rose-800 font-bold">
          Avg block: <strong className="text-rose-950 font-black">{avgSessionMinutes}m</strong>
        </div>
      </div>

      {/* 4. Goal Achievement Rate */}
      <div className="clay-card-lavender p-4 sm:p-5 rounded-[26px] border-2 border-white flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-purple-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Goal Achievement</span>
            <Target className="w-4 h-4 text-purple-600 stroke-[2.5]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">
            {goalAchievementRate}%
          </div>
        </div>
        <div className="mt-2.5 text-[11px] text-purple-800 font-bold">
          Target met on <strong className="text-purple-950 font-black">{goalsAchievedDays}</strong> of {totalGoalDays} days
        </div>
      </div>
    </div>
  );
};
