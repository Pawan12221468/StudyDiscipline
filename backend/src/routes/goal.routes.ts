import { Router } from 'express';
import {
  getDailyGoal,
  updateDailyGoal,
  getDailyProgress,
  getStreak,
} from '../controllers/goal.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';

const router = Router();

// All goal routes require authenticated user session
router.use(requireAuth);

// Daily study goal endpoints
router.get('/daily', getDailyGoal);
router.put('/daily', csrfProtection, updateDailyGoal);
router.get('/daily/progress', getDailyProgress);

// Streak endpoint
router.get('/streak', getStreak);

export const goalRoutes = router;
