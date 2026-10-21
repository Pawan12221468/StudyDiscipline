import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import {
  sessionRepository,
  toPublicSession,
  calculateElapsedMs,
} from '../models/session.model';
import {
  createSessionSchema,
  finishSessionSchema,
  sessionQuerySchema,
} from '../validators/session.validator';

function parseObjectId(idStr: string): ObjectId | null {
  if (!ObjectId.isValid(idStr)) return null;
  try {
    return new ObjectId(idStr);
  } catch {
    return null;
  }
}

/**
 * Start a new study session
 * POST /api/sessions
 */
export async function createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = createSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid session data',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const userId = req.user!._id;

    try {
      const session = await sessionRepository.create({
        userId,
        ...parseResult.data,
      });

      res.status(201).json({
        message: 'Study session started successfully',
        session: toPublicSession(session),
        elapsedMs: 0,
      });
    } catch (err: any) {
      if (err.message.includes('already in progress')) {
        // Return existing active session so the client can recover without losing state
        const existing = await sessionRepository.findActiveByUserId(userId);
        res.status(409).json({
          error: 'ConflictError',
          message: err.message,
          activeSession: existing ? toPublicSession(existing) : null,
          status: 409,
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get the current user's active (running or paused) session
 * GET /api/sessions/active
 */
export async function getActiveSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const session = await sessionRepository.findActiveByUserId(userId);

    if (!session) {
      res.status(200).json({ session: null, elapsedMs: 0 });
      return;
    }

    const elapsedMs = calculateElapsedMs(session, new Date());
    res.status(200).json({
      session: toPublicSession(session),
      elapsedMs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Pause an active running session
 * PATCH /api/sessions/:id/pause
 */
export async function pauseSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = parseObjectId(req.params.id);
    if (!sessionId) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid session ID format', status: 400 });
      return;
    }

    const userId = req.user!._id;
    try {
      const updated = await sessionRepository.pause(sessionId, userId);
      res.status(200).json({
        message: 'Session paused',
        session: toPublicSession(updated),
        elapsedMs: updated.accumulatedDurationMs,
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: 'NotFound', message: err.message, status: 404 });
        return;
      }
      res.status(400).json({ error: 'InvalidState', message: err.message, status: 400 });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Resume a paused session
 * PATCH /api/sessions/:id/resume
 */
export async function resumeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = parseObjectId(req.params.id);
    if (!sessionId) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid session ID format', status: 400 });
      return;
    }

    const userId = req.user!._id;
    try {
      const updated = await sessionRepository.resume(sessionId, userId);
      const elapsedMs = calculateElapsedMs(updated, new Date());
      res.status(200).json({
        message: 'Session resumed',
        session: toPublicSession(updated),
        elapsedMs,
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: 'NotFound', message: err.message, status: 404 });
        return;
      }
      res.status(400).json({ error: 'InvalidState', message: err.message, status: 400 });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Complete a session and store final verified duration
 * PATCH /api/sessions/:id/finish
 */
export async function finishSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = parseObjectId(req.params.id);
    if (!sessionId) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid session ID format', status: 400 });
      return;
    }

    const parseResult = finishSessionSchema.safeParse(req.body);
    const options = parseResult.success ? parseResult.data : {};

    const userId = req.user!._id;
    try {
      const updated = await sessionRepository.finish(sessionId, userId, options);
      res.status(200).json({
        message: 'Session completed successfully',
        session: toPublicSession(updated),
        durationSeconds: updated.durationSeconds,
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: 'NotFound', message: err.message, status: 404 });
        return;
      }
      res.status(400).json({ error: 'InvalidState', message: err.message, status: 400 });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Abandon an active or paused session
 * PATCH /api/sessions/:id/abandon
 */
export async function abandonSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = parseObjectId(req.params.id);
    if (!sessionId) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid session ID format', status: 400 });
      return;
    }

    const userId = req.user!._id;
    try {
      const updated = await sessionRepository.abandon(sessionId, userId);
      res.status(200).json({
        message: 'Session abandoned',
        session: toPublicSession(updated),
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        res.status(404).json({ error: 'NotFound', message: err.message, status: 404 });
        return;
      }
      res.status(400).json({ error: 'InvalidState', message: err.message, status: 400 });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * List the current user's completed study sessions with pagination
 * GET /api/sessions
 */
export async function listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const queryResult = sessionQuerySchema.safeParse(req.query);
    const query = queryResult.success ? queryResult.data : { page: 1, limit: 15 };

    const userId = req.user!._id;
    const { sessions, total, page, limit } = await sessionRepository.listByUserId(userId, query);

    res.status(200).json({
      sessions: sessions.map(toPublicSession),
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
 * Retrieve one session owned by the current user
 * GET /api/sessions/:id
 */
export async function getSessionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = parseObjectId(req.params.id);
    if (!sessionId) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid session ID format', status: 400 });
      return;
    }

    const userId = req.user!._id;
    const session = await sessionRepository.findByIdAndUserId(sessionId, userId);

    if (!session) {
      res.status(404).json({ error: 'NotFound', message: 'Study session not found', status: 404 });
      return;
    }

    res.status(200).json({ session: toPublicSession(session) });
  } catch (error) {
    next(error);
  }
}
