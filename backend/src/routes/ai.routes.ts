import { Router } from 'express';
import {
  chatWithCoach,
  getChatHistory,
  clearChatHistory,
  generateStudyPlan,
  getInsights,
  generateSyllabus,
  generateQuestions,
} from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { aiRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// All AI endpoints require authenticated user session
router.use(requireAuth);

// Conversational AI Coach
router.post('/coach', csrfProtection, aiRateLimiter, chatWithCoach);
router.get('/coach/history', getChatHistory);
router.delete('/coach/history', csrfProtection, clearChatHistory);

// Personalized Daily Study Plan Generation
router.post('/study-plan', csrfProtection, aiRateLimiter, generateStudyPlan);

// Intelligent Study Insights & Evidence-Based Recommendations
router.get('/insights', getInsights);

// Dynamic Syllabus & Question Generation
router.post('/syllabus', csrfProtection, aiRateLimiter, generateSyllabus);
router.post('/questions', csrfProtection, aiRateLimiter, generateQuestions);

export const aiRoutes = router;
