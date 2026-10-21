import { Router } from 'express';
import { signup, login, logout, getMe, getCsrfToken } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { authRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// CSRF token retrieval endpoint
router.get('/csrf', getCsrfToken);

// Public authentication endpoints with rate limiting and CSRF protection
router.post('/signup', authRateLimiter, csrfProtection, signup);
router.post('/login', authRateLimiter, csrfProtection, login);

// Session endpoints
router.post('/logout', csrfProtection, logout);
router.get('/me', requireAuth, getMe);

export const authRoutes = router;
