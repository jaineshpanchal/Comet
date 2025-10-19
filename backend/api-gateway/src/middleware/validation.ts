import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Joi schema
 */
export const validate = (schema: {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationErrors: Record<string, string[]> = {};

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        validationErrors.body = error.details.map(detail => detail.message);
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        validationErrors.query = error.details.map(detail => detail.message);
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        validationErrors.params = error.details.map(detail => detail.message);
      }
    }

    // If there are validation errors, return 400
    if (Object.keys(validationErrors).length > 0) {
      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors: validationErrors
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid request data',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
      return;
    }

    next();
  };
};

/**
 * Common validation rules
 */
export const commonValidations = {
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
      'any.required': 'Password is required'
    }),

  uuid: Joi.string().uuid().required().messages({
    'string.uuid': 'Invalid ID format',
    'any.required': 'ID is required'
  }),

  pagination: {
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(50).messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
  },

  dateRange: {
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
      'date.min': 'End date must be after start date'
    })
  }
};
