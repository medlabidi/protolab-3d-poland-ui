import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory
const envPath = path.resolve(__dirname, '../../.env');
console.log('📁 Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

// Also try loading from server/.env if root .env doesn't work
if (result.error) {
  const serverEnvPath = path.resolve(__dirname, '../.env');
  console.log('📁 Trying server .env from:', serverEnvPath);
  dotenv.config({ path: serverEnvPath });
}

if (result.error) {
  console.error('❌ Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
}

// TEST - À supprimer après
console.log('🔍 MONGO_URI loaded:', process.env.MONGO_URI ? 'YES ✅' : 'NO ❌');
if (process.env.MONGO_URI) {
  console.log('🔍 Connection string starts with:', process.env.MONGO_URI.substring(0, 30) + '...');
}

import createApp from './express-app';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();
    logger.info('Database connected successfully');
    
    // Create Express app
    logger.info('Creating Express app...');
    const app = createApp();
    logger.info('Express app created successfully');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 ProtoLab Backend running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    console.error('Detailed error:', error);
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