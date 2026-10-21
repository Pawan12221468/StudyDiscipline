import { apiRequest } from './apiClient';

export type AnalyticsPeriod = 'week' | 'month';

export interface ComparisonMetrics {
  previousFocusedSeconds: number;
  previousFocusedHours: number;
  percentChange: number;
  hoursDelta: number;
}

export interface AnalyticsOverview {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  totalFocusedSeconds: number;
  totalFocusedHours: number;
  totalSessions: number;
  activeDays: number;
  avgDailyMinutes: number;
  avgSessionMinutes: number;
  goalAchievementRate: number;
  goalsAchievedDays: number;
  totalGoalDays: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompleted: number;
  tasksPending: number;
  taskCompletionRate: number;
  comparison: ComparisonMetrics;
}

export interface DailyAnalyticsItem {
  date: string;
  dayLabel: string;
  actualHours: number;
  actualMinutes: number;
  targetHours: number;
  targetMinutes: number;
  sessionsCount: number;
  targetMet: boolean;
}

export interface SubjectAnalyticsItem {
  name: string;
  seconds: number;
  hours: number;
  percentage: number;
  sessionsCount: number;
  color: string;
}

export interface GoalAnalyticsData {
  period: AnalyticsPeriod;
  totalDays: number;
  activeDays: number;
  goalsAchievedDays: number;
  achievementRate: number;
  dailyBreakdown: Array<{
    date: string;
    dayLabel: string;
    targetMinutes: number;
    actualMinutes: number;
    targetMet: boolean;
  }>;
}

export interface ConsistencyHeatmapItem {
  date: string;
  dayOfWeek: number;
  actualMinutes: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ConsistencyAnalytics {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  activeDays: number;
  totalDays: number;
  consistencyScore: number;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  heatmap: ConsistencyHeatmapItem[];
}

export const analyticsService = {
  /**
   * Get high-level analytics overview with previous period comparison
   */
  async getOverview(period: AnalyticsPeriod = 'week'): Promise<{ overview: AnalyticsOverview }> {
    return apiRequest<{ overview: AnalyticsOverview }>(`/analytics/overview?period=${period}`, {
      method: 'GET',
    });
  },

  /**
   * Get daily study breakdown for charts
   */
  async getDaily(period: AnalyticsPeriod = 'week'): Promise<{ daily: DailyAnalyticsItem[] }> {
    return apiRequest<{ daily: DailyAnalyticsItem[] }>(`/analytics/daily?period=${period}`, {
      method: 'GET',
    });
  },

  /**
   * Get subject distribution
   */
  async getSubjects(period: AnalyticsPeriod = 'week'): Promise<{ subjects: SubjectAnalyticsItem[] }> {
    return apiRequest<{ subjects: SubjectAnalyticsItem[] }>(`/analytics/subjects?period=${period}`, {
      method: 'GET',
    });
  },

  /**
   * Get goal achievement breakdown
   */
  async getGoals(period: AnalyticsPeriod = 'month'): Promise<{ goals: GoalAnalyticsData }> {
    return apiRequest<{ goals: GoalAnalyticsData }>(`/analytics/goals?period=${period}`, {
      method: 'GET',
    });
  },

  /**
   * Get consistency analytics and calendar heatmap
   */
  async getConsistency(period: AnalyticsPeriod = 'month'): Promise<{ consistency: ConsistencyAnalytics }> {
    return apiRequest<{ consistency: ConsistencyAnalytics }>(`/analytics/consistency?period=${period}`, {
      method: 'GET',
    });
  },
};
