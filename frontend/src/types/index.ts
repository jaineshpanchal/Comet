// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  DEVELOPER = "DEVELOPER",
  TESTER = "TESTER",
  VIEWER = "VIEWER",
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

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

// Pipeline Types
export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  status: PipelineStatus;
  branch: string;
  commit: string;
  author: string;
  duration?: number; // in seconds
  progress?: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  steps: PipelineStep[];
  triggers: PipelineTrigger[];
  environment?: string;
  tags: string[];
}

export enum PipelineStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PAUSED = "paused",
}

export interface PipelineStep {
  id: string;
  name: string;
  type: StepType;
  status: StepStatus;
  duration?: number;
  startedAt?: Date;
  completedAt?: Date;
  logs: string[];
  artifacts?: Artifact[];
  config: Record<string, any>;
}

export enum StepType {
  CHECKOUT = "checkout",
  BUILD = "build",
  TEST = "test",
  DEPLOY = "deploy",
  SCAN = "scan",
  NOTIFY = "notify",
}

export enum StepStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  SKIPPED = "skipped",
}

export interface PipelineTrigger {
  id: string;
  type: TriggerType;
  config: Record<string, any>;
  isActive: boolean;
}

export enum TriggerType {
  WEBHOOK = "webhook",
  SCHEDULE = "schedule",
  MANUAL = "manual",
  TAG = "tag",
  PULL_REQUEST = "pull_request",
}

// Testing Types
export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  type: TestType;
  status: TestStatus;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: TestCoverage;
  lastRun?: Date;
  tests: TestCase[];
}

export enum TestType {
  UNIT = "unit",
  INTEGRATION = "integration",
  E2E = "e2e",
  PERFORMANCE = "performance",
  SECURITY = "security",
}

export enum TestStatus {
  PENDING = "pending",
  RUNNING = "running",
  PASSED = "passed",
  FAILED = "failed",
  SKIPPED = "skipped",
}

export interface TestCase {
  id: string;
  name: string;
  status: TestStatus;
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  assertions: number;
}

export interface TestCoverage {
  percentage: number;
  lines: {
    total: number;
    covered: number;
  };
  functions: {
    total: number;
    covered: number;
  };
  branches: {
    total: number;
    covered: number;
  };
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  repositoryUrl: string;
  defaultBranch: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  ownerId: string;
  owner: User;
  teamMembers: TeamMember[];
  pipelines: Pipeline[];
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
}

export enum ProjectStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

export enum ProjectVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
  INTERNAL = "internal",
}

export interface TeamMember {
  id: string;
  userId: string;
  user: User;
  role: ProjectRole;
  permissions: Permission[];
  joinedAt: Date;
}

export enum ProjectRole {
  OWNER = "owner",
  ADMIN = "admin",
  DEVELOPER = "developer",
  TESTER = "tester",
  VIEWER = "viewer",
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface ProjectSettings {
  buildTimeout: number;
  testTimeout: number;
  retryAttempts: number;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
}

// Deployment Types
export interface Deployment {
  id: string;
  name: string;
  pipelineId: string;
  environment: Environment;
  status: DeploymentStatus;
  version: string;
  artifact: Artifact;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  deployedBy: string;
  rollbackDeploymentId?: string;
}

export enum DeploymentStatus {
  PENDING = "pending",
  DEPLOYING = "deploying",
  SUCCESS = "success",
  FAILED = "failed",
  ROLLING_BACK = "rolling_back",
  ROLLED_BACK = "rolled_back",
}

export interface Environment {
  id: string;
  name: string;
  type: EnvironmentType;
  url?: string;
  config: Record<string, any>;
  isActive: boolean;
}

export enum EnvironmentType {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
  TESTING = "testing",
}

export interface Artifact {
  id: string;
  name: string;
  type: ArtifactType;
  size: number;
  checksum: string;
  downloadUrl: string;
  createdAt: Date;
}

export enum ArtifactType {
  BINARY = "binary",
  CONTAINER = "container",
  PACKAGE = "package",
  DOCUMENT = "document",
}

// Monitoring and Analytics Types
export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

export interface Alert {
  id: string;
  name: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  source: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum AlertStatus {
  ACTIVE = "active",
  ACKNOWLEDGED = "acknowledged",
  RESOLVED = "resolved",
}

// Integration Types
export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  config: Record<string, any>;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum IntegrationType {
  GITHUB = "github",
  GITLAB = "gitlab",
  BITBUCKET = "bitbucket",
  JIRA = "jira",
  SLACK = "slack",
  TEAMS = "teams",
  JENKINS = "jenkins",
  SONARQUBE = "sonarqube",
}

export interface NotificationSettings {
  email: boolean;
  slack: boolean;
  teams: boolean;
  webhook: boolean;
  inApp: boolean;
}

export interface IntegrationSettings {
  github?: GitHubSettings;
  jira?: JiraSettings;
  slack?: SlackSettings;
  sonarqube?: SonarQubeSettings;
}

export interface GitHubSettings {
  enabled: boolean;
  repositoryUrl: string;
  webhookSecret: string;
  accessToken: string;
}

export interface JiraSettings {
  enabled: boolean;
  serverUrl: string;
  username: string;
  apiToken: string;
  projectKey: string;
}

export interface SlackSettings {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  notifications: {
    pipelineStart: boolean;
    pipelineSuccess: boolean;
    pipelineFailure: boolean;
    deploymentSuccess: boolean;
    deploymentFailure: boolean;
  };
}

export interface SonarQubeSettings {
  enabled: boolean;
  serverUrl: string;
  token: string;
  projectKey: string;
}

// API Response Types
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
  sortOrder?: "asc" | "desc";
  search?: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: Date;
}

export enum WebSocketMessageType {
  PIPELINE_STATUS_CHANGED = "pipeline_status_changed",
  STEP_STATUS_CHANGED = "step_status_changed",
  TEST_RESULT_UPDATED = "test_result_updated",
  DEPLOYMENT_STATUS_CHANGED = "deployment_status_changed",
  ALERT_TRIGGERED = "alert_triggered",
  METRIC_UPDATED = "metric_updated",
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  loading: boolean;
  submitted: boolean;
}

// Theme Types
export type Theme = "light" | "dark" | "system";

export interface ThemeConfig {
  theme: Theme;
  primaryColor: string;
  fontFamily: string;
  fontSize: string;
  borderRadius: string;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  subItems?: NavItem[];
  permissions?: string[];
}

// Dashboard Types
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
}

export enum WidgetType {
  METRIC_CARD = "metric_card",
  CHART = "chart",
  PIPELINE_STATUS = "pipeline_status",
  TEST_RESULTS = "test_results",
  DEPLOYMENT_STATUS = "deployment_status",
  ACTIVITY_FEED = "activity_feed",
}

export interface DashboardConfig {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  layout: "grid" | "flex";
  isDefault: boolean;
}