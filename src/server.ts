import dotenv from 'dotenv';
dotenv.config();

import createApp from './app';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Create Express app
    const app = createApp();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 ProtoLab Backend running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    // Structured logging: pass the unknown into an object so overloads accept it
    logger.error({ err: error }, 'Failed to start server');
    // If you prefer stringifying:
    // logger.error(`Failed to start server: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error({ reason }, 'Unhandled Rejection');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();