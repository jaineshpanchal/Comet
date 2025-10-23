import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * Secrets Management for GoLive Platform
 *
 * Supports multiple backends:
 * - AWS Secrets Manager (production)
 * - Environment variables (development)
 * - Encrypted local storage (development fallback)
 *
 * Features:
 * - Automatic secret rotation support
 * - Caching to reduce API calls
 * - Fallback mechanisms
 * - Type-safe secret access
 */

export interface SecretsConfig {
  provider: 'aws' | 'env' | 'vault';
  region?: string;
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
}

export interface Secret {
  value: string;
  version?: string;
  createdAt?: Date;
  expiresAt?: Date;
}

class SecretsManager {
  private config: SecretsConfig;
  private awsClient?: SecretsManagerClient;
  private cache: Map<string, { secret: Secret; expiresAt: number }>;

  constructor(config?: Partial<SecretsConfig>) {
    this.config = {
      provider: (process.env.SECRETS_PROVIDER as any) || 'env',
      region: process.env.AWS_REGION || 'us-east-1',
      cacheEnabled: process.env.SECRETS_CACHE_ENABLED !== 'false',
      cacheTTL: parseInt(process.env.SECRETS_CACHE_TTL || '300000'), // 5 minutes
      ...config,
    };

    this.cache = new Map();

    // Initialize AWS Secrets Manager client if using AWS
    if (this.config.provider === 'aws') {
      this.awsClient = new SecretsManagerClient({
        region: this.config.region,
      });
    }

    logger.info('[Secrets] Initialized', {
      provider: this.config.provider,
      cacheEnabled: this.config.cacheEnabled,
    });
  }

  /**
   * Get a secret by name
   */
  async getSecret(name: string): Promise<string> {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getCachedSecret(name);
      if (cached) {
        logger.debug('[Secrets] Cache hit', { name });
        return cached.value;
      }
    }

    // Fetch secret based on provider
    let secret: Secret;

    switch (this.config.provider) {
      case 'aws':
        secret = await this.getSecretFromAWS(name);
        break;

      case 'env':
      default:
        secret = this.getSecretFromEnv(name);
        break;
    }

    // Cache the secret
    if (this.config.cacheEnabled) {
      this.cacheSecret(name, secret);
    }

    return secret.value;
  }

  /**
   * Get multiple secrets at once
   */
  async getSecrets(names: string[]): Promise<Record<string, string>> {
    const secrets: Record<string, string> = {};

    await Promise.all(
      names.map(async (name) => {
        try {
          secrets[name] = await this.getSecret(name);
        } catch (error) {
          logger.error('[Secrets] Failed to get secret', { name, error });
          throw error;
        }
      })
    );

    return secrets;
  }

  /**
   * Fetch secret from AWS Secrets Manager
   */
  private async getSecretFromAWS(name: string): Promise<Secret> {
    if (!this.awsClient) {
      throw new Error('AWS Secrets Manager client not initialized');
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: name });
      const response = await this.awsClient.send(command);

      if (!response.SecretString) {
        throw new Error(`Secret ${name} has no value`);
      }

      logger.info('[Secrets] Retrieved from AWS', { name });

      return {
        value: response.SecretString,
        version: response.VersionId,
        createdAt: response.CreatedDate,
      };
    } catch (error: any) {
      logger.error('[Secrets] AWS fetch failed', { name, error: error.message });

      // Fallback to environment variable
      logger.warn('[Secrets] Falling back to environment variable', { name });
      return this.getSecretFromEnv(name);
    }
  }

  /**
   * Get secret from environment variables
   */
  private getSecretFromEnv(name: string): Secret {
    const value = process.env[name];

    if (!value) {
      throw new Error(`Secret ${name} not found in environment`);
    }

    return {
      value,
      createdAt: new Date(),
    };
  }

  /**
   * Get cached secret
   */
  private getCachedSecret(name: string): Secret | null {
    const cached = this.cache.get(name);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.secret;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(name);
    }

    return null;
  }

  /**
   * Cache a secret
   */
  private cacheSecret(name: string, secret: Secret): void {
    this.cache.set(name, {
      secret,
      expiresAt: Date.now() + this.config.cacheTTL,
    });
  }

  /**
   * Clear cache for a specific secret or all secrets
   */
  clearCache(name?: string): void {
    if (name) {
      this.cache.delete(name);
      logger.debug('[Secrets] Cache cleared for secret', { name });
    } else {
      this.cache.clear();
      logger.debug('[Secrets] All cache cleared');
    }
  }

  /**
   * Refresh a secret (clear cache and fetch new value)
   */
  async refreshSecret(name: string): Promise<string> {
    this.clearCache(name);
    return await this.getSecret(name);
  }
}

// Singleton instance
let secretsManager: SecretsManager;

/**
 * Initialize secrets manager
 */
export function initializeSecretsManager(config?: Partial<SecretsConfig>): void {
  secretsManager = new SecretsManager(config);
}

/**
 * Get secrets manager instance
 */
export function getSecretsManager(): SecretsManager {
  if (!secretsManager) {
    initializeSecretsManager();
  }
  return secretsManager;
}

/**
 * Helper: Get a secret value
 */
export async function getSecret(name: string): Promise<string> {
  return getSecretsManager().getSecret(name);
}

/**
 * Helper: Get multiple secrets
 */
export async function getSecrets(names: string[]): Promise<Record<string, string>> {
  return getSecretsManager().getSecrets(names);
}

/**
 * Helper: Refresh a secret
 */
export async function refreshSecret(name: string): Promise<string> {
  return getSecretsManager().refreshSecret(name);
}

/**
 * Helper: Clear cache
 */
export function clearSecretsCache(name?: string): void {
  getSecretsManager().clearCache(name);
}

/**
 * Typed secrets for the application
 */
export class AppSecrets {
  private static instance: AppSecrets;
  private secrets: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): AppSecrets {
    if (!AppSecrets.instance) {
      AppSecrets.instance = new AppSecrets();
    }
    return AppSecrets.instance;
  }

  /**
   * Load all application secrets
   */
  async loadSecrets(): Promise<void> {
    const secretNames = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'DATABASE_URL',
      'REDIS_URL',
      'ENCRYPTION_KEY',
      'CSRF_SECRET',
    ];

    try {
      const secrets = await getSecrets(secretNames);
      Object.entries(secrets).forEach(([key, value]) => {
        this.secrets.set(key, value);
      });

      logger.info('[AppSecrets] Loaded successfully', {
        count: this.secrets.size,
      });
    } catch (error) {
      logger.error('[AppSecrets] Failed to load secrets', { error });
      throw error;
    }
  }

  /**
   * Get JWT secret
   */
  get jwtSecret(): string {
    return this.getSecretOrThrow('JWT_SECRET');
  }

  /**
   * Get JWT refresh secret
   */
  get jwtRefreshSecret(): string {
    return this.getSecretOrThrow('JWT_REFRESH_SECRET');
  }

  /**
   * Get database URL
   */
  get databaseUrl(): string {
    return this.getSecretOrThrow('DATABASE_URL');
  }

  /**
   * Get Redis URL
   */
  get redisUrl(): string {
    return this.getSecretOrThrow('REDIS_URL');
  }

  /**
   * Get encryption key
   */
  get encryptionKey(): string {
    return this.getSecretOrThrow('ENCRYPTION_KEY');
  }

  /**
   * Get CSRF secret
   */
  get csrfSecret(): string {
    return this.getSecretOrThrow('CSRF_SECRET');
  }

  /**
   * Get a secret by name
   */
  private getSecretOrThrow(name: string): string {
    const value = this.secrets.get(name) || process.env[name];
    if (!value) {
      throw new Error(`Required secret ${name} not found`);
    }
    return value;
  }
}

/**
 * Utility: Encrypt sensitive data
 */
export function encrypt(text: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('Encryption key not configured');
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey.substring(0, 32)),
    iv
  );

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Utility: Decrypt sensitive data
 */
export function decrypt(encryptedText: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('Encryption key not configured');
  }

  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey.substring(0, 32)),
    iv
  );

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export default {
  initializeSecretsManager,
  getSecretsManager,
  getSecret,
  getSecrets,
  refreshSecret,
  clearSecretsCache,
  AppSecrets,
  encrypt,
  decrypt,
};
