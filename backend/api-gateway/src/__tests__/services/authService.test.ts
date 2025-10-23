import { AuthService } from '../../services/authService';
import { db } from '../../config/database';
import { setCache, getCache, deleteCache } from '../../config/redis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../types';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../config/redis');
jest.mock('../../middleware/metrics', () => ({
  recordAuthAttempt: jest.fn()
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens for a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.DEVELOPER,
        isActive: true,
        password: 'hashed_password',
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        avatar: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock database calls
      (db.refreshToken.create as jest.Mock).mockResolvedValue({
        id: 'token-123',
        token: 'refresh_token',
        userId: mockUser.id,
        expiresAt: new Date()
      });

      (setCache as jest.Mock).mockResolvedValue(true);

      const tokens = await AuthService.generateTokens(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
      expect(tokens.tokenType).toBe('Bearer');
      expect(db.refreshToken.create).toHaveBeenCalled();
      expect(setCache).toHaveBeenCalled();
    });

    it('should store refresh token in database', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.DEVELOPER,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        password: 'hashed_password',
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        avatar: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.refreshToken.create as jest.Mock).mockResolvedValue({});
      (setCache as jest.Mock).mockResolvedValue(true);

      await AuthService.generateTokens(mockUser);

      expect(db.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            expiresAt: expect.any(Date)
          })
        })
      );
    });

    it('should cache user session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.DEVELOPER,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        password: 'hashed_password',
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        avatar: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.refreshToken.create as jest.Mock).mockResolvedValue({});
      (setCache as jest.Mock).mockResolvedValue(true);

      await AuthService.generateTokens(mockUser);

      expect(setCache).toHaveBeenCalledWith(
        `user_session:${mockUser.id}`,
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email
        }),
        expect.any(Number)
      );
    });
  });

  describe('login', () => {
    const mockLoginRequest = {
      email: 'test@example.com',
      password: 'Test123!@#'
    };

    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.DEVELOPER,
        isActive: true,
        password: await bcrypt.hash('Test123!@#', 12),
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        avatar: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue(mockUser);
      (db.refreshToken.create as jest.Mock).mockResolvedValue({});
      (setCache as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.login(mockLoginRequest);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw error for non-existent user', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.login(mockLoginRequest)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.DEVELOPER,
        isActive: false,
        password: await bcrypt.hash('Test123!@#', 12),
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        avatar: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      await expect(AuthService.login(mockLoginRequest)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.DEVELOPER,
        isActive: true,
        password: await bcrypt.hash('DifferentPassword', 12),
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        avatar: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(AuthService.login(mockLoginRequest)).rejects.toThrow('Invalid credentials');
    });

    it('should update lastLoginAt on successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.DEVELOPER,
        isActive: true,
        password: await bcrypt.hash('Test123!@#', 12),
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        avatar: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue(mockUser);
      (db.refreshToken.create as jest.Mock).mockResolvedValue({});
      (setCache as jest.Mock).mockResolvedValue(true);

      await AuthService.login(mockLoginRequest);

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) }
      });
    });

    it('should normalize email to lowercase', async () => {
      const loginWithUppercaseEmail = {
        email: 'TEST@EXAMPLE.COM',
        password: 'Test123!@#'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.DEVELOPER,
        isActive: true,
        password: await bcrypt.hash('Test123!@#', 12),
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        avatar: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue(mockUser);
      (db.refreshToken.create as jest.Mock).mockResolvedValue({});
      (setCache as jest.Mock).mockResolvedValue(true);

      await AuthService.login(loginWithUppercaseEmail);

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });
  });

  describe('register', () => {
    const mockRegisterRequest = {
      email: 'newuser@example.com',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#'
    };

    it('should successfully register a new user', async () => {
      (db.user.findFirst as jest.Mock).mockResolvedValue(null);
      (db.user.create as jest.Mock).mockResolvedValue({
        id: 'user-456',
        ...mockRegisterRequest,
        password: 'hashed_password',
        role: UserRole.DEVELOPER,
        isActive: true,
        isEmailVerified: false,
        emailVerificationToken: 'verification-token',
        passwordResetToken: null,
        passwordResetExpires: null,
        avatar: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      (db.refreshToken.create as jest.Mock).mockResolvedValue({});
      (setCache as jest.Mock).mockResolvedValue(true);

      // Mock email service
      jest.mock('../../services/emailService', () => ({
        EmailService: {
          sendVerificationEmail: jest.fn().mockResolvedValue(true)
        }
      }));

      const result = await AuthService.register(mockRegisterRequest);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('requiresEmailVerification');
      expect(result.requiresEmailVerification).toBe(true);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw error if passwords do not match', async () => {
      const mismatchedRequest = {
        ...mockRegisterRequest,
        confirmPassword: 'DifferentPassword'
      };

      await expect(AuthService.register(mismatchedRequest)).rejects.toThrow('Passwords do not match');
    });

    it('should throw error if email already exists', async () => {
      (db.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: mockRegisterRequest.email
      });

      await expect(AuthService.register(mockRegisterRequest)).rejects.toThrow(
        'User already exists with this email or username'
      );
    });

    it('should throw error if username already exists', async () => {
      (db.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        username: mockRegisterRequest.username
      });

      await expect(AuthService.register(mockRegisterRequest)).rejects.toThrow(
        'User already exists with this email or username'
      );
    });

    it('should hash password before storing', async () => {
      (db.user.findFirst as jest.Mock).mockResolvedValue(null);
      (db.user.create as jest.Mock).mockImplementation((data) => {
        expect(data.data.password).not.toBe(mockRegisterRequest.password);
        expect(data.data.password.length).toBeGreaterThan(50); // bcrypt hashes are long
        return Promise.resolve({
          id: 'user-456',
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
      (db.refreshToken.create as jest.Mock).mockResolvedValue({});
      (setCache as jest.Mock).mockResolvedValue(true);

      await AuthService.register(mockRegisterRequest);

      expect(db.user.create).toHaveBeenCalled();
    });

    it('should assign DEVELOPER role by default', async () => {
      (db.user.findFirst as jest.Mock).mockResolvedValue(null);
      (db.user.create as jest.Mock).mockImplementation((data) => {
        expect(data.data.role).toBe(UserRole.DEVELOPER);
        return Promise.resolve({
          id: 'user-456',
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
      (db.refreshToken.create as jest.Mock).mockResolvedValue({});
      (setCache as jest.Mock).mockResolvedValue(true);

      await AuthService.register(mockRegisterRequest);

      expect(db.user.create).toHaveBeenCalled();
    });

    it('should normalize email and username to lowercase', async () => {
      const uppercaseRequest = {
        ...mockRegisterRequest,
        email: 'NEWUSER@EXAMPLE.COM',
        username: 'NEWUSER'
      };

      (db.user.findFirst as jest.Mock).mockResolvedValue(null);
      (db.user.create as jest.Mock).mockImplementation((data) => {
        expect(data.data.email).toBe('newuser@example.com');
        expect(data.data.username).toBe('newuser');
        return Promise.resolve({
          id: 'user-456',
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
      (db.refreshToken.create as jest.Mock).mockResolvedValue({});
      (setCache as jest.Mock).mockResolvedValue(true);

      await AuthService.register(uppercaseRequest);

      expect(db.user.create).toHaveBeenCalled();
    });
  });

  describe('parseTimeToSeconds', () => {
    it('should parse time strings correctly', () => {
      expect((AuthService as any).parseTimeToSeconds('60s')).toBe(60);
      expect((AuthService as any).parseTimeToSeconds('5m')).toBe(300);
      expect((AuthService as any).parseTimeToSeconds('2h')).toBe(7200);
      expect((AuthService as any).parseTimeToSeconds('1d')).toBe(86400);
      expect((AuthService as any).parseTimeToSeconds('7d')).toBe(604800);
    });

    it('should default to seconds if no unit specified', () => {
      expect((AuthService as any).parseTimeToSeconds('3600')).toBe(3600);
    });
  });

  describe('demo mode', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should allow demo login in development mode when enabled', async () => {
      process.env.ENABLE_DEMO_MODE = 'true';
      process.env.DEMO_USER_EMAIL = 'demo@example.com';
      process.env.DEMO_USER_PASSWORD = 'DemoPassword123';
      process.env.NODE_ENV = 'development';

      const result = await AuthService.login({
        email: 'demo@example.com',
        password: 'DemoPassword123'
      });

      expect(result.user.email).toBe('demo@example.com');
      expect(result.tokens).toHaveProperty('accessToken');
    });

    it('should reject demo login in production mode', async () => {
      process.env.ENABLE_DEMO_MODE = 'true';
      process.env.DEMO_USER_EMAIL = 'demo@example.com';
      process.env.DEMO_USER_PASSWORD = 'DemoPassword123';
      process.env.NODE_ENV = 'production';

      await expect(
        AuthService.login({
          email: 'demo@example.com',
          password: 'DemoPassword123'
        })
      ).rejects.toThrow('Demo mode is not available in production');
    });

    it('should not allow demo login when demo mode is disabled', async () => {
      process.env.ENABLE_DEMO_MODE = 'false';
      process.env.DEMO_USER_EMAIL = 'demo@example.com';
      process.env.DEMO_USER_PASSWORD = 'DemoPassword123';

      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthService.login({
          email: 'demo@example.com',
          password: 'DemoPassword123'
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
