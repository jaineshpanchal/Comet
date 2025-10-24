import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import path from 'path';

/**
 * Storage Service for S3-based file management
 *
 * Features:
 * - File upload/download
 * - Pre-signed URLs for secure access
 * - Multipart upload support
 * - File deletion and cleanup
 * - File metadata management
 * - Public/private file access
 */

// S3 Configuration
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

const s3Client = new S3Client(s3Config);

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'golive-files';
const CDN_URL = process.env.CDN_URL; // Optional CloudFront URL

// File categories for organization
export enum FileCategory {
  AVATAR = 'avatars',
  ARTIFACT = 'artifacts',
  REPORT = 'reports',
  ATTACHMENT = 'attachments',
  BACKUP = 'backups',
  TEMP = 'temp',
  LOG = 'logs',
}

// File access levels
export enum FileAccess {
  PUBLIC = 'public-read',
  PRIVATE = 'private',
  AUTHENTICATED = 'authenticated-read',
}

export interface UploadOptions {
  category?: FileCategory;
  access?: FileAccess;
  metadata?: Record<string, string>;
  contentType?: string;
  encrypt?: boolean;
  expiresIn?: number; // Seconds until file expires (for temp files)
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  etag: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  metadata?: Record<string, string>;
}

/**
 * Storage Service Class
 */
export class StorageService {
  /**
   * Generate a unique file key
   */
  private static generateFileKey(
    filename: string,
    category: FileCategory = FileCategory.ATTACHMENT,
    userId?: string
  ): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    const sanitized = basename.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

    const userPrefix = userId ? `${userId}/` : '';
    return `${category}/${userPrefix}${timestamp}-${randomString}-${sanitized}${ext}`;
  }

  /**
   * Upload a file to S3
   */
  static async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      category = FileCategory.ATTACHMENT,
      access = FileAccess.PRIVATE,
      metadata = {},
      contentType = 'application/octet-stream',
      encrypt = true,
    } = options;

    const key = this.generateFileKey(filename, category, metadata.userId);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: access,
      Metadata: metadata,
      ServerSideEncryption: encrypt ? 'AES256' : undefined,
    });

    try {
      const response = await s3Client.send(command);

      logger.info('File uploaded to S3', {
        key,
        size: fileBuffer.length,
        contentType,
      });

      const url = CDN_URL ? `${CDN_URL}/${key}` : await this.getPublicUrl(key);

      return {
        key,
        url,
        size: fileBuffer.length,
        contentType,
        etag: response.ETag || '',
      };
    } catch (error: any) {
      logger.error('File upload failed', {
        error: error.message,
        key,
      });
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Upload a stream to S3 (for large files)
   */
  static async uploadStream(
    stream: Readable,
    filename: string,
    size: number,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      category = FileCategory.ATTACHMENT,
      access = FileAccess.PRIVATE,
      metadata = {},
      contentType = 'application/octet-stream',
      encrypt = true,
    } = options;

    const key = this.generateFileKey(filename, category, metadata.userId);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: stream,
      ContentType: contentType,
      ACL: access,
      Metadata: metadata,
      ServerSideEncryption: encrypt ? 'AES256' : undefined,
      ContentLength: size,
    });

    try {
      const response = await s3Client.send(command);

      logger.info('Stream uploaded to S3', {
        key,
        size,
        contentType,
      });

      const url = CDN_URL ? `${CDN_URL}/${key}` : await this.getPublicUrl(key);

      return {
        key,
        url,
        size,
        contentType,
        etag: response.ETag || '',
      };
    } catch (error: any) {
      logger.error('Stream upload failed', {
        error: error.message,
        key,
      });
      throw new Error(`Stream upload failed: ${error.message}`);
    }
  }

  /**
   * Download a file from S3
   */
  static async downloadFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    try {
      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new Error('No file body in response');
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      logger.info('File downloaded from S3', {
        key,
        size: buffer.length,
      });

      return buffer;
    } catch (error: any) {
      logger.error('File download failed', {
        error: error.message,
        key,
      });
      throw new Error(`File download failed: ${error.message}`);
    }
  }

  /**
   * Get file stream from S3 (for large files)
   */
  static async getFileStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    try {
      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new Error('No file body in response');
      }

      logger.info('File stream retrieved from S3', { key });

      return response.Body as Readable;
    } catch (error: any) {
      logger.error('File stream retrieval failed', {
        error: error.message,
        key,
      });
      throw new Error(`File stream retrieval failed: ${error.message}`);
    }
  }

  /**
   * Generate a pre-signed URL for secure file access
   */
  static async getPresignedUrl(
    key: string,
    expiresIn: number = 3600, // 1 hour default
    download: boolean = false
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: download ? 'attachment' : 'inline',
    });

    try {
      const url = await getSignedUrl(s3Client, command, { expiresIn });

      logger.info('Pre-signed URL generated', {
        key,
        expiresIn,
      });

      return url;
    } catch (error: any) {
      logger.error('Pre-signed URL generation failed', {
        error: error.message,
        key,
      });
      throw new Error(`Pre-signed URL generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a pre-signed URL for uploading
   */
  static async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    category: FileCategory = FileCategory.ATTACHMENT,
    expiresIn: number = 300 // 5 minutes default
  ): Promise<{ url: string; key: string }> {
    const key = this.generateFileKey(filename, category);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    try {
      const url = await getSignedUrl(s3Client, command, { expiresIn });

      logger.info('Pre-signed upload URL generated', {
        key,
        contentType,
        expiresIn,
      });

      return { url, key };
    } catch (error: any) {
      logger.error('Pre-signed upload URL generation failed', {
        error: error.message,
        key,
      });
      throw new Error(`Pre-signed upload URL generation failed: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    try {
      await s3Client.send(command);

      logger.info('File deleted from S3', { key });
    } catch (error: any) {
      logger.error('File deletion failed', {
        error: error.message,
        key,
      });
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from S3
   */
  static async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });

    try {
      const response = await s3Client.send(command);

      logger.info('Multiple files deleted from S3', {
        count: keys.length,
        deleted: response.Deleted?.length || 0,
      });
    } catch (error: any) {
      logger.error('Bulk file deletion failed', {
        error: error.message,
        count: keys.length,
      });
      throw new Error(`Bulk file deletion failed: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(key: string): Promise<FileMetadata> {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    try {
      const response = await s3Client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || '',
        metadata: response.Metadata,
      };
    } catch (error: any) {
      logger.error('Failed to get file metadata', {
        error: error.message,
        key,
      });
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileMetadata(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List files in a category
   */
  static async listFiles(
    category: FileCategory,
    prefix?: string,
    maxKeys: number = 100
  ): Promise<FileMetadata[]> {
    const categoryPrefix = prefix ? `${category}/${prefix}` : `${category}/`;

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: categoryPrefix,
      MaxKeys: maxKeys,
    });

    try {
      const response = await s3Client.send(command);

      const files: FileMetadata[] = (response.Contents || []).map((obj) => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        contentType: 'application/octet-stream',
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || '',
      }));

      logger.info('Files listed from S3', {
        category,
        prefix,
        count: files.length,
      });

      return files;
    } catch (error: any) {
      logger.error('Failed to list files', {
        error: error.message,
        category,
        prefix,
      });
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Copy a file within S3
   */
  static async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${sourceKey}`,
      Key: destinationKey,
    });

    try {
      await s3Client.send(command);

      logger.info('File copied in S3', {
        sourceKey,
        destinationKey,
      });
    } catch (error: any) {
      logger.error('File copy failed', {
        error: error.message,
        sourceKey,
        destinationKey,
      });
      throw new Error(`File copy failed: ${error.message}`);
    }
  }

  /**
   * Get public URL for a file
   */
  private static async getPublicUrl(key: string): Promise<string> {
    if (CDN_URL) {
      return `${CDN_URL}/${key}`;
    }
    return `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`;
  }

  /**
   * Clean up expired temporary files
   */
  static async cleanupTempFiles(olderThanDays: number = 7): Promise<number> {
    const files = await this.listFiles(FileCategory.TEMP);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const expiredFiles = files.filter(
      (file) => file.lastModified < cutoffDate
    );

    if (expiredFiles.length > 0) {
      await this.deleteFiles(expiredFiles.map((f) => f.key));
    }

    logger.info('Temporary files cleaned up', {
      total: files.length,
      deleted: expiredFiles.length,
      olderThanDays,
    });

    return expiredFiles.length;
  }
}
