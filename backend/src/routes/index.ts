import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { sessionRoutes } from './session.routes';
import { goalRoutes } from './goal.routes';
import { taskRoutes } from './task.routes';
import { analyticsRoutes } from './analytics.routes';
import { aiRoutes } from './ai.routes';
import { notificationRoutes } from './notification.routes';

const router = Router();

// Mount health routes at /api/health
router.use('/health', healthRoutes);

// Mount authentication routes at /api/auth
router.use('/auth', authRoutes);

// Mount study session routes at /api/sessions
router.use('/sessions', sessionRoutes);

// Mount daily study goals and streaks at /api/goals
router.use('/goals', goalRoutes);

// Mount study tasks at /api/tasks
router.use('/tasks', taskRoutes);

// Mount real-data analytics and study insights at /api/analytics
router.use('/analytics', analyticsRoutes);

// Mount AI Study Coach, study planner, and insights at /api/ai
router.use('/ai', aiRoutes);

// Mount notification preferences and history at /api/notifications
router.use('/notifications', notificationRoutes);

export const apiRoutes = router;

