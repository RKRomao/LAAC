import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  details?: any;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { name: 'CastError', message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = { name: 'MongoError', message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = { name: 'ValidationError', message, statusCode: 400 };
  }

  // Check if request expects JSON (API calls)
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error',
    });
  }

  // Render HTML error page for browser requests
  res.status(error.statusCode || 500).render('pages/error', {
    title: `${error.statusCode || 500} - Erro`,
    error: {
      statusCode: error.statusCode || 500,
      message: error.message || 'Server Error',
      stack: error.stack
    }
  });
  return;
};
