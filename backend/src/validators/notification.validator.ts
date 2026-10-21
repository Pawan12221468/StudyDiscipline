import { z } from 'zod';

export const notificationPreferenceSchema = z.object({
  masterEnabled: z.boolean().default(true),
  studySessionReminders: z.boolean().default(true),
  dailyGoalReminders: z.boolean().default(true),
  taskDeadlineReminders: z.boolean().default(true),
  pomodoroBreakReminders: z.boolean().default(true),
  breakEndReminders: z.boolean().default(true),
  dailySummaryReminders: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
  browserNotificationsEnabled: z.boolean().default(false),
  quietHoursEnabled: z.boolean().default(true),
  quietHoursStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Quiet hours start must be in HH:MM 24-hour format' })
    .default('22:00'),
  quietHoursEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Quiet hours end must be in HH:MM 24-hour format' })
    .default('07:00'),
  preferredReminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Preferred reminder time must be in HH:MM 24-hour format' })
    .default('19:00'),
  timezone: z.string().min(1).max(100).default('UTC'),
});

export const updateNotificationPreferenceSchema = notificationPreferenceSchema.partial();

export const notificationTypeEnum = z.enum([
  'goal_reminder',
  'task_deadline',
  'session_reminder',
  'pomodoro_break',
  'break_end',
  'daily_summary',
  'system',
]);

export const createNotificationSchema = z.object({
  type: notificationTypeEnum,
  title: z.string().min(1, { message: 'Title is required' }).max(120),
  message: z.string().min(1, { message: 'Message is required' }).max(500),
  actionUrl: z.string().max(200).optional(),
  dedupKey: z.string().max(120).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
export type UpdateNotificationPreferenceInput = z.infer<typeof updateNotificationPreferenceSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
