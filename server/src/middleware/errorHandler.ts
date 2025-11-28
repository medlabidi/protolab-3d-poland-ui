import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error({
    err: err,
    path: req.path,
    method: req.method,
  }, 'Error occurred');
  
  if (err.name === 'ValidationError') {
    res.status(400).json({ error: 'Validation error', details: err.message });
    return;
  }
  
  if (err.name === 'CastError') {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }
  
  if (err.message === 'User already exists') {
    res.status(409).json({ error: err.message });
    return;
  }
  
  if (err.message === 'Invalid credentials' || err.message === 'Invalid email or password') {
    res.status(401).json({ error: err.message });
    return;
  }

  if (err.message.includes('verify your email') || err.message.includes('verification')) {
    res.status(403).json({ error: err.message });
    return;
  }
  
  if (err.message.includes('not found')) {
    res.status(404).json({ error: err.message });
    return;
  }

  // Send the actual error message for better debugging in development
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({ error: err.message || 'Internal server error' });
    return;
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
};