import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { env } from '../config/env';

export const AUTH_COOKIE_NAME = 'study_discipline_auth_token';

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password against stored hash safely
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a short-lived or session JWT with the validated server secret
 */
export function signAuthToken(payload: TokenPayload): string {
  // Cast expiresIn to any to avoid StringValue typing issue in jsonwebtoken
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

/**
 * Verifies a JWT token and returns payload or null if invalid/expired
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (decoded && decoded.userId && decoded.email) {
      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns standard Secure, HttpOnly cookie configuration
 */
export function getAuthCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };
}
