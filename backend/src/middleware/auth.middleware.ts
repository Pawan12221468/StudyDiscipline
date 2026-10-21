import { Request, Response, NextFunction } from 'express';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../utils/auth.util';
import { userRepository, UserDocument } from '../models/user.model';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

/**
 * Middleware that requires a valid authenticated user session via HttpOnly cookie or Bearer header
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  let token = req.cookies?.[AUTH_COOKIE_NAME];

  // Optional fallback to Authorization header if cookie is missing
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication session required. Please log in.',
      status: 401,
    });
    return;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Session is invalid or has expired. Please log in again.',
      status: 401,
    });
    return;
  }

  try {
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'The user account associated with this session no longer exists.',
        status: 401,
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
