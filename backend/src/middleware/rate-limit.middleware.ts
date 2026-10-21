import rateLimit from 'express-rate-limit';

/**
 * Rate limiter specifically protecting authentication endpoints against brute force attempts
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    status: 429,
  },
});

/**
 * Rate limiter specifically protecting AI endpoints against excessive quota consumption
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many AI requests. Please wait a moment before sending another request.',
    status: 429,
  },
});

