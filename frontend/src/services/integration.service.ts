const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING_AUTH';
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  webhookCount: number;
  activeWebhookCount: number;
  createdAt: string;
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  url: string;
  defaultBranch: string;
  language: string | null;
  owner: {
    login: string;
    avatarUrl: string;
  };
}

export interface Branch {
  name: string;
  protected: boolean;
  commit: {
    sha: string;
    url: string;
  };
}

export interface Webhook {
  id: string;
  name: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
}

export class IntegrationService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * List all integrations
   */
  static async listIntegrations(): Promise<Integration[]> {
    const response = await fetch(`${API_URL}/api/integrations`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch integrations');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get integration details
   */
  static async getIntegration(integrationId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/integrations/${integrationId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch integration');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create GitHub integration
   */
  static async createGitHubIntegration(accessToken: string, name?: string): Promise<Integration> {
    const response = await fetch(`${API_URL}/api/integrations/github`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ accessToken, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create GitHub integration');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * List repositories for an integration
   */
  static async listRepositories(integrationId: string): Promise<Repository[]> {
    const response = await fetch(`${API_URL}/api/integrations/${integrationId}/repositories`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * List branches for a repository
   */
  static async listBranches(
    integrationId: string,
    owner: string,
    repo: string
  ): Promise<Branch[]> {
    const response = await fetch(
      `${API_URL}/api/integrations/${integrationId}/repositories/${owner}/${repo}/branches`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch branches');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create webhook
   */
  static async createWebhook(
    integrationId: string,
    projectId: string,
    owner: string,
    repo: string,
    events: string[],
    callbackUrl: string
  ): Promise<Webhook> {
    const response = await fetch(`${API_URL}/api/integrations/${integrationId}/webhooks`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        projectId,
        owner,
        repo,
        events,
        callbackUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create webhook');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Test integration connection
   */
  static async testConnection(integrationId: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/api/integrations/${integrationId}/test`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to test integration');
    }

    const data = await response.json();
    return data.data.connected;
  }

  /**
   * Delete integration
   */
  static async deleteIntegration(integrationId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/integrations/${integrationId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete integration');
    }
  }
}
