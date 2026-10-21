import { Router } from 'express';
import {
  createSession,
  getActiveSession,
  pauseSession,
  resumeSession,
  finishSession,
  abandonSession,
  listSessions,
  getSessionById,
} from '../controllers/session.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';

const router = Router();

// All session endpoints require authenticated user session
router.use(requireAuth);

// Active session retrieval (must come before /:id)
router.get('/active', getActiveSession);

// Session listing and retrieval
router.get('/', listSessions);
router.get('/:id', getSessionById);

// State-changing mutations (protected by CSRF verification)
router.post('/', csrfProtection, createSession);
router.patch('/:id/pause', csrfProtection, pauseSession);
router.patch('/:id/resume', csrfProtection, resumeSession);
router.patch('/:id/finish', csrfProtection, finishSession);
router.patch('/:id/abandon', csrfProtection, abandonSession);

export const sessionRoutes = router;
