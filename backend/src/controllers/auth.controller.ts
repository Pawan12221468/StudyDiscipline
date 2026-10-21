import { Request, Response, NextFunction } from 'express';
import { signupSchema, loginSchema } from '../validators/auth.validator';
import { userRepository, toPublicUser } from '../models/user.model';
import {
  hashPassword,
  comparePassword,
  signAuthToken,
  getAuthCookieOptions,
  AUTH_COOKIE_NAME,
} from '../utils/auth.util';
import { setCsrfCookie, CSRF_COOKIE_NAME } from '../middleware/csrf.middleware';

/**
 * Handle new user registration
 * POST /api/auth/signup
 */
export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid input data',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const { name, email, password } = parseResult.data;

    // Check if user already exists with normalized email
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        error: 'ConflictError',
        message: 'An account with this email address already exists. Please log in instead.',
        status: 409,
      });
      return;
    }

    // Hash password safely
    const passwordHash = await hashPassword(password);

    // Create user record
    const newUser = await userRepository.create(name, email, passwordHash);

    // Sign session token
    const token = signAuthToken({
      userId: newUser._id.toString(),
      email: newUser.email,
    });

    // Set HttpOnly auth cookie
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    // Set CSRF token cookie
    const csrfToken = setCsrfCookie(res);

    res.status(201).json({
      message: 'Account created successfully',
      user: toPublicUser(newUser),
      csrfToken,
    });
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000) if race condition occurs
    if (error?.code === 11000) {
      res.status(409).json({
        error: 'ConflictError',
        message: 'An account with this email address already exists. Please log in instead.',
        status: 409,
      });
      return;
    }
    next(error);
  }
}

/**
 * Handle existing user login
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid email or password format',
        status: 400,
      });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await userRepository.findByEmail(email);
    // Use constant-time comparison / generic invalid message to avoid email enumeration
    const isPasswordValid = user ? await comparePassword(password, user.passwordHash) : false;

    if (!user || !isPasswordValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password. Please check your credentials.',
        status: 401,
      });
      return;
    }

    // Sign session token
    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // Set HttpOnly auth cookie
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    // Set CSRF token cookie
    const csrfToken = setCsrfCookie(res);

    res.status(200).json({
      message: 'Logged in successfully',
      user: toPublicUser(user),
      csrfToken,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle user logout
 * POST /api/auth/logout
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  // Clear the HttpOnly session cookie using identical path/domain settings
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getAuthCookieOptions(),
    maxAge: 0,
  });

  // Clear CSRF cookie
  res.clearCookie(CSRF_COOKIE_NAME, {
    path: '/',
    maxAge: 0,
  });

  res.status(200).json({
    message: 'Logged out successfully',
  });
}

/**
 * Get current authenticated user session profile
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No active session found',
      status: 401,
    });
    return;
  }

  // Refresh CSRF cookie on /me call so client has a fresh token
  const csrfToken = setCsrfCookie(res);

  res.status(200).json({
    user: toPublicUser(req.user),
    csrfToken,
  });
}

/**
 * Endpoint for client to explicitly request an initial anti-CSRF token
 * GET /api/auth/csrf
 */
export async function getCsrfToken(_req: Request, res: Response): Promise<void> {
  const token = setCsrfCookie(res);
  res.status(200).json({ csrfToken: token });
}
