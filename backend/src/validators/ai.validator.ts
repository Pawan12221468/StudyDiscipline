import { z } from 'zod';

export const coachMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, { message: 'Message is required' })
    .max(1000, { message: 'Message cannot exceed 1000 characters' }),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string().trim().max(2000),
      })
    )
    .max(10)
    .optional(),
});

export const studyPlanInputSchema = z.object({
  availableMinutes: z
    .number()
    .int({ message: 'Available minutes must be an integer' })
    .min(30, { message: 'Available study time must be at least 30 minutes' })
    .max(720, { message: 'Available study time cannot exceed 720 minutes (12 hours)' }),
  preferredStartTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'preferredStartTime must be in HH:MM format (e.g. 09:00)' })
    .optional(),
  preferredEndTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'preferredEndTime must be in HH:MM format (e.g. 17:00)' })
    .optional(),
  focusSubjects: z
    .array(z.string().trim().max(50))
    .max(5)
    .optional(),
});

export const chatHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const studyPlanBlockSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim(),
  subject: z.string().trim().default('General Study'),
  startTime: z.string().trim(),
  endTime: z.string().trim(),
  durationMinutes: z.number().int().min(1),
  type: z.enum(['focus', 'break']),
  taskId: z.string().optional(),
  notes: z.string().optional(),
});

export const studyPlanOutputSchema = z.object({
  title: z.string().trim(),
  totalMinutes: z.number().int().min(1),
  blocks: z.array(studyPlanBlockSchema).min(1),
  rationale: z.string().trim(),
});

// Dynamic AI Syllabus schemas
export const syllabusInputSchema = z.object({
  track: z.string().trim().min(1, { message: 'Track is required' }).max(100),
  targetName: z.string().trim().min(1, { message: 'Target name is required' }).max(150),
  level: z.string().trim().max(50).optional(),
});

export const syllabusTopicSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  estimatedHours: z.number().default(4),
  subtopics: z.array(z.string()).default([]),
});

export const syllabusModuleSchema = z.object({
  id: z.string(),
  moduleTitle: z.string(),
  topics: z.array(syllabusTopicSchema),
});

export const syllabusOutputSchema = z.object({
  targetName: z.string(),
  track: z.string(),
  summary: z.string(),
  totalEstimatedHours: z.number(),
  modules: z.array(syllabusModuleSchema),
});

// Dynamic AI Questions schemas
export const questionsInputSchema = z.object({
  track: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  subtopic: z.string().trim().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'all']).default('all'),
  excludeQuestions: z.array(z.string()).max(100).optional(),
  count: z.number().int().min(1).max(5).default(3),
});

export const questionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  problemStatement: z.string(),
  examplesOrContext: z.string().optional(),
  hints: z.array(z.string()).default([]),
  keyTakeaway: z.string().optional(),
  estimatedMinutes: z.number().default(25),
  subject: z.string().default('Practice'),
});

export const questionsOutputSchema = z.object({
  topic: z.string(),
  questions: z.array(questionItemSchema),
});

export type CoachMessageInput = z.infer<typeof coachMessageSchema>;
export type StudyPlanInput = z.infer<typeof studyPlanInputSchema>;
export type ChatHistoryQueryInput = z.infer<typeof chatHistoryQuerySchema>;
export type StudyPlanBlock = z.infer<typeof studyPlanBlockSchema>;
export type StudyPlanOutput = z.infer<typeof studyPlanOutputSchema>;
export type SyllabusInput = z.infer<typeof syllabusInputSchema>;
export type SyllabusTopic = z.infer<typeof syllabusTopicSchema>;
export type SyllabusModule = z.infer<typeof syllabusModuleSchema>;
export type SyllabusOutput = z.infer<typeof syllabusOutputSchema>;
export type QuestionsInput = z.infer<typeof questionsInputSchema>;
export type QuestionItem = z.infer<typeof questionItemSchema>;
export type QuestionsOutput = z.infer<typeof questionsOutputSchema>;
