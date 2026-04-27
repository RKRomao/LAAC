import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { CustomError } from '../middleware/errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Access token required') as CustomError;
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);
    
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      const error = new Error('Authentication required') as CustomError;
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error('Insufficient permissions') as CustomError;
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};
