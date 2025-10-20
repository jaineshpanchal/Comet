import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  User, 
  UserRole,
  UserPreferences,
  JwtPayload,
  ApiResponse 
} from '../types';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  rememberMe: Joi.boolean().optional()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    }),
  company: Joi.string().max(100).optional(),
  position: Joi.string().max(100).optional()
});

// JWT utilities
const generateTokens = (user: User) => {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    permissions: [] // Will be populated based on role
  };

  const jwtSecret = process.env.JWT_SECRET || 'golive-jwt-secret-key';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;

  const accessToken = jwt.sign(payload, jwtSecret, { 
    expiresIn: jwtExpiresIn 
  } as jwt.SignOptions);
  
  const refreshToken = jwt.sign(
    { userId: user.id, tokenId: generateTokenId() }, 
    jwtRefreshSecret, 
    { expiresIn: '7d' } as jwt.SignOptions
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60, // 24 hours in seconds
    tokenType: 'Bearer' as const
  };
};

// Helper to convert Prisma user to our User type
const convertPrismaUserToUser = (prismaUser: any): User => {
  return {
    ...prismaUser,
    profile: prismaUser.profile ? {
      ...prismaUser.profile,
      skills: Array.isArray(prismaUser.profile.skills) ? prismaUser.profile.skills : [],
      preferences: prismaUser.profile.preferences as UserPreferences
    } : undefined
  };
};

const generateTokenId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * User Registration
 * POST /api/v1/auth/register
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = registerSchema.validate(req.body);
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

  const { email, username, firstName, lastName, password, company, position } = value as RegisterRequest;

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
      role: UserRole.DEVELOPER, // Default role
      isActive: true,
      isEmailVerified: false,
      profile: {
        create: {
          company: company || null,
          position: position || null,
          skills: [],
          preferences: {
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
          }
        }
      }
    },
    include: {
      profile: true
    }
  });

  // Generate tokens
  const userTyped = convertPrismaUserToUser(user);
  const tokens = generateTokens(userTyped);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  logger.info(`New user registered: ${email}`, {
    userId: user.id,
    email: user.email,
    username: user.username
  });

  const response: ApiResponse<LoginResponse> = {
    success: true,
    data: {
      user: convertPrismaUserToUser(userWithoutPassword),
      tokens,
      permissions: [] // Will be populated based on role
    },
    message: 'User registered successfully',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 201
  };

  res.status(201).json(response);
}));

/**
 * User Login
 * POST /api/v1/auth/login
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = loginSchema.validate(req.body);
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

  const { email, password, rememberMe } = value as LoginRequest;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { profile: true }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      message: 'Email or password is incorrect',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      error: 'Account disabled',
      message: 'Your account has been disabled. Please contact support.',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 403
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      message: 'Email or password is incorrect',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401
    });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate tokens
  const userTyped = convertPrismaUserToUser(user);
  const tokens = generateTokens(userTyped);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  logger.info(`User logged in: ${email}`, {
    userId: user.id,
    email: user.email,
    rememberMe
  });

  const response: ApiResponse<LoginResponse> = {
    success: true,
    data: {
      user: convertPrismaUserToUser(userWithoutPassword),
      tokens,
      permissions: [] // Will be populated based on role
    },
    message: 'Login successful',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Refresh Token
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Missing refresh token',
      message: 'Refresh token is required',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  try {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'golive-jwt-secret-key';
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as any;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'User not found or inactive',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 401
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user as User);

    const response: ApiResponse<{ tokens: typeof tokens }> = {
      success: true,
      data: { tokens },
      message: 'Tokens refreshed successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    res.status(200).json(response);

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      message: 'Refresh token is expired or invalid',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401
    });
  }
}));

/**
 * Logout
 * POST /api/v1/auth/logout
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // In a real implementation, you would blacklist the token
  // For now, we'll just return a success response
  
  logger.info('User logged out', {
    userId: req.body.userId,
    timestamp: new Date().toISOString()
  });

  const response: ApiResponse = {
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  };

  res.status(200).json(response);
}));

/**
 * Verify Token
 * GET /api/v1/auth/verify
 */
router.get('/verify', asyncHandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      message: 'Authorization token is required',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'golive-jwt-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Find user to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'User not found or inactive',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 401
      });
    }

    const response: ApiResponse<{ user: Omit<User, 'password'>, tokenValid: boolean }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: user.role as UserRole,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        tokenValid: true
      },
      message: 'Token is valid',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    };

    res.status(200).json(response);

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Token is expired or invalid',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401
    });
  }
}));

export default router;