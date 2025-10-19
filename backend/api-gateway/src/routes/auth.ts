// Authentication routes
import { Router, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';
import { authenticateToken } from '../middleware/auth';
import { 
  LoginRequest, 
  RegisterRequest, 
  ChangePasswordRequest,
  ResetPasswordRequest 
} from '../types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - firstName
 *               - lastName
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: User already exists
 */
router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const registerData: RegisterRequest = req.body;

    // Basic validation
    if (!registerData.email || !registerData.username || !registerData.firstName || 
        !registerData.lastName || !registerData.password || !registerData.confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
        message: 'Please provide all required fields',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }

    // Password validation
    if (registerData.password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password too short',
        message: 'Password must be at least 8 characters long',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }

    const result = await AuthService.register(registerData);

    logger.info('User registered successfully', {
      userId: result.user.id,
      email: result.user.email
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 201
    });
  } catch (error: any) {
    logger.error('Registration failed', {
      error: error.message,
      email: req.body.email
    });

    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Registration failed',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loginData: LoginRequest = req.body;

    // Basic validation
    if (!loginData.email || !loginData.password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        message: 'Please provide both email and password',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }

    const result = await AuthService.login(loginData);

    logger.info('User logged in successfully', {
      userId: result.user.id,
      email: result.user.email
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        tokens: result.tokens
      },
      message: 'Login successful',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.warn('Login failed', {
      error: error.message,
      email: req.body.email
    });

    res.status(401).json({
      success: false,
      error: error.message,
      message: 'Login failed',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        message: 'Please provide a refresh token',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }

    const tokens = await AuthService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: { tokens },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.warn('Token refresh failed', {
      error: error.message
    });

    res.status(401).json({
      success: false,
      error: error.message,
      message: 'Token refresh failed',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Authentication required
 */
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    await AuthService.logout(req.user!.id, refreshToken);

    logger.info('User logged out successfully', {
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Logout failed', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await AuthService.getUserProfile(req.user!.id);

    res.json({
      success: true,
      data: { user },
      message: 'Profile retrieved successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Failed to get user profile', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: 'An error occurred while retrieving profile',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Authentication required
 */
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updateData = req.body;
    const user = await AuthService.updateUserProfile(req.user!.id, updateData);

    logger.info('User profile updated', {
      userId: req.user!.id
    });

    res.json({
      success: true,
      data: { user },
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Failed to update user profile', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: 'An error occurred while updating profile',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500
    });
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Authentication required or incorrect current password
 */
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const changePasswordData: ChangePasswordRequest = req.body;

    // Basic validation
    if (!changePasswordData.currentPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All password fields are required',
        message: 'Please provide current password, new password, and confirmation',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }

    await AuthService.changePassword(req.user!.id, changePasswordData);

    logger.info('User password changed', {
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Failed to change password', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to change password',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent (if email exists)
 */
router.post('/forgot-password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        message: 'Please provide your email address',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }

    await AuthService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Password reset request failed', {
      error: error.message,
      email: req.body.email
    });

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid input data or token
 */
router.post('/reset-password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resetPasswordData: ResetPasswordRequest = req.body;

    // Basic validation
    if (!resetPasswordData.token || !resetPasswordData.newPassword || !resetPasswordData.confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
        message: 'Please provide token, new password, and confirmation',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }

    await AuthService.resetPassword(resetPasswordData);

    res.json({
      success: true,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Password reset failed', {
      error: error.message
    });

    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Password reset failed',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }
});

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/verify-email', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required',
        message: 'Please provide a verification token',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }

    await AuthService.verifyEmail(token);

    logger.info('Email verified successfully', { token: token.substring(0, 8) + '...' });

    res.json({
      success: true,
      message: 'Email verified successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Email verification failed', {
      error: error.message
    });

    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Email verification failed',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }
});

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Invalid request
 */
router.post('/resend-verification', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        message: 'Please provide an email address',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 400
      });
    }

    await AuthService.resendVerificationEmail(email);

    logger.info('Verification email resent', { email });

    res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Failed to resend verification email', {
      error: error.message
    });

    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to resend verification email',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }
});

export default router;