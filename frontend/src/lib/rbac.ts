// RBAC permissions structure for GoLive DevOps Platform
// This can be used to drive UI for role/permission management

export type Role = 'admin' | 'project_manager' | 'developer' | 'tester' | 'viewer';

export type Permission =
  | 'manage_users'
  | 'manage_roles'
  | 'manage_integrations'
  | 'view_all_projects'
  | 'create_project'
  | 'edit_project'
  | 'delete_project'
  | 'manage_project_team'
  | 'trigger_pipeline'
  | 'view_pipeline'
  | 'trigger_deployment'
  | 'view_deployment'
  | 'trigger_test'
  | 'view_test_results'
  | 'view_logs'
  | 'view_metrics'
  | 'view_quality_reports'
  | 'manage_settings';

export const RolePermissions: Record<Role, Permission[]> = {
  admin: [
    'manage_users',
    'manage_roles',
    'manage_integrations',
    'view_all_projects',
    'create_project',
    'edit_project',
    'delete_project',
    'manage_project_team',
    'trigger_pipeline',
    'view_pipeline',
    'trigger_deployment',
    'view_deployment',
    'trigger_test',
    'view_test_results',
    'view_logs',
    'view_metrics',
    'view_quality_reports',
    'manage_settings',
  ],
  project_manager: [
    'view_all_projects',
    'create_project',
    'edit_project',
    'delete_project',
    'manage_project_team',
    'trigger_pipeline',
    'view_pipeline',
    'trigger_deployment',
    'view_deployment',
    'trigger_test',
    'view_test_results',
    'view_logs',
    'view_metrics',
    'view_quality_reports',
  ],
  developer: [
    'view_all_projects',
    'trigger_pipeline',
    'view_pipeline',
    'trigger_deployment',
    'view_deployment',
    'trigger_test',
    'view_test_results',
    'view_logs',
    'view_metrics',
    'view_quality_reports',
  ],
  tester: [
    'view_all_projects',
    'trigger_test',
    'view_test_results',
    'view_logs',
    'view_metrics',
    'view_quality_reports',
  ],
  viewer: [
    'view_all_projects',
    'view_pipeline',
    'view_deployment',
    'view_test_results',
    'view_logs',
    'view_metrics',
    'view_quality_reports',
  ],
};

// Example user structure for UI assignment
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// This structure can be used to build UI for:
// - Listing all permissions
// - Assigning/removing permissions per role
// - Assigning users to roles
