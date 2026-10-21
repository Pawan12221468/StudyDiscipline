import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import {
  taskRepository,
  toPublicTask,
} from '../models/task.model';
import {
  createTaskSchema,
  updateTaskSchema,
  completeTaskSchema,
  listTasksQuerySchema,
} from '../validators/task.validator';

function parseObjectId(idStr: string): ObjectId | null {
  if (!ObjectId.isValid(idStr)) return null;
  try {
    return new ObjectId(idStr);
  } catch {
    return null;
  }
}

/**
 * Create a new study task
 * POST /api/tasks
 */
export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid task data',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const userId = req.user!._id;
    const task = await taskRepository.create(userId, parseResult.data);

    res.status(201).json({
      message: 'Study task created successfully',
      task: toPublicTask(task),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List study tasks with filtering and pagination
 * GET /api/tasks
 */
export async function listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = listTasksQuerySchema.safeParse(req.query);
    const query = parseResult.success ? parseResult.data : { page: 1, limit: 20 };

    const userId = req.user!._id;
    const { tasks, total, page, limit } = await taskRepository.listByUserId(userId, query);

    res.status(200).json({
      tasks: tasks.map(toPublicTask),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a single task by ID
 * GET /api/tasks/:id
 */
export async function getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskId = parseObjectId(req.params.id);
    if (!taskId) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid task ID format', status: 400 });
      return;
    }

    const userId = req.user!._id;
    const task = await taskRepository.findByIdAndUserId(taskId, userId);

    if (!task) {
      res.status(404).json({ error: 'NotFound', message: 'Study task not found', status: 404 });
      return;
    }

    res.status(200).json({ task: toPublicTask(task) });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing study task
 * PATCH /api/tasks/:id
 */
export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskId = parseObjectId(req.params.id);
    if (!taskId) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid task ID format', status: 400 });
      return;
    }

    const parseResult = updateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid task updates',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const userId = req.user!._id;
    try {
      const updated = await taskRepository.update(taskId, userId, parseResult.data);
      res.status(200).json({
        message: 'Task updated successfully',
        task: toPublicTask(updated),
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: 'NotFound', message: err.message, status: 404 });
        return;
      }
      res.status(400).json({ error: 'BadRequest', message: err.message, status: 400 });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Complete or toggle completion of a study task
 * PATCH /api/tasks/:id/complete
 */
export async function completeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskId = parseObjectId(req.params.id);
    if (!taskId) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid task ID format', status: 400 });
      return;
    }

    const parseResult = completeTaskSchema.safeParse(req.body);
    const explicitCompleted = parseResult.success ? parseResult.data.completed : undefined;

    const userId = req.user!._id;
    try {
      const updated = await taskRepository.toggleComplete(taskId, userId, explicitCompleted);
      res.status(200).json({
        message: updated.status === 'completed' ? 'Task marked completed' : 'Task reopened',
        task: toPublicTask(updated),
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: 'NotFound', message: err.message, status: 404 });
        return;
      }
      res.status(400).json({ error: 'BadRequest', message: err.message, status: 400 });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a study task
 * DELETE /api/tasks/:id
 */
export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskId = parseObjectId(req.params.id);
    if (!taskId) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid task ID format', status: 400 });
      return;
    }

    const userId = req.user!._id;
    const deleted = await taskRepository.delete(taskId, userId);

    if (!deleted) {
      res.status(404).json({ error: 'NotFound', message: 'Study task not found', status: 404 });
      return;
    }

    res.status(200).json({
      message: 'Study task deleted successfully',
      taskId: taskId.toString(),
    });
  } catch (error) {
    next(error);
  }
}
