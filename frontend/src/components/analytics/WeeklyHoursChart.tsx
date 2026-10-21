import React from 'react';
import { Card } from '../common/Card';
import { DailyAnalyticsItem, AnalyticsPeriod } from '../../services/analyticsService';
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

interface WeeklyHoursChartProps {
  dailyData: DailyAnalyticsItem[];
  period: AnalyticsPeriod;
  isLoading?: boolean;
}

export const WeeklyHoursChart: React.FC<WeeklyHoursChartProps> = ({ dailyData, period, isLoading }) => {
  const chartTitle = period === 'week' ? 'Daily Focus Hours (Past 7 Days)' : 'Daily Focus Hours (Past 30 Days)';
  const defaultTargetHours = 2;

  return (
    <Card
      title={chartTitle}
      subtitle="Actual verified focused study time compared against daily targets"
    >
      <div className="h-72 w-full pt-2">
        {isLoading && dailyData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Loading chart data...
          </div>
        ) : dailyData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No study sessions recorded in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 22, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                unit="h"
                domain={[0, (dataMax: number) => Math.max(dataMax, Math.ceil(defaultTargetHours * 1.25))]}
                allowDataOverflow={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data: DailyAnalyticsItem = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800">
                        <p className="font-bold text-slate-200">
                          {data.dayLabel} • {data.date}
                        </p>
                        <p className="text-emerald-400 font-semibold mt-1">
                          {data.actualHours} hrs studied ({data.actualMinutes}m)
                        </p>
                        <p className="text-slate-400">Target: {data.targetHours} hrs ({data.targetMinutes}m)</p>
                        <p className="text-slate-400">Sessions logged: {data.sessionsCount}</p>
                        {data.targetMet && (
                          <span className="inline-block mt-1 text-[10px] text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.5 rounded">
                            Target Achieved 🎉
                          </span>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={defaultTargetHours}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: `Target (${defaultTargetHours}h)`,
                  position: 'top',
                  fill: '#64748b',
                  fontSize: 10,
                }}
              />
              <Bar
                dataKey="actualHours"
                fill="#16a34a"
                radius={[5, 5, 0, 0]}
                maxBarSize={period === 'week' ? 44 : 14}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
            <span className="font-medium text-slate-700">Actual Focus Hours</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-400" />
            <span className="text-slate-600">Daily Target Line</span>
          </span>
        </div>
        <span className="text-slate-400">Derived strictly from completed study sessions</span>
      </div>
    </Card>
  );
};
