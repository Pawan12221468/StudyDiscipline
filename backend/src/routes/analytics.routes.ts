import { Router } from 'express';
import {
  getOverview,
  getDaily,
  getSubjects,
  getGoals,
  getConsistency,
} from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// All analytics endpoints require authenticated user session
router.use(requireAuth);

router.get('/overview', getOverview);
router.get('/daily', getDaily);
router.get('/subjects', getSubjects);
router.get('/goals', getGoals);
router.get('/consistency', getConsistency);

export const analyticsRoutes = router;
