/**
 * Pipeline Service
 * Handles all pipeline-related API calls
 */

import { api } from '@/lib/api';

export interface Pipeline {
  id: string;
  projectId: string;
  name: string;
  trigger: 'MANUAL' | 'GIT_PUSH' | 'GIT_PR' | 'SCHEDULE' | 'WEBHOOK';
  stages: any[];
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING';
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  triggeredBy: string | null;
  startedAt: string;
  finishedAt: string | null;
  duration: number | null;
  logs: string | null;
  metadata: any;
  pipeline?: {
    name: string;
    project: {
      name: string;
    };
  };
  triggeredByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  stages?: StageRun[];
}

export interface StageRun {
  id: string;
  pipelineRunId: string;
  stageName: string;
  stageType: 'BUILD' | 'TEST' | 'SECURITY_SCAN' | 'CODE_ANALYSIS' | 'DEPLOY' | 'NOTIFICATION' | 'APPROVAL';
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'SKIPPED';
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null;
  logs: string | null;
  artifacts: any[];
  metadata: any;
}

export interface CreatePipelineDto {
  projectId: string;
  name: string;
  trigger: Pipeline['trigger'];
  stages: any[];
}

export interface UpdatePipelineDto {
  name?: string;
  trigger?: Pipeline['trigger'];
  stages?: any[];
  isActive?: boolean;
}

export class PipelineService {
  /**
   * Get all pipelines
   */
  static async getPipelines(projectId?: string, status?: string): Promise<Pipeline[]> {
    const response = await api.get<Pipeline[]>('/api/pipelines', {
      projectId,
      status,
    });
    return response.data!;
  }

  /**
   * Get pipeline by ID
   */
  static async getPipelineById(id: string): Promise<Pipeline> {
    const response = await api.get<Pipeline>(`/api/pipelines/${id}`);
    return response.data!;
  }

  /**
   * Create pipeline
   */
  static async createPipeline(data: CreatePipelineDto): Promise<Pipeline> {
    const response = await api.post<Pipeline>('/api/pipelines', data);
    return response.data!;
  }

  /**
   * Update pipeline
   */
  static async updatePipeline(id: string, data: UpdatePipelineDto): Promise<Pipeline> {
    const response = await api.put<Pipeline>(`/api/pipelines/${id}`, data);
    return response.data!;
  }

  /**
   * Delete pipeline
   */
  static async deletePipeline(id: string): Promise<void> {
    await api.delete(`/api/pipelines/${id}`);
  }

  /**
   * Run pipeline
   */
  static async runPipeline(id: string, parameters?: any): Promise<PipelineRun> {
    const response = await api.post<PipelineRun>(`/api/pipelines/${id}/run`, parameters);
    return response.data!;
  }

  /**
   * Get pipeline runs
   */
  static async getPipelineRuns(
    id: string,
    limit: number = 20,
    status?: string
  ): Promise<PipelineRun[]> {
    const response = await api.get<PipelineRun[]>(`/api/pipelines/${id}/runs`, {
      limit,
      status,
    });
    return response.data!;
  }

  /**
   * Get pipeline run by ID
   */
  static async getPipelineRunById(runId: string): Promise<PipelineRun> {
    const response = await api.get<PipelineRun>(`/api/pipelines/runs/${runId}`);
    return response.data!;
  }

  /**
   * Cancel pipeline run
   */
  static async cancelPipelineRun(runId: string): Promise<void> {
    await api.post(`/api/pipelines/runs/${runId}/cancel`);
  }

  /**
   * Get pipeline run logs
   */
  static async getPipelineRunLogs(runId: string): Promise<any> {
    const response = await api.get<any>(`/api/pipelines/runs/${runId}/logs`);
    return response.data!;
  }

  /**
   * Retry a failed pipeline run
   */
  static async retryPipelineRun(runId: string): Promise<{ originalRunId: string; newRunId: string }> {
    const response = await api.post<{ originalRunId: string; newRunId: string }>(
      `/api/pipelines/runs/${runId}/retry`
    );
    return response.data!;
  }

  /**
   * Get pipeline run stages
   */
  static async getPipelineRunStages(runId: string): Promise<StageRun[]> {
    const response = await api.get<{ pipelineRunId: string; stages: StageRun[] }>(
      `/api/pipelines/runs/${runId}/stages`
    );
    return response.data!.stages;
  }

  /**
   * Get all pipeline runs (across all pipelines)
   */
  static async getAllPipelineRuns(
    limit: number = 20,
    offset: number = 0,
    status?: string
  ): Promise<{ runs: PipelineRun[]; total: number }> {
    const params: any = { limit, offset };
    if (status) params.status = status;

    const response = await api.get<{ runs: PipelineRun[]; total: number }>(
      `/api/pipeline-runs`,
      params
    );
    return response.data!;
  }
}
