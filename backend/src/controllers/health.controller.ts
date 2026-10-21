import { Request, Response } from 'express';
import { dbConnection } from '../config/database';
import { env } from '../config/env';

/**
 * Server health check endpoint
 * GET /api/health
 */
export async function getHealth(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'ok',
    service: 'study-discipline-backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
  });
}

/**
 * Database health check endpoint
 * GET /api/health/db
 */
export async function getDatabaseHealth(_req: Request, res: Response): Promise<void> {
  const pingResult = await dbConnection.ping();

  if (pingResult.ok) {
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      databaseName: env.DB_NAME,
      latencyMs: pingResult.latencyMs,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      message: 'MongoDB database ping check failed or connection unavailable.',
      timestamp: new Date().toISOString(),
    });
  }
}
