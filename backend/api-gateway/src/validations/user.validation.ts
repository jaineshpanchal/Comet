import Joi from 'joi';
import { commonValidations } from '../middleware/validation';

/**
 * User management validation schemas
 */

export const getUserSchema = {
  params: Joi.object({
    id: commonValidations.uuid
  })
};

export const updateUserSchema = {
  params: Joi.object({
    id: commonValidations.uuid
  }),
  body: Joi.object({
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional(),
    avatar: Joi.string().uri().optional().allow(null, ''),
    role: Joi.string().valid('ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER', 'VIEWER').optional(),
    isActive: Joi.boolean().optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

export const deleteUserSchema = {
  params: Joi.object({
    id: commonValidations.uuid
  })
};

export const listUsersSchema = {
  query: Joi.object({
    page: commonValidations.pagination.page,
    limit: commonValidations.pagination.limit,
    role: Joi.string().valid('ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER', 'VIEWER').optional(),
    isActive: Joi.boolean().optional(),
    search: Joi.string().min(1).max(100).optional()
  })
};
