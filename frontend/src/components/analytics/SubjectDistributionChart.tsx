import React from 'react';
import { Card } from '../common/Card';
import { SubjectAnalyticsItem } from '../../services/analyticsService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface SubjectDistributionChartProps {
  subjects: SubjectAnalyticsItem[];
  isLoading?: boolean;
}

export const SubjectDistributionChart: React.FC<SubjectDistributionChartProps> = ({
  subjects,
  isLoading,
}) => {
  return (
    <Card
      title="Subject Breakdown"
      subtitle="Proportion of focus time invested across academic disciplines"
    >
      {isLoading && subjects.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading subjects distribution...
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No session data recorded yet for this period.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="h-60 w-60 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjects}
                  dataKey="seconds"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {subjects.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data: SubjectAnalyticsItem = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-800">
                          <p className="font-bold text-slate-200">{data.name}</p>
                          <p className="text-emerald-400 font-semibold">
                            {data.hours} hours ({data.percentage}%)
                          </p>
                          <p className="text-slate-400">{data.sessionsCount} sessions</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400 font-medium">Subjects</span>
              <span className="text-lg font-bold text-slate-800">{subjects.length}</span>
            </div>
          </div>

          {/* Breakdown Legend List */}
          <div className="flex-1 w-full space-y-2 max-h-60 overflow-y-auto pr-1">
            {subjects.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-md shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-slate-900">{item.hours}h</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
