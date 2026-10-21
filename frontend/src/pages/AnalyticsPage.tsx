import React, { useState, useEffect, useCallback } from 'react';
import { MetricsSummary } from '../components/analytics/MetricsSummary';
import { WeeklyHoursChart } from '../components/analytics/WeeklyHoursChart';
import { GoalConsistencyGrid } from '../components/analytics/GoalConsistencyGrid';
import { Card } from '../components/common/Card';
import { ModeBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useSessions } from '../contexts/SessionContext';
import { useAuth } from '../contexts/AuthContext';
import {
  analyticsService,
  AnalyticsPeriod,
  AnalyticsOverview,
  DailyAnalyticsItem,
  ConsistencyAnalytics,
} from '../services/analyticsService';
import { formatDurationHuman, formatDateLabel, formatTimeOfDay } from '../utils/formatTime';
import { Trash2, RefreshCw, AlertCircle, Calendar, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, deleteSession, refreshSessions, hasRealSessions } = useSessions();
  const { isAuthenticated } = useAuth();

  const [period, setPeriod] = useState<AnalyticsPeriod>('week');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [dailyData, setDailyData] = useState<DailyAnalyticsItem[]>([]);
  const [consistency, setConsistency] = useState<ConsistencyAnalytics | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);

    try {
      const [overviewRes, dailyRes, consistencyRes] = await Promise.all([
        analyticsService.getOverview(period),
        analyticsService.getDaily(period),
        analyticsService.getConsistency('month'),
      ]);

      if (overviewRes?.overview) setOverview(overviewRes.overview);
      if (dailyRes?.daily) setDailyData(dailyRes.daily);
      if (consistencyRes?.consistency) setConsistency(consistencyRes.consistency);
    } catch (err: any) {
      console.warn('Could not load analytics:', err);
      setError(err.message || 'Unable to load real-data analytics from server.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, period]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData, sessions]);

  return (
    <div className="space-y-6">
      {/* Top Controls Row with Period Selector */}
      <div className="flex items-center justify-end gap-2.5">
          {/* Period Toggle */}
          <div className="flex items-center clay-inset p-1 rounded-2xl text-xs font-bold gap-1">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                period === 'week'
                  ? 'clay-btn-white !text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                period === 'month'
                  ? 'clay-btn-white !text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past 30 Days
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fetchAnalyticsData();
              refreshSessions();
            }}
            disabled={isLoading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>



      {/* Error alert with retry button */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchAnalyticsData}>
            Retry
          </Button>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <MetricsSummary overview={overview} isLoading={isLoading} />

      {/* Recharts Focus Hours Visualization */}
      <div className="w-full">
        <WeeklyHoursChart dailyData={dailyData} period={period} isLoading={isLoading} />
      </div>

      {/* 30-Day Consistency Heatmap Grid */}
      <GoalConsistencyGrid consistency={consistency} isLoading={isLoading} />

      {/* Detailed Sessions History Log */}
      <Card
        title="Complete Focus Log History"
        subtitle="Individual recorded study sessions synced with MongoDB Atlas"
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {sessions.length} sessions
          </span>
        }
      >
        <div className="overflow-x-auto">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              <p className="font-semibold text-slate-700 text-sm">No study sessions recorded yet.</p>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                Completed timer sessions are securely stored in MongoDB and will appear here in chronological order.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate('/timer')}
                className="mt-4"
                icon={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                Start First Session
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-1">Session Title</th>
                  <th className="pb-3">Mode</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Completed At</th>
                  <th className="pb-3 text-right pr-1">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sessions.map((session) => {
                  return (
                    <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-1 font-semibold text-slate-900 max-w-xs truncate">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{session.title}</span>
                            {session.isDemo && (
                              <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.2 rounded font-medium">
                                Demo
                              </span>
                            )}
                          </div>
                          {session.notes && (
                            <p className="text-[11px] font-normal text-slate-400 truncate mt-0.5">
                              {session.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <ModeBadge mode={session.mode} />
                      </td>
                      <td className="py-3 font-bold text-slate-800">
                        {formatDurationHuman(session.durationSeconds)}
                      </td>
                      <td className="py-3 text-slate-500">
                        {formatDateLabel(session.completedAt)} at {formatTimeOfDay(session.completedAt)}
                      </td>
                      <td className="py-3 text-right pr-1">
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this session log?')) {
                              deleteSession(session.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};
