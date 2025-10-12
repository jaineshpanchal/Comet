// Authentication service
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { APP_CONFIG } from '../config/services';
import { db } from '../config/database';
import { setCache, getCache, deleteCache } from '../config/redis';
import { 
  User, 
  AuthTokens, 
  JWTPayload, 
  RefreshTokenPayload, 
  LoginRequest, 
  RegisterRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  UserRole 
} from '../types';

export class AuthService {
  // Generate JWT tokens
  static async generateTokens(user: User): Promise<AuthTokens> {
    const accessTokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseTimeToSeconds(APP_CONFIG.JWT_EXPIRES_IN)
    };

    const refreshTokenId = uuidv4();
    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user.id,
      tokenId: refreshTokenId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseTimeToSeconds(APP_CONFIG.JWT_REFRESH_EXPIRES_IN)
    };

    const accessToken = jwt.sign(accessTokenPayload, APP_CONFIG.JWT_SECRET);
    const refreshToken = jwt.sign(refreshTokenPayload, APP_CONFIG.JWT_SECRET);

    // Store refresh token in database
    await db.refreshToken.create({
      data: {
        id: refreshTokenId,
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(refreshTokenPayload.exp * 1000)
      }
    });

    // Cache user session
    await setCache(
      `user_session:${user.id}`,
      { 
        ...user, 
        tokenId: refreshTokenId 
      },
      this.parseTimeToSeconds(APP_CONFIG.JWT_EXPIRES_IN)
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseTimeToSeconds(APP_CONFIG.JWT_EXPIRES_IN),
      tokenType: 'Bearer'
    };
  }

  // Login user
  static async login(loginRequest: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = loginRequest;

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      tokens
    };
  }

  // Register new user
  static async register(registerRequest: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, username, firstName, lastName, password, confirmPassword } = registerRequest;

    // Validate passwords match
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User already exists with this email or username');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        firstName,
        lastName,
        password: hashedPassword,
        role: UserRole.DEVELOPER
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens(newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword as User,
      tokens
    };
  }

  // Refresh tokens
  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, APP_CONFIG.JWT_SECRET) as RefreshTokenPayload;

      // Check if refresh token exists in database
      const storedToken = await db.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      if (!storedToken.user.isActive) {
        throw new Error('User account is deactivated');
      }

      // Delete old refresh token
      await db.refreshToken.delete({
        where: { id: storedToken.id }
      });

      // Generate new tokens
      const tokens = await this.generateTokens(storedToken.user);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Logout user
  static async logout(userId: string, refreshToken?: string): Promise<void> {
    // Delete refresh token from database
    if (refreshToken) {
      await db.refreshToken.deleteMany({
        where: { 
          userId,
          token: refreshToken 
        }
      });
    } else {
      // Delete all refresh tokens for user
      await db.refreshToken.deleteMany({
        where: { userId }
      });
    }

    // Remove user session from cache
    await deleteCache(`user_session:${userId}`);
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, APP_CONFIG.JWT_SECRET) as JWTPayload;

      // Check cache first
      const cachedUser = await getCache(`user_session:${decoded.userId}`);
      if (cachedUser) {
        return cachedUser;
      }

      // Get user from database
      const user = await db.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid token');
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // Cache user
      await setCache(
        `user_session:${user.id}`,
        userWithoutPassword,
        this.parseTimeToSeconds(APP_CONFIG.JWT_EXPIRES_IN)
      );

      return userWithoutPassword as User;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Change password
  static async changePassword(userId: string, changePasswordRequest: ChangePasswordRequest): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordRequest;

    // Validate new passwords match
    if (newPassword !== confirmPassword) {
      throw new Error('New passwords do not match');
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Invalidate all sessions
    await this.logout(userId);
  }

  // Request password reset
  static async requestPasswordReset(email: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in cache
    await setCache(`password_reset:${resetToken}`, user.id, 3600); // 1 hour

    // TODO: Send email with reset token
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  // Reset password
  static async resetPassword(resetPasswordRequest: ResetPasswordRequest): Promise<void> {
    const { token, newPassword, confirmPassword } = resetPasswordRequest;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Get user ID from cache
    const userId = await getCache(`password_reset:${token}`);
    if (!userId) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Delete reset token
    await deleteCache(`password_reset:${token}`);

    // Invalidate all sessions
    await this.logout(userId);
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<User> {
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  // Update user profile
  static async updateUserProfile(userId: string, updateData: Partial<User>): Promise<User> {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        avatar: updateData.avatar,
        updatedAt: new Date()
      }
    });

    // Invalidate cache
    await deleteCache(`user_session:${userId}`);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  // Utility function to parse time strings to seconds
  private static parseTimeToSeconds(timeString: string): number {
    const match = timeString.match(/^(\d+)([dhm])$/);
    if (!match) {
      throw new Error('Invalid time format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60;
      case 'h':
        return value * 60 * 60;
      case 'm':
        return value * 60;
      default:
        throw new Error('Invalid time unit');
    }
  }
}