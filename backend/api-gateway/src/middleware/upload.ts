import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { logger } from '../utils/logger';

/**
 * File Upload Middleware using Multer
 *
 * Features:
 * - Memory storage for S3 upload
 * - File type validation
 * - File size limits
 * - Multiple file upload support
 */

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const ALLOWED_ARCHIVE_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-tar',
  'application/gzip',
];

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_ARCHIVE_TYPES,
];

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024,       // 5 MB
  DOCUMENT: 50 * 1024 * 1024,    // 50 MB
  ARTIFACT: 500 * 1024 * 1024,   // 500 MB
  REPORT: 100 * 1024 * 1024,     // 100 MB
  DEFAULT: 10 * 1024 * 1024,     // 10 MB
};

/**
 * File filter for multer
 */
function fileFilter(
  allowedTypes: string[] = ALL_ALLOWED_TYPES
): (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => void {
  return (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      logger.warn('File type not allowed', {
        filename: file.originalname,
        mimetype: file.mimetype,
      });
      callback(new Error(`File type ${file.mimetype} not allowed`));
    }
  };
}

/**
 * Memory storage configuration
 * Files are stored in memory as Buffer for direct S3 upload
 */
const storage = multer.memoryStorage();

/**
 * Avatar upload middleware
 * - Single file
 * - Images only
 * - Max 5 MB
 */
export const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.AVATAR,
    files: 1,
  },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
}).single('avatar');

/**
 * Document upload middleware
 * - Single file
 * - Documents only
 * - Max 50 MB
 */
export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.DOCUMENT,
    files: 1,
  },
  fileFilter: fileFilter(ALLOWED_DOCUMENT_TYPES),
}).single('document');

/**
 * Artifact upload middleware
 * - Single file
 * - Archives only
 * - Max 500 MB
 */
export const uploadArtifact = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.ARTIFACT,
    files: 1,
  },
  fileFilter: fileFilter(ALLOWED_ARCHIVE_TYPES),
}).single('artifact');

/**
 * Multiple files upload middleware
 * - Up to 10 files
 * - All allowed types
 * - Max 10 MB per file
 */
export const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.DEFAULT,
    files: 10,
  },
  fileFilter: fileFilter(ALL_ALLOWED_TYPES),
}).array('files', 10);

/**
 * Generic single file upload middleware
 * - All allowed types
 * - Max 10 MB
 */
export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.DEFAULT,
    files: 1,
  },
  fileFilter: fileFilter(ALL_ALLOWED_TYPES),
}).single('file');

/**
 * Report upload middleware
 * - Single file
 * - Documents/PDFs
 * - Max 100 MB
 */
export const uploadReport = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.REPORT,
    files: 1,
  },
  fileFilter: fileFilter([...ALLOWED_DOCUMENT_TYPES, 'application/json']),
}).single('report');

/**
 * Validate file size helper
 */
export function validateFileSize(size: number, limit: number): boolean {
  return size <= limit;
}

/**
 * Validate file type helper
 */
export function validateFileType(mimetype: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimetype);
}

/**
 * Get file extension from mimetype
 */
export function getExtensionFromMimetype(mimetype: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'application/x-tar': '.tar',
    'application/gzip': '.gz',
    'application/json': '.json',
  };

  return extensions[mimetype] || '';
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}
