/**
 * Encryption Service
 * Handles encryption and decryption of sensitive data using AES-256-GCM
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits

export class EncryptionService {
  private static masterKey: Buffer;

  /**
   * Initialize encryption service with master key
   * The master key should be stored securely (e.g., in environment variables or a key management service)
   */
  static initialize(): void {
    const masterKeyString = process.env.ENCRYPTION_KEY;

    if (!masterKeyString) {
      // For development, generate a random key
      // In production, this should come from a secure key management service
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY environment variable is required in production');
      }

      logger.warn('ENCRYPTION_KEY not set, generating a random key for development');
      this.masterKey = crypto.randomBytes(KEY_LENGTH);
    } else {
      // Derive key from the master key string
      this.masterKey = crypto.scryptSync(masterKeyString, 'salt', KEY_LENGTH);
    }

    logger.info('Encryption service initialized');
  }

  /**
   * Encrypt a plaintext string
   * Returns a base64-encoded string containing: salt + iv + authTag + encryptedData
   */
  static encrypt(plaintext: string): string {
    try {
      if (!this.masterKey) {
        this.initialize();
      }

      // Generate random salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derive encryption key from master key and salt
      const key = crypto.pbkdf2Sync(this.masterKey, salt, 100000, KEY_LENGTH, 'sha512');

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Encrypt the plaintext
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine salt + iv + authTag + encrypted data
      const result = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
      ]);

      // Return as base64
      return result.toString('base64');
    } catch (error: any) {
      logger.error('Encryption failed', { error: error.message });
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt an encrypted string
   * Expects a base64-encoded string containing: salt + iv + authTag + encryptedData
   */
  static decrypt(encryptedData: string): string {
    try {
      if (!this.masterKey) {
        this.initialize();
      }

      // Decode from base64
      const buffer = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = buffer.subarray(0, SALT_LENGTH);
      const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = buffer.subarray(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
      );
      const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

      // Derive decryption key from master key and salt
      const key = crypto.pbkdf2Sync(this.masterKey, salt, 100000, KEY_LENGTH, 'sha512');

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      logger.error('Decryption failed', { error: error.message });
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash a string using SHA-256
   * Useful for storing hashed values that don't need to be decrypted
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Compare a plaintext string with a hashed value
   */
  static compareHash(plaintext: string, hash: string): boolean {
    const plaintextHash = this.hash(plaintext);
    return crypto.timingSafeEqual(Buffer.from(plaintextHash), Buffer.from(hash));
  }

  /**
   * Generate a secure random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Mask a secret value for display (shows only first and last 4 characters)
   */
  static maskSecret(secret: string): string {
    if (secret.length <= 8) {
      return '****';
    }
    return `${secret.substring(0, 4)}${'*'.repeat(secret.length - 8)}${secret.substring(secret.length - 4)}`;
  }
}

// Initialize on module load
EncryptionService.initialize();
