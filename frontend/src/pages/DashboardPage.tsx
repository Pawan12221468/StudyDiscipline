import React from 'react';
import { QuickStartBanner } from '../components/dashboard/QuickStartBanner';
import { DailyFocusMetric } from '../components/dashboard/DailyFocusMetric';
import { StreakCard } from '../components/dashboard/StreakCard';
import { TodayChecklist } from '../components/dashboard/TodayChecklist';
import { WeeklyChartCard } from '../components/dashboard/WeeklyChartCard';
import { RecentSessionsList } from '../components/dashboard/RecentSessionsList';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <QuickStartBanner />

      {/* Top Metrics Row: Today's Focus & 7-Day Streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DailyFocusMetric />
        <StreakCard />
      </div>

      {/* Middle Grid: Weekly Activity Chart & Today's Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WeeklyChartCard />
        <TodayChecklist />
      </div>

      {/* Bottom Row: Recent Study Sessions */}
      <RecentSessionsList />
    </div>
  );
};
