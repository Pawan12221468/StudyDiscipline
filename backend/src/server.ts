import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { dbConnection } from './config/database';

let server: http.Server | null = null;
let isShuttingDown: boolean = false;

async function startServer(): Promise<void> {
  console.log(`[Study Discipline Backend] Starting server in "${env.NODE_ENV}" mode...`);

  // 1. Connect to MongoDB Atlas
  try {
    await dbConnection.connect();
    const { userRepository } = await import('./models/user.model');
    const { sessionRepository } = await import('./models/session.model');
    const { goalRepository } = await import('./models/goal.model');
    const { taskRepository } = await import('./models/task.model');
    const { aiChatRepository } = await import('./models/ai.model');
    const { notificationRepository } = await import('./models/notification.model');
    await userRepository.ensureIndexes();
    await sessionRepository.ensureIndexes();
    await goalRepository.ensureIndexes();
    await taskRepository.ensureIndexes();
    await aiChatRepository.ensureIndexes();
    await notificationRepository.ensureIndexes();

  } catch (err) {
    console.error('❌ Server startup aborted: Failed to establish database connection.');
    // Exit with nonzero status as required
    process.exit(1);
  }

  // 2. Start HTTP Server
  server = app.listen(env.PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${env.PORT}`);
    console.log(`   Health endpoint: http://localhost:${env.PORT}/api/health`);
    console.log(`   Database health: http://localhost:${env.PORT}/api/health/db`);
    console.log(`   CORS allowed origin: ${env.CLIENT_URL}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${env.PORT} is already in use. Please choose another port or kill the existing process.`);
    } else {
      console.error('❌ Server error:', error.message);
    }
    process.exit(1);
  });
}

/**
 * Graceful shutdown handler for SIGINT / SIGTERM
 */
async function handleShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      await dbConnection.close();
      console.log('👋 Process exiting cleanly.');
      process.exit(0);
    });

    // Force close after 10 seconds if hanging
    setTimeout(() => {
      console.error('⚠️ Forcefully terminating process after timeout.');
      process.exit(1);
    }, 10000).unref();
  } else {
    await dbConnection.close();
    process.exit(0);
  }
}

// Register process signal handlers
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Handle uncaught errors
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  process.exit(1);
});

startServer();
