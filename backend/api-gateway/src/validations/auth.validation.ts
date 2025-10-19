import Joi from 'joi';
import { commonValidations } from '../middleware/validation';

/**
 * Authentication validation schemas
 */

export const registerSchema = {
  body: Joi.object({
    email: commonValidations.email,
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required'
    }),
    firstName: Joi.string().min(1).max(50).required().messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name must not exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(1).max(50).required().messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name must not exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    password: commonValidations.password,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
  })
};

export const loginSchema = {
  body: Joi.object({
    email: commonValidations.email,
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    }),
    rememberMe: Joi.boolean().optional()
  })
};

export const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  })
};

export const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: commonValidations.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
  })
};

export const forgotPasswordSchema = {
  body: Joi.object({
    email: commonValidations.email
  })
};

export const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    newPassword: commonValidations.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
  })
};

export const verifyEmailSchema = {
  body: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Verification token is required'
    })
  })
};

export const updateProfileSchema = {
  body: Joi.object({
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional(),
    avatar: Joi.string().uri().optional().allow(null, '')
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};
