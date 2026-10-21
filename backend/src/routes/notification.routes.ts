import { Router } from 'express';
import {
  getPreferences,
  updatePreferences,
  getHistory,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';

const router = Router();

// All notification routes require authenticated user session
router.use(requireAuth);

// Notification preferences endpoints
router.get('/preferences', getPreferences);
router.put('/preferences', csrfProtection, updatePreferences);

// Notification history endpoints
router.get('/history', getHistory);
router.post('/', csrfProtection, createNotification);
router.patch('/read-all', csrfProtection, markAllAsRead);
router.patch('/:id/read', csrfProtection, markAsRead);
router.delete('/:id', csrfProtection, deleteNotification);

export const notificationRoutes = router;
