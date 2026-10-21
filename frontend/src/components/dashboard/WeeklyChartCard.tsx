import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { useSessions } from '../../contexts/SessionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService, DailyAnalyticsItem } from '../../services/analyticsService';
import { DemoDataBanner } from '../common/DemoDataBanner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export const WeeklyChartCard: React.FC = () => {
  const { weeklyLogs, hasRealSessions } = useSessions();
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();

  const [realDaily, setRealDaily] = useState<DailyAnalyticsItem[] | null>(null);

  useEffect(() => {
    async function fetchWeeklyActivity() {
      if (!isAuthenticated) return;
      try {
        const res = await analyticsService.getDaily('week');
        if (res?.daily && Array.isArray(res.daily)) {
          setRealDaily(res.daily);
        }
      } catch (err) {
        console.warn('Could not fetch real weekly activity chart:', err);
      }
    }

    fetchWeeklyActivity();
  }, [isAuthenticated, hasRealSessions]);

  const chartData = realDaily || weeklyLogs;

  return (
    <Card
      title="Weekly Study Activity"
      subtitle="Daily study hours compared against your target"
      action={!hasRealSessions ? <DemoDataBanner compact /> : undefined}
      className="col-span-full lg:col-span-2"
    >
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 22, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              unit="h"
              domain={[0, (dataMax: number) => Math.max(dataMax, Math.ceil(settings.dailyTargetHours * 1.25))]}
              allowDataOverflow={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="clay-card !p-3 !rounded-2xl text-xs shadow-xl border border-white">
                      <p className="font-extrabold text-slate-800 mb-1">{data.dayLabel} ({data.date})</p>
                      <p className="text-emerald-700 font-bold">{data.actualHours} hours studied</p>
                      <p className="text-slate-500 font-medium">Target: {data.targetHours} hours</p>
                      <p className="text-slate-400">Sessions: {data.sessionsCount}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={settings.dailyTargetHours}
              stroke="#cbd5e1"
              strokeDasharray="4 4"
              label={{
                value: `Target ${settings.dailyTargetHours}h`,
                position: 'top',
                fill: '#64748b',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            <Bar
              dataKey="actualHours"
              fill="#10b981"
              radius={[12, 12, 4, 4]}
              maxBarSize={42}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
            <span>Actual Study Hours</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-400" />
            <span>Target Line ({settings.dailyTargetHours}h)</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">Past 7 Days</span>
      </div>
    </Card>
  );
};
