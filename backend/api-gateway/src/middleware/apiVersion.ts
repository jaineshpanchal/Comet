import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * API Version Detection Middleware
 * Detects API version from URL, headers, or query parameters
 * Priority: URL > Header > Query > Default
 */
export const apiVersionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let apiVersion = 'v1'; // Default version

  // 1. Check URL path for version (e.g., /api/v1/users)
  const urlVersionMatch = req.path.match(/^\/api\/(v\d+)\//);
  if (urlVersionMatch) {
    apiVersion = urlVersionMatch[1];
  }
  // 2. Check Accept-Version header (e.g., Accept-Version: v1)
  else if (req.headers['accept-version']) {
    apiVersion = req.headers['accept-version'] as string;
  }
  // 3. Check X-API-Version header (e.g., X-API-Version: v1)
  else if (req.headers['x-api-version']) {
    apiVersion = req.headers['x-api-version'] as string;
  }
  // 4. Check query parameter (e.g., ?api_version=v1)
  else if (req.query.api_version) {
    apiVersion = req.query.api_version as string;
  }

  // Validate version format (v1, v2, etc.)
  const validVersionPattern = /^v\d+$/;
  if (!validVersionPattern.test(apiVersion)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid API version',
      message: `API version '${apiVersion}' is not valid. Use format: v1, v2, etc.`,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  // Check if version is supported
  const supportedVersions = ['v1'];
  if (!supportedVersions.includes(apiVersion)) {
    return res.status(400).json({
      success: false,
      error: 'Unsupported API version',
      message: `API version '${apiVersion}' is not supported. Supported versions: ${supportedVersions.join(', ')}`,
      supportedVersions,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    });
  }

  // Attach version to request object
  (req as any).apiVersion = apiVersion;

  // Add version to response headers
  res.setHeader('X-API-Version', apiVersion);

  // Log version usage for analytics
  logger.debug('API version detected', {
    version: apiVersion,
    path: req.path,
    method: req.method
  });

  next();
};

/**
 * API Version Info Endpoint Handler
 * Returns information about API versions
 */
export const apiVersionInfoHandler = (req: Request, res: Response) => {
  const versions = {
    current: 'v1',
    supported: ['v1'],
    deprecated: [],
    sunset: []
  };

  const versionDetails = {
    v1: {
      version: 'v1',
      status: 'stable',
      releaseDate: '2025-01-01',
      deprecationDate: null,
      sunsetDate: null,
      documentation: '/api/docs',
      features: [
        'Authentication & Authorization',
        'User Management',
        'Pipeline Management',
        'Testing Automation',
        'Deployment Management',
        'Metrics & Analytics',
        'WebSocket Support',
        'CSRF Protection'
      ]
    }
  };

  res.json({
    success: true,
    data: {
      ...versions,
      details: versionDetails
    },
    message: 'API version information',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: 200
  });
};

/**
 * Deprecation Warning Middleware
 * Adds deprecation warnings to response headers for deprecated API versions
 */
export const deprecationWarningMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiVersion = (req as any).apiVersion || 'v1';

  // Define deprecated versions with sunset dates
  const deprecatedVersions: Record<string, { sunsetDate: string; message: string }> = {
    // Example: 'v0': { sunsetDate: '2025-12-31', message: 'API v0 will be sunset on 2025-12-31' }
  };

  if (deprecatedVersions[apiVersion]) {
    const { sunsetDate, message } = deprecatedVersions[apiVersion];
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', sunsetDate);
    res.setHeader('Link', '</api/versions>; rel="successor-version"');

    logger.warn('Deprecated API version used', {
      version: apiVersion,
      path: req.path,
      sunsetDate,
      ip: req.ip
    });
  }

  next();
};

/**
 * Version-specific feature flag middleware
 * Enables/disables features based on API version
 */
export const versionFeatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiVersion = (req as any).apiVersion || 'v1';

  // Define version-specific features
  const versionFeatures: Record<string, string[]> = {
    v1: ['csrf', 'websocket', 'metrics', 'ai-services']
  };

  // Attach available features to request
  (req as any).apiFeatures = versionFeatures[apiVersion] || [];

  next();
};
