import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Input Sanitization Middleware
 * Prevents XSS, SQL Injection, and other injection attacks
 */

/**
 * HTML entities to escape
 */
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

/**
 * Escape HTML special characters
 */
const escapeHtml = (str: string): string => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'\/]/g, (char) => htmlEntities[char]);
};

/**
 * Remove potentially dangerous SQL characters
 */
const sanitizeSql = (str: string): string => {
  if (typeof str !== 'string') return str;
  // Remove SQL comment indicators and semicolons
  return str.replace(/(-{2}|\/\*|\*\/|;|'|")/g, '');
};

/**
 * Remove null bytes and control characters
 */
const removeControlChars = (str: string): string => {
  if (typeof str !== 'string') return str;
  return str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
};

/**
 * Sanitize email addresses
 */
const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return email;
  // Convert to lowercase and trim
  email = email.toLowerCase().trim();
  // Remove any characters that aren't valid in email addresses
  email = email.replace(/[^a-z0-9@._+-]/gi, '');
  return email;
};

/**
 * Sanitize username (alphanumeric + underscore + hyphen)
 */
const sanitizeUsername = (username: string): string => {
  if (typeof username !== 'string') return username;
  return username.replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * Sanitize URL
 */
const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return url;

  // Only allow http and https protocols
  const urlPattern = /^https?:\/\//i;
  if (!urlPattern.test(url)) {
    return '';
  }

  // Remove any javascript: or data: protocols if somehow present
  url = url.replace(/javascript:|data:/gi, '');

  return url;
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj: any, depth = 0): any => {
  // Prevent deep recursion
  if (depth > 10) return obj;

  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const sanitizedKey = escapeHtml(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key], depth + 1);
      }
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    // Remove control characters first
    obj = removeControlChars(obj);
    // Escape HTML
    obj = escapeHtml(obj);
    return obj;
  }

  return obj;
};

/**
 * Field-specific sanitization
 */
const sanitizeField = (value: any, fieldName: string): any => {
  if (typeof value !== 'string') return value;

  // Email fields
  if (fieldName.toLowerCase().includes('email')) {
    return sanitizeEmail(value);
  }

  // Username fields
  if (fieldName.toLowerCase().includes('username')) {
    return sanitizeUsername(value);
  }

  // URL fields
  if (fieldName.toLowerCase().includes('url') ||
      fieldName.toLowerCase().includes('link') ||
      fieldName.toLowerCase().includes('href')) {
    return sanitizeUrl(value);
  }

  // Password fields - don't modify but remove control characters
  if (fieldName.toLowerCase().includes('password')) {
    return removeControlChars(value);
  }

  // Default: escape HTML and remove control characters
  return escapeHtml(removeControlChars(value));
};

/**
 * Sanitize request body
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    try {
      const sanitized: any = {};

      for (const key in req.body) {
        if (req.body.hasOwnProperty(key)) {
          const value = req.body[key];

          // Apply field-specific sanitization
          if (typeof value === 'string') {
            sanitized[key] = sanitizeField(value, key);
          } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
      }

      req.body = sanitized;

      logger.debug('Request body sanitized', {
        path: req.path,
        method: req.method
      });

    } catch (error: any) {
      logger.error('Error sanitizing request body', {
        error: error.message,
        path: req.path
      });
    }
  }

  next();
};

/**
 * Sanitize query parameters
 */
export const sanitizeQuery = (req: Request, res: Response, next: NextFunction): void => {
  if (req.query && typeof req.query === 'object') {
    try {
      const sanitized: any = {};

      for (const key in req.query) {
        if (req.query.hasOwnProperty(key)) {
          const value = req.query[key];

          if (typeof value === 'string') {
            sanitized[key] = escapeHtml(removeControlChars(value));
          } else if (Array.isArray(value)) {
            sanitized[key] = value.map(v =>
              typeof v === 'string' ? escapeHtml(removeControlChars(v)) : v
            );
          } else {
            sanitized[key] = value;
          }
        }
      }

      req.query = sanitized;

    } catch (error: any) {
      logger.error('Error sanitizing query parameters', {
        error: error.message,
        path: req.path
      });
    }
  }

  next();
};

/**
 * Sanitize route parameters
 */
export const sanitizeParams = (req: Request, res: Response, next: NextFunction): void => {
  if (req.params && typeof req.params === 'object') {
    try {
      const sanitized: any = {};

      for (const key in req.params) {
        if (req.params.hasOwnProperty(key)) {
          const value = req.params[key];

          if (typeof value === 'string') {
            sanitized[key] = escapeHtml(removeControlChars(value));
          } else {
            sanitized[key] = value;
          }
        }
      }

      req.params = sanitized;

    } catch (error: any) {
      logger.error('Error sanitizing route parameters', {
        error: error.message,
        path: req.path
      });
    }
  }

  next();
};

/**
 * Combined sanitization middleware
 * Sanitizes body, query, and params
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  sanitizeBody(req, res, () => {
    sanitizeQuery(req, res, () => {
      sanitizeParams(req, res, next);
    });
  });
};

/**
 * Strict sanitization for sensitive operations
 * Additional SQL injection prevention
 */
export const strictSanitize = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    try {
      const sanitized: any = {};

      for (const key in req.body) {
        if (req.body.hasOwnProperty(key)) {
          const value = req.body[key];

          if (typeof value === 'string') {
            let sanitizedValue = removeControlChars(value);
            sanitizedValue = sanitizeSql(sanitizedValue);
            sanitizedValue = escapeHtml(sanitizedValue);
            sanitized[key] = sanitizedValue;
          } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
      }

      req.body = sanitized;

    } catch (error: any) {
      logger.error('Error in strict sanitization', {
        error: error.message,
        path: req.path
      });
    }
  }

  next();
};
