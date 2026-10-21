import { Request, Response, NextFunction } from 'express';
import { analyticsRepository } from '../models/analytics.model';
import { analyticsQuerySchema } from '../validators/analytics.validator';

/**
 * Retrieve high-level analytics overview with previous period comparison
 * GET /api/analytics/overview?period=week|month&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = analyticsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid analytics query parameters',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const { period, startDate, endDate } = parseResult.data;
    const userId = req.user!._id;

    const overview = await analyticsRepository.getOverview(userId, period, startDate, endDate);
    res.status(200).json({ overview });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve daily study time breakdown for charting
 * GET /api/analytics/daily?period=week|month&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function getDaily(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = analyticsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid analytics query parameters',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const { period, startDate, endDate } = parseResult.data;
    const userId = req.user!._id;

    const daily = await analyticsRepository.getDailyBreakdown(userId, period, startDate, endDate);
    res.status(200).json({ daily });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve subject-wise study duration and percentages
 * GET /api/analytics/subjects?period=week|month&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function getSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = analyticsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid analytics query parameters',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const { period, startDate, endDate } = parseResult.data;
    const userId = req.user!._id;

    const subjects = await analyticsRepository.getSubjectDistribution(userId, period, startDate, endDate);
    res.status(200).json({ subjects });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve goal achievement statistics and breakdown
 * GET /api/analytics/goals?period=week|month
 */
export async function getGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const period = (req.query.period as any) === 'week' ? 'week' : 'month';
    const userId = req.user!._id;

    const dailyBreakdown = await analyticsRepository.getDailyBreakdown(userId, period);
    let goalsAchievedDays = 0;
    let activeDays = 0;

    dailyBreakdown.forEach((item) => {
      if (item.actualMinutes > 0) {
        activeDays++;
        if (item.targetMet) goalsAchievedDays++;
      }
    });

    const achievementRate = activeDays > 0 ? Math.round((goalsAchievedDays / activeDays) * 100) : 0;

    res.status(200).json({
      goals: {
        period,
        totalDays: dailyBreakdown.length,
        activeDays,
        goalsAchievedDays,
        achievementRate,
        dailyBreakdown: dailyBreakdown.map((d) => ({
          date: d.date,
          dayLabel: d.dayLabel,
          targetMinutes: d.targetMinutes,
          actualMinutes: d.actualMinutes,
          targetMet: d.targetMet,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve consistency analysis with calendar heatmap and streak
 * GET /api/analytics/consistency?period=week|month
 */
export async function getConsistency(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const period = (req.query.period as any) === 'week' ? 'week' : 'month';
    const userId = req.user!._id;

    const consistency = await analyticsRepository.getConsistency(userId, period);
    res.status(200).json({ consistency });
  } catch (error) {
    next(error);
  }
}
