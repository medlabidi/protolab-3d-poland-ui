import mongoose from 'mongoose';
import { logger } from './logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/protolab';
    
    // Validate connection string
    if (!mongoUri || !mongoUri.includes('mongodb')) {
      logger.error('Invalid or missing MONGO_URI in environment variables');
      throw new Error('MONGO_URI not properly configured');
    }
    
    logger.info({ uri: mongoUri.replace(/:[^:]*@/, ':****@') }, 'Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    
    logger.info('✅ MongoDB connected successfully');
    logger.info({ database: mongoose.connection.name, host: mongoose.connection.host }, 'Database connection established');
    
    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ err: error }, '❌ MongoDB connection failed');
    
    // Provide specific error guidance
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      logger.error('Network error: Check internet connection and DNS resolution');
    } else if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
      logger.error('Authentication error: Verify username and password in MONGODB_URI');
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      logger.error('Timeout error: Check IP whitelist in MongoDB Atlas Network Access');
    }
    
    logger.warn('Connection string format for MongoDB Atlas:');
    logger.warn('mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=AppName');
    
    // Continue running without database connection
  }
};