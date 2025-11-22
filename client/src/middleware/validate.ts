import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { logger } from '../config/logger';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      logger.warn('Validation error:', error);
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
  };
};