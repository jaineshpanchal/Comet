// Global error handling middleware
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { 
  ApiResponse, 
  ErrorCode
} from '../types';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public errorCode: ErrorCode;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode: ErrorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationAppError extends AppError {
  public details: any;

  constructor(message: string, details?: any) {
    super(message, 400, ErrorCode.VALIDATION_ERROR);
    this.details = details;
  }
}

export class AuthenticationAppError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, ErrorCode.AUTHENTICATION_ERROR);
  }
}

export class AuthorizationAppError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, ErrorCode.AUTHORIZATION_ERROR);
  }
}

export class NotFoundAppError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, ErrorCode.NOT_FOUND_ERROR);
  }
}

export class ConflictAppError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, ErrorCode.CONFLICT_ERROR);
  }
}

export class ServiceUnavailableAppError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, ErrorCode.SERVICE_UNAVAILABLE);
  }
}

export class RateLimitAppError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, ErrorCode.RATE_LIMIT_ERROR);
  }
}

// Error handler utility functions
const getErrorCode = (error: any): ErrorCode => {
  if (error.errorCode) return error.errorCode;
  
  // Map common error types
  if (error.name === 'ValidationError') return ErrorCode.VALIDATION_ERROR;
  if (error.name === 'CastError') return ErrorCode.VALIDATION_ERROR;
  if (error.name === 'MongoError' && error.code === 11000) return ErrorCode.CONFLICT_ERROR;
  if (error.name === 'JsonWebTokenError') return ErrorCode.AUTHENTICATION_ERROR;
  if (error.name === 'TokenExpiredError') return ErrorCode.AUTHENTICATION_ERROR;
  if (error.code === 'ECONNREFUSED') return ErrorCode.SERVICE_UNAVAILABLE;
  
  return ErrorCode.INTERNAL_SERVER_ERROR;
};

const getStatusCode = (error: any): number => {
  if (error.statusCode) return error.statusCode;
  
  // Map common error types to status codes
  if (error.name === 'ValidationError') return 400;
  if (error.name === 'CastError') return 400;
  if (error.name === 'MongoError' && error.code === 11000) return 409;
  if (error.name === 'JsonWebTokenError') return 401;
  if (error.name === 'TokenExpiredError') return 401;
  if (error.code === 'ECONNREFUSED') return 503;
  
  return 500;
};

const formatValidationErrors = (error: any): any => {
  if (error.name === 'ValidationError' && error.errors) {
    return Object.keys(error.errors).map(key => ({
      field: key,
      message: error.errors[key].message,
      value: error.errors[key].value
    }));
  }
  
  return null;
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundAppError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Global error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = getStatusCode(error);
  const errorCode = getErrorCode(error);
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error details
  const errorDetails = {
    message: error.message,
    statusCode,
    errorCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
    ...(error.stack && !isProduction && { stack: error.stack }),
    ...(error.details && { details: error.details })
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error('Server error occurred', errorDetails);
  } else if (statusCode >= 400) {
    logger.warn('Client error occurred', errorDetails);
  } else {
    logger.info('Request error occurred', errorDetails);
  }

  // Format validation errors
  const validationErrors = formatValidationErrors(error);

  // Create error response
  const errorResponse: ApiResponse<null> = {
    success: false,
    error: error.message || 'An error occurred',
    message: getErrorMessage(statusCode, errorCode),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    statusCode,
    ...(validationErrors && { validationErrors }),
    ...(error.details && { details: error.details }),
    ...(!isProduction && error.stack && { stack: error.stack })
  };

  res.status(statusCode).json(errorResponse);
};

// Get user-friendly error messages
const getErrorMessage = (statusCode: number, errorCode: ErrorCode): string => {
  const errorMessages: Record<ErrorCode, string> = {
    [ErrorCode.VALIDATION_ERROR]: 'The provided data is invalid',
    [ErrorCode.AUTHENTICATION_ERROR]: 'Authentication failed',
    [ErrorCode.AUTHORIZATION_ERROR]: 'You do not have permission to perform this action',
    [ErrorCode.NOT_FOUND_ERROR]: 'The requested resource was not found',
    [ErrorCode.CONFLICT_ERROR]: 'A conflict occurred with the current state',
    [ErrorCode.RATE_LIMIT_ERROR]: 'Too many requests, please try again later',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'An internal server error occurred',
    [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error'
  };

  return errorMessages[errorCode] || 'An unexpected error occurred';
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error handler
export const validationErrorHandler = (errors: any[]) => {
  const formattedErrors = errors.map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value,
    location: error.location
  }));

  throw new ValidationAppError('Validation failed', formattedErrors);
};

// Rate limiting error handler
export const rateLimitHandler = (req: Request, res: Response) => {
  const response: ApiResponse<null> = {
    success: false,
    error: 'Rate limit exceeded',
    message: 'Too many requests from this IP, please try again later',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    statusCode: 429
  };

  res.status(429).json(response);
};

// Database connection error handler
export const databaseErrorHandler = (error: any) => {
  logger.error('Database connection error', { error: error.message });
  
  if (error.code === 'ECONNREFUSED') {
    throw new ServiceUnavailableAppError('Database connection failed');
  }
  
  throw new AppError('Database error occurred', 500, ErrorCode.DATABASE_ERROR);
};

// External service error handler
export const externalServiceErrorHandler = (serviceName: string, error: any) => {
  logger.error(`External service error - ${serviceName}`, { 
    error: error.message,
    serviceName,
    timestamp: new Date().toISOString()
  });
  
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    throw new ServiceUnavailableAppError(`${serviceName} service is unavailable`);
  }
  
  throw new AppError(
    `${serviceName} service error: ${error.message}`, 
    502, 
    ErrorCode.EXTERNAL_SERVICE_ERROR
  );
};

// Request timeout handler
export const timeoutHandler = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      const error = new AppError('Request timeout', 408, ErrorCode.INTERNAL_SERVER_ERROR);
      next(error);
    }, timeout);

    // Clear timeout if response is sent
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};

// CORS error handler
export const corsErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && !allowedOrigins.includes(origin)) {
    const error = new AuthorizationAppError('CORS policy violation');
    return next(error);
  }
  
  next();
};