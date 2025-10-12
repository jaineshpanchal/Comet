import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { 
  User, 
  UserRole, 
  CreateUserRequest, 
  UpdateUserRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationQuery
} from '../types';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  profile: Joi.object().optional()
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  avatar: Joi.string().uri().optional().allow(null),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  isActive: Joi.boolean().optional(),
  profile: Joi.object().optional()
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('firstName', 'lastName', 'email', 'createdAt', 'lastLoginAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().optional(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  isActive: Joi.boolean().optional()
});

/**
 * Get all users with pagination and filtering
 * GET /api/v1/users
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = paginationSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: error.details[0].message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  const { 
    page = 1, 
    limit = 20, 
    sortBy = 'createdAt', 
    sortOrder = 'desc', 
    search, 
    role, 
    isActive 
  } = value as PaginationQuery & {
    role?: UserRole;
    isActive?: boolean;
  };

  // Build where clause for filtering
  const where: any = {};
  
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (role) {
    where.role = role;
  }

  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get users with pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        profile: true,
        teamMemberships: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  // Remove passwords from response
  const sanitizedUsers = users.map((user: any) => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const response: ApiResponse<PaginatedResponse<Omit<User, 'password'>>> = {
    success: true,
    data: {
      items: sanitizedUsers as any,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage
    },
    message: `Retrieved ${sanitizedUsers.length} users`,
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'User not authenticated',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      teamMemberships: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
      message: 'Current user not found',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = user;

  const response: ApiResponse<Omit<User, 'password'>> = {
    success: true,
    data: userWithoutPassword as any,
    message: 'Current user profile retrieved successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      teamMemberships: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
      message: `User with ID ${id} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = user;

  const response: ApiResponse<Omit<User, 'password'>> = {
    success: true,
    data: userWithoutPassword as any,
    message: 'User retrieved successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Create new user
 * POST /api/v1/users
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: error.details[0].message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  const { email, username, firstName, lastName, password, role, profile } = value as CreateUserRequest;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    }
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'User already exists',
      message: existingUser.email === email.toLowerCase() 
        ? 'A user with this email already exists' 
        : 'A user with this username already exists',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 409
    });
  }

  // Hash password
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      firstName,
      lastName,
      password: hashedPassword,
      role: role || UserRole.DEVELOPER,
      isActive: true,
      isEmailVerified: false,
      profile: profile ? {
        create: {
          ...profile,
          skills: JSON.stringify(profile.skills || []),
          preferences: JSON.stringify(profile.preferences || {
            theme: 'dark',
            notifications: {
              email: true,
              slack: false,
              inApp: true,
              push: true,
              pipelineUpdates: true,
              deploymentUpdates: true,
              testResults: true,
              securityAlerts: true
            },
            dashboard: {
              defaultView: 'overview',
              refreshInterval: 30,
              widgets: ['metrics', 'pipelines', 'deployments']
            }
          })
        }
      } : undefined
    },
    include: {
      profile: true
    }
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  logger.info(`New user created: ${email}`, {
    userId: user.id,
    email: user.email,
    username: user.username,
    createdBy: req.user?.id
  });

  const response: ApiResponse<Omit<User, 'password'>> = {
    success: true,
    data: userWithoutPassword as any,
    message: 'User created successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 201
  };

  res.status(201).json(response);
}));

/**
 * Update user
 * PUT /api/v1/users/:id
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error, value } = updateUserSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: error.details[0].message,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  const updateData = value as UpdateUserRequest;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
      message: `User with ID ${id} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Prepare update data
  const { profile, ...userUpdateData } = updateData;
  
  // Convert profile fields to JSON if present
  const processedProfile = profile ? {
    ...profile,
    ...(profile.skills && { skills: JSON.stringify(profile.skills) }),
    ...(profile.preferences && { preferences: JSON.stringify(profile.preferences) })
  } : undefined;
  
  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...userUpdateData,
      ...(processedProfile && {
        profile: {
          upsert: {
            create: processedProfile,
            update: processedProfile
          }
        }
      })
    },
    include: {
      profile: true,
      teamMemberships: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    }
  });

  // Remove password from response
  const { password, ...userWithoutPassword } = updatedUser;

  logger.info(`User updated: ${existingUser.email}`, {
    userId: id,
    updatedFields: Object.keys(updateData),
    updatedBy: req.user?.id
  });

  const response: ApiResponse<Omit<User, 'password'>> = {
    success: true,
    data: userWithoutPassword as any,
    message: 'User updated successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Delete user
 * DELETE /api/v1/users/:id
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
      message: `User with ID ${id} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Soft delete by deactivating the user
  await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });

  logger.info(`User deactivated: ${existingUser.email}`, {
    userId: id,
    deactivatedBy: req.user?.id
  });

  const response: ApiResponse = {
    success: true,
    message: 'User deactivated successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'User not authenticated',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      teamMemberships: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
      message: 'Current user not found',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    });
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = user;

  const response: ApiResponse<Omit<User, 'password'>> = {
    success: true,
    data: userWithoutPassword as any,
    message: 'Current user profile retrieved successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

export default router;