import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiRoutes } from './routes';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import { errorMiddleware } from './middleware/error.middleware';

/**
 * Creates and configures the Express application.
 * Kept separate from server startup to facilitate automated testing.
 */
export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration - explicit origin, credentials allowed, no wildcard
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'X-Requested-With'],
    })
  );

  // Cookie Parser for HttpOnly authentication and CSRF tokens
  app.use(cookieParser());

  // Request Body Parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // HTTP Request Logging (development mode only, never logs sensitive bodies or secrets)
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // API Routes
  app.use('/api', apiRoutes);

  // 404 Handler for unmatched routes
  app.use(notFoundMiddleware);

  // Centralized Error Handling
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
