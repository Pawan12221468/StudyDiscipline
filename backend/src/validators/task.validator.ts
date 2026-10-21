import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(150, { message: 'Title cannot exceed 150 characters' }),
  description: z
    .string()
    .trim()
    .max(2000, { message: 'Description cannot exceed 2000 characters' })
    .optional(),
  subject: z
    .string()
    .trim()
    .min(1, { message: 'Subject is required' })
    .max(50, { message: 'Subject cannot exceed 50 characters' }),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'], {
      errorMap: () => ({ message: 'Priority must be low, medium, high, or urgent' }),
    })
    .default('medium'),
  estimatedMinutes: z
    .number()
    .int({ message: 'Estimated minutes must be an integer' })
    .min(1, { message: 'Estimated duration must be at least 1 minute' })
    .max(720, { message: 'Estimated duration cannot exceed 720 minutes (12 hours)' })
    .default(30),
  dueDate: z
    .string()
    .trim()
    .max(50, { message: 'Due date label cannot exceed 50 characters' })
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000, { message: 'Notes cannot exceed 1000 characters' })
    .optional(),
  status: z
    .enum(['pending', 'in_progress', 'completed'])
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title cannot be empty' })
    .max(150, { message: 'Title cannot exceed 150 characters' })
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional(),
  subject: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .optional(),
  estimatedMinutes: z
    .number()
    .int()
    .min(1)
    .max(720)
    .optional(),
  dueDate: z
    .string()
    .trim()
    .max(50)
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional(),
  status: z
    .enum(['pending', 'in_progress', 'completed'])
    .optional(),
  completed: z
    .boolean()
    .optional(),
});

export const completeTaskSchema = z.object({
  completed: z.boolean().optional(),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'in_progress', 'completed', 'all']).optional(),
  subject: z.string().trim().max(50).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'all']).optional(),
  search: z.string().trim().max(100).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQueryInput = z.infer<typeof listTasksQuerySchema>;
