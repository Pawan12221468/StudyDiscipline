import { ObjectId, Collection } from 'mongodb';
import { dbConnection } from '../config/database';
import { sessionRepository } from './session.model';

export interface DailyGoalDocument {
  _id: ObjectId;
  userId: ObjectId;
  date: string; // Format: YYYY-MM-DD
  targetMinutes: number; // Integer minutes (1 - 1440)
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicDailyGoal {
  id?: string;
  userId: string;
  date: string;
  targetMinutes: number;
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyProgressResult {
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
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  completedMinutes: number;
  targetMinutes: number;
  targetMet: boolean;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  weeklyLogs: StreakDaySummary[];
}

export const DEFAULT_DAILY_GOAL_MINUTES = 120; // 2 hours default

export class GoalRepository {
  private collectionName = 'daily_goals';

  public getCollection(): Collection<DailyGoalDocument> {
    const db = dbConnection.getDb();
    return db.collection<DailyGoalDocument>(this.collectionName);
  }

  public async ensureIndexes(): Promise<void> {
    try {
      const collection = this.getCollection();
      // Ensure one daily goal per user per calendar date
      await collection.createIndex(
        { userId: 1, date: 1 },
        { unique: true, name: 'uniq_user_goal_date' }
      );
    } catch (err) {
      console.warn('Notice: Could not ensure goal indexes:', (err as Error).message);
    }
  }

  /**
   * Find a daily goal by user and date. Returns null if not set.
   */
  public async findByDate(userId: ObjectId, date: string): Promise<DailyGoalDocument | null> {
    const collection = this.getCollection();
    return collection.findOne({ userId, date });
  }

  /**
   * Upsert a daily goal for a specific user and date.
   */
  public async upsert(userId: ObjectId, date: string, targetMinutes: number): Promise<DailyGoalDocument> {
    const collection = this.getCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          targetMinutes,
          updatedAt: now,
        },
        $setOnInsert: {
          _id: new ObjectId(),
          userId,
          date,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Failed to save daily goal.');
    }
    return result;
  }

  /**
   * Calculate daily study progress for a user and calendar date.
   * Derives focused study time strictly from completed Phase 4 sessions.
   * Excludes pauses, short/long breaks, and abandoned sessions.
   */
  public async calculateProgress(userId: ObjectId, date: string): Promise<DailyProgressResult> {
    const existingGoal = await this.findByDate(userId, date);
    const targetMinutes = existingGoal ? existingGoal.targetMinutes : DEFAULT_DAILY_GOAL_MINUTES;
    const isCustomGoal = !!existingGoal;

    // Define UTC date range boundaries for date string: YYYY-MM-DD
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const sessionsCollection = sessionRepository.getCollection();

    // Query completed sessions strictly scoped to user and date
    const completedSessions = await sessionsCollection
      .find({
        userId,
        status: 'completed',
        completedAt: { $gte: startOfDay, $lte: endOfDay },
      })
      .toArray();

    // Filter to count only focused study time (excluding pomodoro breaks)
    let totalFocusedSeconds = 0;
    let validSessionsCount = 0;

    for (const session of completedSessions) {
      // Exclude breaks if pomodoro phase is break
      if (session.sessionType === 'pomodoro' && session.pomodoroPhase && session.pomodoroPhase !== 'work') {
        continue;
      }
      totalFocusedSeconds += session.durationSeconds || Math.floor((session.accumulatedDurationMs || 0) / 1000);
      validSessionsCount++;
    }

    const completedMinutes = Math.floor(totalFocusedSeconds / 60);
    const remainingMinutes = Math.max(0, targetMinutes - completedMinutes);
    const progressPercent = targetMinutes > 0 ? Math.min(100, Math.round((completedMinutes / targetMinutes) * 100)) : 0;
    const isTargetMet = completedMinutes >= targetMinutes;

    return {
      date,
      targetMinutes,
      completedMinutes,
      completedSeconds: totalFocusedSeconds,
      remainingMinutes,
      progressPercent,
      isTargetMet,
      isCustomGoal,
      sessionsCount: validSessionsCount,
    };
  }

  /**
   * Calculate consecutive daily streak and 7-day log idempotently.
   * Criterion: Achieving the daily target on that calendar date.
   * If today is in progress, the active streak from yesterday is preserved.
   */
  public async calculateStreak(userId: ObjectId, clientTodayStr?: string): Promise<StreakResult> {
    const todayStr = clientTodayStr || new Date().toISOString().split('T')[0];
    const sessionsCollection = sessionRepository.getCollection();
    const goalsCollection = this.getCollection();

    // Look back up to 60 days
    const lookbackDate = new Date(`${todayStr}T00:00:00.000Z`);
    lookbackDate.setUTCDate(lookbackDate.getUTCDate() - 60);

    // Fetch all completed work sessions and custom goals in lookback window
    const [sessions, customGoals] = await Promise.all([
      sessionsCollection
        .find({
          userId,
          status: 'completed',
          completedAt: { $gte: lookbackDate },
        })
        .toArray(),
      goalsCollection
        .find({
          userId,
          date: { $gte: lookbackDate.toISOString().split('T')[0] },
        })
        .toArray(),
    ]);

    // Map custom targets by date
    const goalMap = new Map<string, number>();
    for (const g of customGoals) {
      goalMap.set(g.date, g.targetMinutes);
    }

    // Aggregate focused minutes by calendar date
    const dailyMinutesMap = new Map<string, number>();
    for (const s of sessions) {
      if (s.sessionType === 'pomodoro' && s.pomodoroPhase && s.pomodoroPhase !== 'work') {
        continue;
      }
      if (!s.completedAt) continue;
      const dateKey = s.completedAt.toISOString().split('T')[0];
      const mins = Math.floor((s.durationSeconds || 0) / 60);
      dailyMinutesMap.set(dateKey, (dailyMinutesMap.get(dateKey) || 0) + mins);
    }

    // Determine target met status for each day
    const isDayTargetMet = (dateKey: string): boolean => {
      const actualMins = dailyMinutesMap.get(dateKey) || 0;
      const targetMins = goalMap.get(dateKey) || DEFAULT_DAILY_GOAL_MINUTES;
      return actualMins >= targetMins && actualMins > 0;
    };

    // Calculate current streak
    let currentStreak = 0;
    let lastActiveDate: string | null = null;

    // Check today
    const todayMet = isDayTargetMet(todayStr);
    const cursorDate = new Date(`${todayStr}T00:00:00.000Z`);

    if (todayMet) {
      currentStreak++;
      lastActiveDate = todayStr;
      cursorDate.setUTCDate(cursorDate.getUTCDate() - 1);
    } else {
      // If today not yet met, check yesterday
      cursorDate.setUTCDate(cursorDate.getUTCDate() - 1);
      const yesterdayStr = cursorDate.toISOString().split('T')[0];
      if (isDayTargetMet(yesterdayStr)) {
        lastActiveDate = yesterdayStr;
      }
    }

    // Traverse backwards
    while (true) {
      const dateKey = cursorDate.toISOString().split('T')[0];
      if (isDayTargetMet(dateKey)) {
        currentStreak++;
        if (!lastActiveDate) lastActiveDate = dateKey;
        cursorDate.setUTCDate(cursorDate.getUTCDate() - 1);
      } else {
        break;
      }
    }

    // Compute longest streak in lookback range
    let longestStreak = currentStreak;
    let tempStreak = 0;
    const allDates = Array.from(
      new Set([...dailyMinutesMap.keys(), ...goalMap.keys()])
    ).sort();

    if (allDates.length > 0) {
      const scanDate = new Date(`${allDates[0]}T00:00:00.000Z`);
      const endDate = new Date(`${todayStr}T00:00:00.000Z`);

      while (scanDate <= endDate) {
        const key = scanDate.toISOString().split('T')[0];
        if (isDayTargetMet(key)) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
        scanDate.setUTCDate(scanDate.getUTCDate() + 1);
      }
    }

    // Generate 7-day weekly status for dashboard indicators
    const weeklyLogs: StreakDaySummary[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(`${todayStr}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const completedMinutes = dailyMinutesMap.get(dateStr) || 0;
      const targetMinutes = goalMap.get(dateStr) || DEFAULT_DAILY_GOAL_MINUTES;

      weeklyLogs.push({
        date: dateStr,
        dayLabel: dayNames[d.getUTCDay()],
        completedMinutes,
        targetMinutes,
        targetMet: completedMinutes >= targetMinutes && completedMinutes > 0,
      });
    }

    return {
      currentStreak,
      longestStreak,
      lastActiveDate,
      weeklyLogs,
    };
  }
}

export const goalRepository = new GoalRepository();
