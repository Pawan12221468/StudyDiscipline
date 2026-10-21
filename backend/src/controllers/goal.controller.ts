import { Request, Response, NextFunction } from 'express';
import {
  goalRepository,
  DEFAULT_DAILY_GOAL_MINUTES,
} from '../models/goal.model';
import {
  dailyGoalQuerySchema,
  updateDailyGoalSchema,
  streakQuerySchema,
} from '../validators/goal.validator';

/**
 * Retrieve the daily study goal for a specific date
 * GET /api/goals/daily?date=YYYY-MM-DD
 */
export async function getDailyGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = dailyGoalQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid date parameter',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const { date } = parseResult.data;
    const userId = req.user!._id;

    const goalDoc = await goalRepository.findByDate(userId, date);

    if (goalDoc) {
      res.status(200).json({
        goal: {
          id: goalDoc._id.toString(),
          userId: goalDoc.userId.toString(),
          date: goalDoc.date,
          targetMinutes: goalDoc.targetMinutes,
          isCustom: true,
          createdAt: goalDoc.createdAt.toISOString(),
          updatedAt: goalDoc.updatedAt.toISOString(),
        },
      });
    } else {
      res.status(200).json({
        goal: {
          userId: userId.toString(),
          date,
          targetMinutes: DEFAULT_DAILY_GOAL_MINUTES,
          isCustom: false,
        },
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Configure or update the daily study goal for a calendar date
 * PUT /api/goals/daily
 */
export async function updateDailyGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = updateDailyGoalSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid goal data',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const { date, targetMinutes } = parseResult.data;
    const userId = req.user!._id;

    const saved = await goalRepository.upsert(userId, date, targetMinutes);

    res.status(200).json({
      message: 'Daily study goal updated successfully',
      goal: {
        id: saved._id.toString(),
        userId: saved.userId.toString(),
        date: saved.date,
        targetMinutes: saved.targetMinutes,
        isCustom: true,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get daily study progress for a specific calendar date
 * GET /api/goals/daily/progress?date=YYYY-MM-DD
 */
export async function getDailyProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dateInput = req.query.date || new Date().toISOString().split('T')[0];
    const parseResult = dailyGoalQuerySchema.safeParse({ date: dateInput });
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid date parameter',
        status: 400,
      });
      return;
    }

    const { date } = parseResult.data;
    const userId = req.user!._id;

    const progress = await goalRepository.calculateProgress(userId, date);

    res.status(200).json({ progress });
  } catch (error) {
    next(error);
  }
}

/**
 * Get calculated streak and 7-day progress logs
 * GET /api/goals/streak
 */
export async function getStreak(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = streakQuerySchema.safeParse(req.query);
    const clientDate = parseResult.success ? parseResult.data.date : undefined;

    const userId = req.user!._id;
    const streak = await goalRepository.calculateStreak(userId, clientDate);

    res.status(200).json({ streak });
  } catch (error) {
    next(error);
  }
}
