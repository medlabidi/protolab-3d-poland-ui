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
  
  if (err.message === 'Invalid credentials') {
    res.status(401).json({ error: err.message });
    return;
  }
  
  if (err.message.includes('not found')) {
    res.status(404).json({ error: err.message });
    return;
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
};