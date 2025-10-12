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
  isEmailVerified: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile;
  teamMemberships?: TeamMember[];
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  timezone?: string;
  language?: string;
  phoneNumber?: string;
  company?: string;
  position?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills: string[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  slack: boolean;
  inApp: boolean;
  push: boolean;
  pipelineUpdates: boolean;
  deploymentUpdates: boolean;
  testResults: boolean;
  securityAlerts: boolean;
}

export interface DashboardPreferences {
  defaultView: 'overview' | 'pipelines' | 'deployments';
  refreshInterval: number;
  widgets: string[];
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
  company?: string;
  position?: string;
}

export interface LoginResponse {
  user: Omit<User, 'profile'>;
  tokens: AuthTokens;
  permissions: string[];
}

// Team Management Types
export interface Team {
  id: string;
  name: string;
  description?: string;
  slug: string;
  avatar?: string;
  isActive: boolean;
  ownerId: string;
  owner: User;
  members: TeamMember[];
  projects: string[]; // Project IDs
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  user: User;
  role: TeamRole;
  permissions: TeamPermission[];
  joinedAt: Date;
  invitedBy: string;
  isActive: boolean;
}

export enum TeamRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  GUEST = "GUEST",
}

export interface TeamPermission {
  id: string;
  resource: TeamResource;
  actions: TeamAction[];
}

export enum TeamResource {
  PROJECTS = "PROJECTS",
  PIPELINES = "PIPELINES",
  DEPLOYMENTS = "DEPLOYMENTS",
  SETTINGS = "SETTINGS",
  MEMBERS = "MEMBERS",
}

export enum TeamAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  EXECUTE = "EXECUTE",
}

export interface TeamSettings {
  visibility: 'public' | 'private' | 'internal';
  allowSelfJoin: boolean;
  requireApproval: boolean;
  defaultRole: TeamRole;
  integrations: {
    slack?: SlackIntegration;
    github?: GitHubIntegration;
  };
}

export interface SlackIntegration {
  enabled: boolean;
  webhookUrl?: string;
  channel?: string;
  notifications: {
    deployments: boolean;
    pipelines: boolean;
    issues: boolean;
  };
}

export interface GitHubIntegration {
  enabled: boolean;
  organizationName?: string;
  accessToken?: string;
  repositories: string[];
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
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Request/Response interfaces
export interface CreateUserRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: UserRole;
  profile?: Partial<UserProfile>;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
  profile?: Partial<UserProfile>;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  slug: string;
  avatar?: string;
  settings?: Partial<TeamSettings>;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  avatar?: string;
  settings?: Partial<TeamSettings>;
}

export interface InviteTeamMemberRequest {
  email: string;
  role: TeamRole;
  permissions?: TeamPermission[];
  message?: string;
}

export interface UpdateTeamMemberRequest {
  role?: TeamRole;
  permissions?: TeamPermission[];
  isActive?: boolean;
}

// JWT Token Types
export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId: string;
  action: ActivityAction;
  resource: ActivityResource;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export enum ActivityAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE", 
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  INVITE = "INVITE",
  JOIN = "JOIN",
  LEAVE = "LEAVE",
}

export enum ActivityResource {
  USER = "USER",
  TEAM = "TEAM",
  PROJECT = "PROJECT",
  PIPELINE = "PIPELINE",
  DEPLOYMENT = "DEPLOYMENT",
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ServiceError extends Error {
  statusCode: number;
  isOperational: boolean;
  validationErrors?: ValidationError[];
}