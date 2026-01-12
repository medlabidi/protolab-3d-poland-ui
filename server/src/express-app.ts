import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import creditsRoutes from './routes/credits.routes';
import conversationsRoutes from './routes/conversations.routes';
import paymentRoutes from './routes/payment.routes';
import materialsRoutes from './routes/materials.routes';
import printersRoutes from './routes/printers.routes';
import shippingRoutes from './routes/shipping.routes';
import analyticsRoutes from './routes/analytics.routes';

const createApp = (): Application => {
  const app = express();
  
  // Security middleware
  // Temporarily disabled to test JSON parsing error
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  
  // CORS configuration - Allow both ports 8080 and 8081
  const allowedOrigins = ['http://localhost:8080', 'http://localhost:8081'];
  if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
  }
  
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  }));

  // Handle OPTIONS preflight requests explicitly
  app.options('*', cors());
  
  // Rate limiting (more lenient for development)
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200'), // Increased from 100 to 200
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  
  // Request logging
  app.use(pinoHttp({ logger }));
  
  // Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/credits', creditsRoutes);
  app.use('/api/conversations', conversationsRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/materials', materialsRoutes);
  app.use('/api/printers', printersRoutes);
  app.use('/api/admin/shipping', shippingRoutes);
  app.use('/api/admin/analytics', analyticsRoutes);
  
  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
};

export default createApp;