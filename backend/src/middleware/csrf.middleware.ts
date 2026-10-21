import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

export const CSRF_COOKIE_NAME = 'study_discipline_csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Middleware ensuring state-changing requests originated from the allowed frontend
 * using Origin verification and anti-CSRF token checking.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe read-only HTTP methods do not require CSRF token validation
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 1. Origin / Referer Header Check
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin) {
    if (origin !== env.CLIENT_URL) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'CSRF validation failed: Invalid request origin.',
        status: 403,
      });
      return;
    }
  } else if (referer) {
    if (!referer.startsWith(env.CLIENT_URL)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'CSRF validation failed: Invalid request referer.',
        status: 403,
      });
      return;
    }
  }

  // 2. Double-Submit CSRF Token Check
  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.headers[CSRF_HEADER_NAME];

  if (csrfCookie && csrfHeader) {
    if (csrfCookie !== csrfHeader) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'CSRF validation failed: Token mismatch.',
        status: 403,
      });
      return;
    }
  }

  next();
}

/**
 * Helper to generate or refresh anti-CSRF token cookie
 */
export function setCsrfCookie(res: Response): string {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript client to send in custom header
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}
