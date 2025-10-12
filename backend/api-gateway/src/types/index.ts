// Core types and interfaces for the Comet DevOps Platform

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: any; // Will use Prisma type at runtime
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DEVELOPER = 'DEVELOPER',
  TESTER = 'TESTER',
  VIEWER = 'VIEWER'
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

// Request/Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  path: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Express request extensions
export interface AuthenticatedRequest extends Express.Request {
  user?: User;
  token?: string;
}

// Service communication types
export interface ServiceRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, string>;
  timeout?: number;
}

export interface ServiceResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
  message?: string;
}

// Health check types
export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: HealthCheck[];
  database: HealthCheck;
  redis: HealthCheck;
  version: string;
  uptime: number;
}

// Project and Pipeline types
export interface Project {
  id: string;
  name: string;
  description?: string;
  repositoryUrl: string;
  branch: string;
  framework: string;
  language: string;
  ownerId: string;
  teamId?: string;
  isActive: boolean;
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  enableCI: boolean;
  enableCD: boolean;
  enableTesting: boolean;
  enableCodeAnalysis: boolean;
  enableMonitoring: boolean;
  notifications: NotificationSettings;
  buildSettings: BuildSettings;
  deploymentSettings: DeploymentSettings;
}

export interface NotificationSettings {
  email: boolean;
  slack: boolean;
  webhook?: string;
  onSuccess: boolean;
  onFailure: boolean;
  onStart: boolean;
}

export interface BuildSettings {
  dockerEnabled: boolean;
  buildCommand?: string;
  testCommand?: string;
  environment: Record<string, string>;
  dependencies: string[];
}

export interface DeploymentSettings {
  environment: 'development' | 'staging' | 'production';
  deploymentTarget: string;
  autoRestart: boolean;
  healthCheckUrl?: string;
  rollbackOnFailure: boolean;
}

// Pipeline types
export interface Pipeline {
  id: string;
  projectId: string;
  name: string;
  trigger: PipelineTrigger;
  stages: PipelineStage[];
  status: PipelineStatus;
  lastRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum PipelineTrigger {
  MANUAL = 'MANUAL',
  GIT_PUSH = 'GIT_PUSH',
  GIT_PR = 'GIT_PR',
  SCHEDULE = 'SCHEDULE',
  WEBHOOK = 'WEBHOOK'
}

export enum PipelineStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING'
}

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  order: number;
  configuration: Record<string, any>;
  dependencies?: string[];
  parallel?: boolean;
  allowFailure?: boolean;
}

export enum StageType {
  BUILD = 'BUILD',
  TEST = 'TEST',
  SECURITY_SCAN = 'SECURITY_SCAN',
  CODE_ANALYSIS = 'CODE_ANALYSIS',
  DEPLOY = 'DEPLOY',
  NOTIFICATION = 'NOTIFICATION',
  APPROVAL = 'APPROVAL'
}

// Integration types
export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  configuration: Record<string, any>;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum IntegrationType {
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
  BITBUCKET = 'BITBUCKET',
  JENKINS = 'JENKINS',
  JIRA = 'JIRA',
  SLACK = 'SLACK',
  SONARQUBE = 'SONARQUBE',
  AWS = 'AWS',
  AZURE = 'AZURE',
  GCP = 'GCP'
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
  stack?: string;
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

// Metrics and monitoring types
export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

export interface Log {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  service: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}