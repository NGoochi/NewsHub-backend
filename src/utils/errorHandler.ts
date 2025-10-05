import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Prisma errors
 * @param error Prisma error
 * @returns Formatted error message
 */
export const handlePrismaError = (error: any): string => {
  if (error.code === 'P2002') {
    return 'A record with this information already exists';
  }
  
  if (error.code === 'P2025') {
    return 'Record not found';
  }
  
  if (error.code === 'P2003') {
    return 'Foreign key constraint failed';
  }
  
  if (error.code === 'P2014') {
    return 'Invalid ID provided';
  }
  
  return 'Database operation failed';
};

/**
 * Handle validation errors
 * @param error Validation error
 * @returns Formatted error message
 */
export const handleValidationError = (error: any): string => {
  if (error.details) {
    return error.details.map((detail: any) => detail.message).join(', ');
  }
  
  return 'Validation failed';
};

/**
 * Handle API errors (NewsAPI, Gemini, etc.)
 * @param error API error
 * @returns Formatted error message
 */
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return `External API error: ${error.response.data.message}`;
  }
  
  if (error.message) {
    return `External API error: ${error.message}`;
  }
  
  return 'External API request failed';
};

/**
 * Global error handler middleware
 * @param error Error object
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = handleValidationError(error);
    isOperational = true;
  } else if (error.code && error.code.startsWith('P')) {
    statusCode = 400;
    message = handlePrismaError(error);
    isOperational = true;
  } else if (error.response) {
    statusCode = error.response.status || 500;
    message = handleApiError(error);
    isOperational = true;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }

  // Log error details
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    statusCode,
    isOperational,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
};

/**
 * Handle 404 errors
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Async error wrapper for route handlers
 * @param fn Async function to wrap
 * @returns Wrapped function with error handling
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create a standardized error response
 * @param message Error message
 * @param statusCode HTTP status code
 * @returns Error response object
 */
export const createErrorResponse = (message: string, statusCode: number = 500) => {
  return {
    success: false,
    error: message,
    statusCode
  };
};

/**
 * Validate and throw error if condition is false
 * @param condition Condition to check
 * @param message Error message
 * @param statusCode HTTP status code
 */
export const validateOrThrow = (condition: boolean, message: string, statusCode: number = 400) => {
  if (!condition) {
    throw new AppError(message, statusCode);
  }
};
