import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { aiChatRepository, toPublicChatMessage } from '../models/ai.model';
import {
  coachMessageSchema,
  studyPlanInputSchema,
  chatHistoryQuerySchema,
  syllabusInputSchema,
  questionsInputSchema,
} from '../validators/ai.validator';

/**
 * Chat with AI Study Discipline Coach
 * POST /api/ai/coach
 */
export async function chatWithCoach(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = coachMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid coach message payload',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const { message, history } = parseResult.data;
    const user = req.user!;

    try {
      const result = await aiService.chatWithCoach(user._id, user.name, message, history);
      res.status(200).json(result);
    } catch (err: any) {
      if (err.message && err.message.includes('GEMINI_NOT_CONFIGURED')) {
        res.status(503).json({
          error: 'AI_NOT_CONFIGURED',
          message: 'Google Gemini API key is missing. Add GEMINI_API_KEY to backend/.env to activate the AI Study Coach.',
          isConfigured: false,
          status: 503,
        });
        return;
      }

      if (err.message && err.message.includes('AI_PROVIDER_ERROR')) {
        res.status(502).json({
          error: 'BadGateway',
          message: 'AI provider is temporarily unreachable or experienced an error. Please try again in a few moments.',
          status: 502,
        });
        return;
      }

      next(err);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve paginated AI chat history for the authenticated user
 * GET /api/ai/coach/history?page=1&limit=20
 */
export async function getChatHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = chatHistoryQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid chat history query parameters',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const { page, limit } = parseResult.data;
    const userId = req.user!._id;

    const result = await aiChatRepository.listPaginated(userId, page, limit);

    res.status(200).json({
      messages: result.messages.map(toPublicChatMessage),
      total: result.total,
      page: result.page,
      limit: result.limit,
      isConfigured: aiService.isConfigured(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Clear chat history for the authenticated user
 * DELETE /api/ai/coach/history
 */
export async function clearChatHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    await aiChatRepository.clearHistory(userId);
    res.status(200).json({ message: 'AI chat history cleared successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate a personalized, non-overlapping daily study plan
 * POST /api/ai/study-plan
 */
export async function generateStudyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = studyPlanInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid study plan input parameters',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const input = parseResult.data;
    const user = req.user!;

    const result = await aiService.generateStudyPlan(user._id, user.name, input);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve intelligent study insights combining Phase 6 analytics with AI recommendations
 * GET /api/ai/insights
 */
export async function getInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const result = await aiService.generateInsights(user._id, user.name);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Generate dynamic curriculum / syllabus roadmap using Gemini
 * POST /api/ai/syllabus
 */
export async function generateSyllabus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = syllabusInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid syllabus input parameters',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const input = parseResult.data;
    const result = await aiService.generateSyllabus(input);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Generate tailored topic questions & daily challenges with Skip exclusion using Gemini
 * POST /api/ai/questions
 */
export async function generateQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = questionsInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid questions input parameters',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const input = parseResult.data;
    const result = await aiService.generateTopicQuestions(input);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
