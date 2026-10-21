import { ObjectId } from 'mongodb';
import { sessionRepository } from './session.model';
import { goalRepository, DEFAULT_DAILY_GOAL_MINUTES } from './goal.model';
import { taskRepository } from './task.model';

export type AnalyticsPeriod = 'week' | 'month' | 'custom';

export interface ComparisonMetrics {
  previousFocusedSeconds: number;
  previousFocusedHours: number;
  percentChange: number; // e.g. +25.5 or -12.3
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
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
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

export interface GoalAnalyticsItem {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
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
  dayOfWeek: number; // 0 = Sun, 1 = Mon, etc.
  actualMinutes: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = 0m, 1 = 1-30m, 2 = 31-60m, 3 = 61-120m, 4 = >120m
}

export interface ConsistencyAnalytics {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  activeDays: number;
  totalDays: number;
  consistencyScore: number; // percentage of days with focused study
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  heatmap: ConsistencyHeatmapItem[];
}

// Known subject color map matching frontend theme
const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics': '#16a34a',
  'Physics': '#2563eb',
  'Computer Science': '#9333ea',
  'Chemistry': '#ea580c',
  'Literature': '#db2777',
  'History': '#ca8a04',
  'Biology': '#059669',
  'General Study': '#64748b',
  'Unassigned': '#94a3b8',
};

function resolveDateRange(period: AnalyticsPeriod, startInput?: string, endInput?: string) {
  const now = new Date();
  const todayStr = endInput || now.toISOString().split('T')[0];
  const endDate = new Date(`${todayStr}T23:59:59.999Z`);

  let startDate: Date;
  let numDays: number;

  if (period === 'week') {
    numDays = 7;
    startDate = new Date(`${todayStr}T00:00:00.000Z`);
    startDate.setUTCDate(startDate.getUTCDate() - 6);
  } else if (period === 'month') {
    numDays = 30;
    startDate = new Date(`${todayStr}T00:00:00.000Z`);
    startDate.setUTCDate(startDate.getUTCDate() - 29);
  } else {
    // Custom
    startDate = startInput ? new Date(`${startInput}T00:00:00.000Z`) : new Date(`${todayStr}T00:00:00.000Z`);
    numDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // Preceding period of equal length
  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime());
  prevStartDate.setUTCDate(prevStartDate.getUTCDate() - (numDays - 1));
  prevStartDate.setUTCHours(0, 0, 0, 0);

  return {
    startDate,
    endDate,
    startDateStr: startDate.toISOString().split('T')[0],
    endDateStr: todayStr,
    numDays,
    prevStartDate,
    prevEndDate,
  };
}

export class AnalyticsRepository {
  /**
   * Calculate high-level overview metrics with previous period comparison.
   */
  public async getOverview(
    userId: ObjectId,
    period: AnalyticsPeriod = 'week',
    startInput?: string,
    endInput?: string
  ): Promise<AnalyticsOverview> {
    const range = resolveDateRange(period, startInput, endInput);
    const sessionsCol = sessionRepository.getCollection();
    const goalsCol = goalRepository.getCollection();
    const tasksCol = taskRepository.getCollection();

    // 1. Fetch completed sessions in current period
    const currentSessions = await sessionsCol
      .find({
        userId,
        status: 'completed',
        completedAt: { $gte: range.startDate, $lte: range.endDate },
      })
      .toArray();

    // 2. Fetch completed sessions in previous period for comparison
    const previousSessions = await sessionsCol
      .find({
        userId,
        status: 'completed',
        completedAt: { $gte: range.prevStartDate, $lte: range.prevEndDate },
      })
      .toArray();

    // 3. Filter work intervals only
    const validCurrent = currentSessions.filter(
      (s) => !(s.sessionType === 'pomodoro' && s.pomodoroPhase && s.pomodoroPhase !== 'work')
    );
    const validPrev = previousSessions.filter(
      (s) => !(s.sessionType === 'pomodoro' && s.pomodoroPhase && s.pomodoroPhase !== 'work')
    );

    const totalFocusedSeconds = validCurrent.reduce(
      (acc, s) => acc + (s.durationSeconds || Math.floor((s.accumulatedDurationMs || 0) / 1000)),
      0
    );
    const totalFocusedHours = Math.round((totalFocusedSeconds / 3600) * 10) / 10;
    const totalSessions = validCurrent.length;

    // Determine active days
    const activeDatesSet = new Set<string>();
    const dateMinsMap = new Map<string, number>();

    for (const s of validCurrent) {
      if (s.completedAt) {
        const dStr = s.completedAt.toISOString().split('T')[0];
        activeDatesSet.add(dStr);
        const mins = Math.floor((s.durationSeconds || 0) / 60);
        dateMinsMap.set(dStr, (dateMinsMap.get(dStr) || 0) + mins);
      }
    }
    const activeDays = activeDatesSet.size;

    const totalMinutes = Math.floor(totalFocusedSeconds / 60);
    const avgDailyMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;
    const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    // Previous period comparison
    const prevSeconds = validPrev.reduce(
      (acc, s) => acc + (s.durationSeconds || Math.floor((s.accumulatedDurationMs || 0) / 1000)),
      0
    );
    const prevHours = Math.round((prevSeconds / 3600) * 10) / 10;
    const hoursDelta = Math.round((totalFocusedHours - prevHours) * 10) / 10;
    let percentChange = 0;
    if (prevSeconds > 0) {
      percentChange = Math.round(((totalFocusedSeconds - prevSeconds) / prevSeconds) * 1000) / 10;
    } else if (totalFocusedSeconds > 0) {
      percentChange = 100;
    }

    // Goals in current period
    const customGoals = await goalsCol
      .find({
        userId,
        date: { $gte: range.startDateStr, $lte: range.endDateStr },
      })
      .toArray();

    const goalMap = new Map<string, number>();
    for (const g of customGoals) {
      goalMap.set(g.date, g.targetMinutes);
    }

    let goalsAchievedDays = 0;
    activeDatesSet.forEach((dStr) => {
      const actualMins = dateMinsMap.get(dStr) || 0;
      const targetMins = goalMap.get(dStr) || DEFAULT_DAILY_GOAL_MINUTES;
      if (actualMins >= targetMins && actualMins > 0) {
        goalsAchievedDays++;
      }
    });

    const goalAchievementRate =
      activeDays > 0 ? Math.round((goalsAchievedDays / activeDays) * 100) : 0;

    // Streak calculation
    const streakResult = await goalRepository.calculateStreak(userId, range.endDateStr);

    // Tasks statistics
    const [tasksCompleted, tasksPending] = await Promise.all([
      tasksCol.countDocuments({ userId, status: 'completed' }),
      tasksCol.countDocuments({ userId, status: { $ne: 'completed' } }),
    ]);
    const totalTasks = tasksCompleted + tasksPending;
    const taskCompletionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    return {
      period,
      startDate: range.startDateStr,
      endDate: range.endDateStr,
      totalFocusedSeconds,
      totalFocusedHours,
      totalSessions,
      activeDays,
      avgDailyMinutes,
      avgSessionMinutes,
      goalAchievementRate,
      goalsAchievedDays,
      totalGoalDays: activeDays,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      tasksCompleted,
      tasksPending,
      taskCompletionRate,
      comparison: {
        previousFocusedSeconds: prevSeconds,
        previousFocusedHours: prevHours,
        percentChange,
        hoursDelta,
      },
    };
  }

  /**
   * Daily study activity breakdown for charts (Recharts bar chart).
   */
  public async getDailyBreakdown(
    userId: ObjectId,
    period: AnalyticsPeriod = 'week',
    startInput?: string,
    endInput?: string
  ): Promise<DailyAnalyticsItem[]> {
    const range = resolveDateRange(period, startInput, endInput);
    const sessionsCol = sessionRepository.getCollection();
    const goalsCol = goalRepository.getCollection();

    const [sessions, customGoals] = await Promise.all([
      sessionsCol
        .find({
          userId,
          status: 'completed',
          completedAt: { $gte: range.startDate, $lte: range.endDate },
        })
        .toArray(),
      goalsCol
        .find({
          userId,
          date: { $gte: range.startDateStr, $lte: range.endDateStr },
        })
        .toArray(),
    ]);

    const goalMap = new Map<string, number>();
    for (const g of customGoals) {
      goalMap.set(g.date, g.targetMinutes);
    }

    const dayMinsMap = new Map<string, number>();
    const daySessionsCountMap = new Map<string, number>();

    for (const s of sessions) {
      if (s.sessionType === 'pomodoro' && s.pomodoroPhase && s.pomodoroPhase !== 'work') {
        continue;
      }
      if (!s.completedAt) continue;
      const dStr = s.completedAt.toISOString().split('T')[0];
      const mins = Math.floor((s.durationSeconds || 0) / 60);

      dayMinsMap.set(dStr, (dayMinsMap.get(dStr) || 0) + mins);
      daySessionsCountMap.set(dStr, (daySessionsCountMap.get(dStr) || 0) + 1);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const items: DailyAnalyticsItem[] = [];

    const cursor = new Date(range.startDate.getTime());
    while (cursor <= range.endDate) {
      const dStr = cursor.toISOString().split('T')[0];
      const actualMins = dayMinsMap.get(dStr) || 0;
      const targetMins = goalMap.get(dStr) || DEFAULT_DAILY_GOAL_MINUTES;
      const sessionsCount = daySessionsCountMap.get(dStr) || 0;

      items.push({
        date: dStr,
        dayLabel: dayNames[cursor.getUTCDay()],
        actualHours: Math.round((actualMins / 60) * 10) / 10,
        actualMinutes: actualMins,
        targetHours: Math.round((targetMins / 60) * 10) / 10,
        targetMinutes: targetMins,
        sessionsCount,
        targetMet: actualMins >= targetMins && actualMins > 0,
      });

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return items;
  }

  /**
   * Subject distribution analysis (proportions, hours, counts, colors).
   * Missing/empty subjects are grouped into "Unassigned".
   */
  public async getSubjectDistribution(
    userId: ObjectId,
    period: AnalyticsPeriod = 'week',
    startInput?: string,
    endInput?: string
  ): Promise<SubjectAnalyticsItem[]> {
    const range = resolveDateRange(period, startInput, endInput);
    const sessionsCol = sessionRepository.getCollection();

    const sessions = await sessionsCol
      .find({
        userId,
        status: 'completed',
        completedAt: { $gte: range.startDate, $lte: range.endDate },
      })
      .toArray();

    const validSessions = sessions.filter(
      (s) => !(s.sessionType === 'pomodoro' && s.pomodoroPhase && s.pomodoroPhase !== 'work')
    );

    const subjectMap = new Map<string, { seconds: number; count: number }>();
    let totalSeconds = 0;

    for (const s of validSessions) {
      const subjectName = (s.subject && s.subject.trim()) || 'Unassigned';
      const durationSecs = s.durationSeconds || Math.floor((s.accumulatedDurationMs || 0) / 1000);

      const current = subjectMap.get(subjectName) || { seconds: 0, count: 0 };
      subjectMap.set(subjectName, {
        seconds: current.seconds + durationSecs,
        count: current.count + 1,
      });
      totalSeconds += durationSecs;
    }

    const items: SubjectAnalyticsItem[] = [];

    subjectMap.forEach((data, subjectName) => {
      const hours = Math.round((data.seconds / 3600) * 10) / 10;
      const percentage = totalSeconds > 0 ? Math.round((data.seconds / totalSeconds) * 100) : 0;
      const color = SUBJECT_COLORS[subjectName] || '#10b981';

      items.push({
        name: subjectName,
        seconds: data.seconds,
        hours,
        percentage,
        sessionsCount: data.count,
        color,
      });
    });

    return items.sort((a, b) => b.seconds - a.seconds);
  }

  /**
   * Goal achievement consistency analysis with heatmap levels.
   */
  public async getConsistency(
    userId: ObjectId,
    period: AnalyticsPeriod = 'month'
  ): Promise<ConsistencyAnalytics> {
    const range = resolveDateRange(period);
    const dailyItems = await this.getDailyBreakdown(userId, period);
    const streakResult = await goalRepository.calculateStreak(userId, range.endDateStr);

    let activeDays = 0;
    const heatmap: ConsistencyHeatmapItem[] = dailyItems.map((item) => {
      if (item.actualMinutes > 0) activeDays++;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (item.actualMinutes > 120) level = 4;
      else if (item.actualMinutes > 60) level = 3;
      else if (item.actualMinutes > 30) level = 2;
      else if (item.actualMinutes > 0) level = 1;

      const d = new Date(`${item.date}T00:00:00.000Z`);

      return {
        date: item.date,
        dayOfWeek: d.getUTCDay(),
        actualMinutes: item.actualMinutes,
        level,
      };
    });

    const totalDays = dailyItems.length;
    const consistencyScore = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

    return {
      period,
      startDate: range.startDateStr,
      endDate: range.endDateStr,
      activeDays,
      totalDays,
      consistencyScore,
      streak: {
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastActiveDate: streakResult.lastActiveDate,
      },
      heatmap,
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();
