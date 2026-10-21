import { apiRequest } from './apiClient';

export interface DailyGoal {
  id?: string;
  userId: string;
  date: string;
  targetMinutes: number;
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyProgress {
  date: string;
  targetMinutes: number;
  completedMinutes: number;
  completedSeconds: number;
  remainingMinutes: number;
  progressPercent: number;
  isTargetMet: boolean;
  isCustomGoal: boolean;
  sessionsCount: number;
}

export interface StreakDaySummary {
  date: string;
  dayLabel: string;
  completedMinutes: number;
  targetMinutes: number;
  targetMet: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  weeklyLogs: StreakDaySummary[];
}

export const goalService = {
  /**
   * Get the daily study goal for a date (defaults to today)
   */
  async getDailyGoal(date?: string): Promise<{ goal: DailyGoal }> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return apiRequest<{ goal: DailyGoal }>(`/goals/daily?date=${targetDate}`, {
      method: 'GET',
    });
  },

  /**
   * Configure or update the daily study goal in minutes
   */
  async updateDailyGoal(date: string, targetMinutes: number): Promise<{ message: string; goal: DailyGoal }> {
    return apiRequest<{ message: string; goal: DailyGoal }>('/goals/daily', {
      method: 'PUT',
      body: JSON.stringify({ date, targetMinutes }),
    });
  },

  /**
   * Get daily study progress for a calendar date
   */
  async getDailyProgress(date?: string): Promise<{ progress: DailyProgress }> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return apiRequest<{ progress: DailyProgress }>(`/goals/daily/progress?date=${targetDate}`, {
      method: 'GET',
    });
  },

  /**
   * Get consecutive streak count and 7-day log history
   */
  async getStreak(date?: string): Promise<{ streak: StreakData }> {
    const query = date ? `?date=${date}` : '';
    return apiRequest<{ streak: StreakData }>(`/goals/streak${query}`, {
      method: 'GET',
    });
  },
};
