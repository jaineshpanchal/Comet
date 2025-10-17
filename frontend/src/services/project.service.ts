/**
 * Project Service
 * Handles all project-related API calls
 */

import { api } from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  repositoryUrl: string;
  branch: string;
  framework: string;
  language: string;
  ownerId: string;
  teamId: string | null;
  isActive: boolean;
  settings: any;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
    members: any[];
  };
  _count?: {
    pipelines: number;
    testSuites: number;
    deployments: number;
  };
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  repositoryUrl: string;
  branch?: string;
  framework: string;
  language: string;
  teamId?: string;
  settings?: any;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  repositoryUrl?: string;
  branch?: string;
  framework?: string;
  language?: string;
  teamId?: string;
  settings?: any;
  isActive?: boolean;
}

export class ProjectService {
  /**
   * Get all projects
   */
  static async getProjects(
    framework?: string,
    language?: string,
    isActive?: boolean
  ): Promise<Project[]> {
    const response = await api.get<Project[]>('/api/projects', {
      framework,
      language,
      isActive,
    });
    return response.data!;
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string): Promise<Project> {
    const response = await api.get<Project>(`/api/projects/${id}`);
    return response.data!;
  }

  /**
   * Create project
   */
  static async createProject(data: CreateProjectDto): Promise<Project> {
    const response = await api.post<Project>('/api/projects', data);
    return response.data!;
  }

  /**
   * Update project
   */
  static async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await api.put<Project>(`/api/projects/${id}`, data);
    return response.data!;
  }

  /**
   * Delete project
   */
  static async deleteProject(id: string): Promise<void> {
    await api.delete(`/api/projects/${id}`);
  }
}
