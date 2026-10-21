import { z } from 'zod';

export const dailyGoalQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be formatted as YYYY-MM-DD' }),
});

export const updateDailyGoalSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be formatted as YYYY-MM-DD' }),
  targetMinutes: z
    .number()
    .int({ message: 'Target minutes must be an integer' })
    .min(1, { message: 'Daily target must be at least 1 minute' })
    .max(1440, { message: 'Daily target cannot exceed 1440 minutes (24 hours)' }),
});

export const streakQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be formatted as YYYY-MM-DD' })
    .optional(),
});

export type DailyGoalQueryInput = z.infer<typeof dailyGoalQuerySchema>;
export type UpdateDailyGoalInput = z.infer<typeof updateDailyGoalSchema>;
export type StreakQueryInput = z.infer<typeof streakQuerySchema>;
