/**
 * Deployment Service
 * Handles all deployment-related API calls
 */

import { api } from '@/lib/api';

export interface Deployment {
  id: string;
  projectId: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  branch: string;
  commitHash: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DEPLOYED' | 'FAILED' | 'ROLLED_BACK';
  deployedBy: string;
  deployedAt: string;
  finishedAt: string | null;
  duration: number | null;
  logs: string | null;
  rollbackId: string | null;
  rollbackFromId: string | null;
  rollbackToId: string | null;
  configuration: any;
  metadata: any;
  project?: {
    id: string;
    name: string;
    repositoryUrl: string;
    branch: string;
  };
  deployedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
}

export interface CreateDeploymentDto {
  projectId: string;
  environment: Deployment['environment'];
  version: string;
  branch?: string;
  commitHash?: string;
  configuration?: any;
}

export interface RollbackDto {
  reason?: string;
}

export class DeploymentService {
  /**
   * Get all deployments
   */
  static async getDeployments(
    projectId?: string,
    environment?: string,
    status?: string
  ): Promise<Deployment[]> {
    const response = await api.get<Deployment[]>('/api/deployments', {
      projectId,
      environment,
      status,
    });
    return response.data!;
  }

  /**
   * Get deployment by ID
   */
  static async getDeploymentById(id: string): Promise<Deployment> {
    const response = await api.get<Deployment>(`/api/deployments/${id}`);
    return response.data!;
  }

  /**
   * Create deployment
   */
  static async createDeployment(data: CreateDeploymentDto): Promise<Deployment> {
    const response = await api.post<Deployment>('/api/deployments', data);
    return response.data!;
  }

  /**
   * Rollback deployment
   */
  static async rollbackDeployment(id: string, data?: RollbackDto): Promise<Deployment> {
    const response = await api.post<Deployment>(`/api/deployments/${id}/rollback`, data);
    return response.data!;
  }

  /**
   * Get deployment logs
   */
  static async getDeploymentLogs(id: string): Promise<{
    deploymentId: string;
    logs: string[];
    status: string;
    startedAt: string;
    finishedAt: string | null;
  }> {
    const response = await api.get<{
      deploymentId: string;
      logs: string[];
      status: string;
      startedAt: string;
      finishedAt: string | null;
    }>(`/api/deployments/${id}/logs`);
    return response.data!;
  }

  /**
   * Get deployment history for a project
   */
  static async getDeploymentHistory(
    projectId: string,
    limit: number = 20,
    environment?: string
  ): Promise<Deployment[]> {
    const response = await api.get<Deployment[]>(
      `/api/deployments/project/${projectId}/history`,
      {
        limit,
        environment,
      }
    );
    return response.data!;
  }
}
