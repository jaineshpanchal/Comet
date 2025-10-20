// Service configuration and discovery
export interface ServiceConfig {
  name: string;
  host: string;
  port: number;
  path: string;
  healthCheck: string;
  timeout: number;
  retries: number;
}

// Backend services configuration
export const SERVICES: Record<string, ServiceConfig> = {
  PIPELINE: {
    name: 'pipeline-service',
    host: process.env.PIPELINE_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.PIPELINE_SERVICE_PORT || '8001'),
    path: '/api/v1/pipeline',
    healthCheck: '/health',
    timeout: 30000,
    retries: 3
  },
  TESTING: {
    name: 'testing-service',
    host: process.env.TESTING_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.TESTING_SERVICE_PORT || '8002'),
    path: '/api/v1/testing',
    healthCheck: '/health',
    timeout: 30000,
    retries: 3
  },
  INTEGRATION: {
    name: 'integration-service',
    host: process.env.INTEGRATION_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.INTEGRATION_SERVICE_PORT || '8003'),
    path: '/api/v1/integration',
    healthCheck: '/health',
    timeout: 30000,
    retries: 3
  },
  CODE_ANALYSIS: {
    name: 'code-analysis-service',
    host: process.env.CODE_ANALYSIS_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.CODE_ANALYSIS_SERVICE_PORT || '8004'),
    path: '/api/v1/analysis',
    healthCheck: '/health',
    timeout: 30000,
    retries: 3
  },
  MONITORING: {
    name: 'monitoring-service',
    host: process.env.MONITORING_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.MONITORING_SERVICE_PORT || '8005'),
    path: '/api/v1/monitoring',
    healthCheck: '/health',
    timeout: 30000,
    retries: 3
  },
  AI_SERVICES: {
    name: 'ai-services',
    host: process.env.AI_SERVICES_HOST || 'localhost',
    port: parseInt(process.env.AI_SERVICES_PORT || '9000'),
    path: '/api/v1/ai',
    healthCheck: '/health',
    timeout: 60000,
    retries: 2
  }
};

// Service URL builder
export const getServiceUrl = (serviceName: keyof typeof SERVICES, endpoint?: string): string => {
  const service = SERVICES[serviceName];
  const baseUrl = `http://${service.host}:${service.port}${service.path}`;
  return endpoint ? `${baseUrl}${endpoint}` : baseUrl;
};

// Health check URL builder
export const getHealthCheckUrl = (serviceName: keyof typeof SERVICES): string => {
  const service = SERVICES[serviceName];
  return `http://${service.host}:${service.port}${service.healthCheck}`;
};

// Application configuration
export const APP_CONFIG = {
  PORT: parseInt(process.env.API_GATEWAY_PORT || '8000'),
  HOST: process.env.API_GATEWAY_HOST || 'localhost',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'golive-jwt-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Rate limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // File upload
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '50MB',
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  
  // Features
  ENABLE_SWAGGER: process.env.NODE_ENV === 'development',
  ENABLE_REQUEST_LOGGING: true,
  ENABLE_METRICS: true,
};

// Validation
const validateConfig = (): void => {
  const requiredEnvVars = [
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'REDIS_HOST', 'REDIS_PORT'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Initialize configuration
export const initializeConfig = (): void => {
  try {
    validateConfig();
    console.log('✅ Configuration validated successfully');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    process.exit(1);
  }
};