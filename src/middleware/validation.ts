import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CustomError } from '@/middleware/errorHandler';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed') as CustomError;
    error.statusCode = 400;
    error.details = errors.array();
    return next(error);
  }
  
  next();
};
