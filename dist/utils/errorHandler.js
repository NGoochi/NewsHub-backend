"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrThrow = exports.createErrorResponse = exports.asyncHandler = exports.notFoundHandler = exports.globalErrorHandler = exports.handleApiError = exports.handleValidationError = exports.handlePrismaError = exports.AppError = void 0;
/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Handle Prisma errors
 * @param error Prisma error
 * @returns Formatted error message
 */
const handlePrismaError = (error) => {
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
exports.handlePrismaError = handlePrismaError;
/**
 * Handle validation errors
 * @param error Validation error
 * @returns Formatted error message
 */
const handleValidationError = (error) => {
    if (error.details) {
        return error.details.map((detail) => detail.message).join(', ');
    }
    return 'Validation failed';
};
exports.handleValidationError = handleValidationError;
/**
 * Handle API errors (NewsAPI, Gemini, etc.)
 * @param error API error
 * @returns Formatted error message
 */
const handleApiError = (error) => {
    if (error.response?.data?.message) {
        return `External API error: ${error.response.data.message}`;
    }
    if (error.message) {
        return `External API error: ${error.message}`;
    }
    return 'External API request failed';
};
exports.handleApiError = handleApiError;
/**
 * Global error handler middleware
 * @param error Error object
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
const globalErrorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let isOperational = false;
    // Handle different error types
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        isOperational = error.isOperational;
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = (0, exports.handleValidationError)(error);
        isOperational = true;
    }
    else if (error.code && error.code.startsWith('P')) {
        statusCode = 400;
        message = (0, exports.handlePrismaError)(error);
        isOperational = true;
    }
    else if (error.response) {
        statusCode = error.response.status || 500;
        message = (0, exports.handleApiError)(error);
        isOperational = true;
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        isOperational = true;
    }
    else if (error.name === 'TokenExpiredError') {
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
exports.globalErrorHandler = globalErrorHandler;
/**
 * Handle 404 errors
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async error wrapper for route handlers
 * @param fn Async function to wrap
 * @returns Wrapped function with error handling
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Create a standardized error response
 * @param message Error message
 * @param statusCode HTTP status code
 * @returns Error response object
 */
const createErrorResponse = (message, statusCode = 500) => {
    return {
        success: false,
        error: message,
        statusCode
    };
};
exports.createErrorResponse = createErrorResponse;
/**
 * Validate and throw error if condition is false
 * @param condition Condition to check
 * @param message Error message
 * @param statusCode HTTP status code
 */
const validateOrThrow = (condition, message, statusCode = 400) => {
    if (!condition) {
        throw new AppError(message, statusCode);
    }
};
exports.validateOrThrow = validateOrThrow;
