import { z } from 'zod';

export const createSessionSchema = z.object({
  sessionType: z.enum(['stopwatch', 'countdown', 'pomodoro']),
  subject: z.string().trim().min(1, { message: 'Subject is required' }).max(50),
  title: z.string().trim().max(100).optional(),
  targetDurationSeconds: z.number().int().min(1).max(86400).optional(),
  pomodoroPhase: z.enum(['work', 'short_break', 'long_break']).optional(),
  pomodoroCycles: z.number().int().min(0).optional(),
  taskId: z.string().optional(),
});

export const monitoringSummarySchema = z.object({
  totalMonitoredSeconds: z.number().int().min(0),
  personPresentPercent: z.number().min(0).max(100),
  absenceIncidentCount: z.number().int().min(0),
  phoneVisibleCount: z.number().int().min(0),
});

export const finishSessionSchema = z.object({
  title: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
  monitoringSummary: monitoringSummarySchema.optional(),
});


export const sessionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  status: z.enum(['running', 'paused', 'completed', 'abandoned']).optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type FinishSessionInput = z.infer<typeof finishSessionSchema>;
export type SessionQueryInput = z.infer<typeof sessionQuerySchema>;
