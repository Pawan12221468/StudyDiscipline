import { Router } from 'express';
import {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  completeTask,
  deleteTask,
} from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';

const router = Router();

// All task routes require authenticated user session
router.use(requireAuth);

// Task collection endpoints
router.get('/', listTasks);
router.post('/', csrfProtection, createTask);

// Single task endpoints
router.get('/:id', getTaskById);
router.patch('/:id', csrfProtection, updateTask);
router.patch('/:id/complete', csrfProtection, completeTask);
router.delete('/:id', csrfProtection, deleteTask);

export const taskRoutes = router;
