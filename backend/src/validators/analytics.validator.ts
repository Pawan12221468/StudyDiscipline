import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'custom']).default('week'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be in format YYYY-MM-DD' })
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be in format YYYY-MM-DD' })
    .optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (start > end) return false;
      // Maximum range limit: 90 days
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 90) return false;
    }
    return true;
  },
  {
    message: 'startDate must be before or equal to endDate and range cannot exceed 90 days',
    path: ['startDate'],
  }
);

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
