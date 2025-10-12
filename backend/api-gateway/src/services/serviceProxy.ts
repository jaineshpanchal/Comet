// Service proxy for microservice communication
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { SERVICES, getServiceUrl, getHealthCheckUrl } from '../config/services';
import { ServiceRequest, ServiceResponse, HealthCheck } from '../types';
import { logger } from '../utils/logger';

export class ServiceProxy {
  // Make request to a microservice
  static async makeRequest<T = any>(
    serviceName: keyof typeof SERVICES,
    request: ServiceRequest
  ): Promise<ServiceResponse<T>> {
    const service = SERVICES[serviceName];
    const baseUrl = `http://${service.host}:${service.port}${service.path}`;
    
    const config: AxiosRequestConfig = {
      method: request.method,
      url: request.url.startsWith('http') ? request.url : `${baseUrl}${request.url}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'api-gateway',
        'X-Request-ID': this.generateRequestId(),
        ...request.headers
      },
      data: request.data,
      params: request.params,
      timeout: request.timeout || service.timeout,
      validateStatus: () => true // Don't throw on HTTP error status
    };

    try {
      logger.info(`Making ${request.method} request to ${serviceName}`, {
        service: serviceName,
        url: config.url,
        method: request.method
      });

      const response: AxiosResponse<T> = await axios(config);

      logger.info(`Received response from ${serviceName}`, {
        service: serviceName,
        status: response.status,
        url: config.url
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
        message: response.statusText
      };
    } catch (error: any) {
      logger.error(`Service request failed for ${serviceName}`, {
        service: serviceName,
        error: error.message,
        url: config.url
      });

      // Retry logic
      if (request.method === 'GET' && service.retries > 0) {
        logger.info(`Retrying request to ${serviceName}`, {
          service: serviceName,
          retriesLeft: service.retries
        });

        await this.delay(1000); // Wait 1 second before retry
        
        const retryRequest = { ...request };
        const retryService = { ...service, retries: service.retries - 1 };
        SERVICES[serviceName] = retryService;
        
        return this.makeRequest(serviceName, retryRequest);
      }

      throw new Error(`Service ${serviceName} is unavailable: ${error.message}`);
    }
  }

  // Pipeline service methods
  static async getPipelines(projectId?: string): Promise<ServiceResponse> {
    return this.makeRequest('PIPELINE', {
      method: 'GET',
      url: projectId ? `/pipelines?projectId=${projectId}` : '/pipelines'
    });
  }

  static async createPipeline(pipelineData: any): Promise<ServiceResponse> {
    return this.makeRequest('PIPELINE', {
      method: 'POST',
      url: '/pipelines',
      data: pipelineData
    });
  }

  static async runPipeline(pipelineId: string, parameters?: any): Promise<ServiceResponse> {
    return this.makeRequest('PIPELINE', {
      method: 'POST',
      url: `/pipelines/${pipelineId}/run`,
      data: { parameters }
    });
  }

  static async getPipelineStatus(pipelineId: string): Promise<ServiceResponse> {
    return this.makeRequest('PIPELINE', {
      method: 'GET',
      url: `/pipelines/${pipelineId}/status`
    });
  }

  // Testing service methods
  static async getTestSuites(projectId?: string): Promise<ServiceResponse> {
    return this.makeRequest('TESTING', {
      method: 'GET',
      url: projectId ? `/test-suites?projectId=${projectId}` : '/test-suites'
    });
  }

  static async runTests(testSuiteId: string, options?: any): Promise<ServiceResponse> {
    return this.makeRequest('TESTING', {
      method: 'POST',
      url: `/test-suites/${testSuiteId}/run`,
      data: { options }
    });
  }

  static async getTestResults(testRunId: string): Promise<ServiceResponse> {
    return this.makeRequest('TESTING', {
      method: 'GET',
      url: `/test-runs/${testRunId}/results`
    });
  }

  // Integration service methods
  static async getIntegrations(): Promise<ServiceResponse> {
    return this.makeRequest('INTEGRATION', {
      method: 'GET',
      url: '/integrations'
    });
  }

  static async createIntegration(integrationData: any): Promise<ServiceResponse> {
    return this.makeRequest('INTEGRATION', {
      method: 'POST',
      url: '/integrations',
      data: integrationData
    });
  }

  static async syncIntegration(integrationId: string): Promise<ServiceResponse> {
    return this.makeRequest('INTEGRATION', {
      method: 'POST',
      url: `/integrations/${integrationId}/sync`
    });
  }

  // Code analysis service methods
  static async analyzeCode(projectId: string, options?: any): Promise<ServiceResponse> {
    return this.makeRequest('CODE_ANALYSIS', {
      method: 'POST',
      url: '/analyze',
      data: { projectId, options }
    });
  }

  static async getAnalysisResults(analysisId: string): Promise<ServiceResponse> {
    return this.makeRequest('CODE_ANALYSIS', {
      method: 'GET',
      url: `/analysis/${analysisId}/results`
    });
  }

  // Monitoring service methods
  static async getMetrics(projectId?: string, timeRange?: string): Promise<ServiceResponse> {
    const params: Record<string, string> = {};
    if (projectId) params.projectId = projectId;
    if (timeRange) params.timeRange = timeRange;

    return this.makeRequest('MONITORING', {
      method: 'GET',
      url: '/metrics',
      params
    });
  }

  static async getAlerts(severity?: string): Promise<ServiceResponse> {
    return this.makeRequest('MONITORING', {
      method: 'GET',
      url: severity ? `/alerts?severity=${severity}` : '/alerts'
    });
  }

  // AI services methods
  static async generateTests(projectId: string, options?: any): Promise<ServiceResponse> {
    return this.makeRequest('AI_SERVICES', {
      method: 'POST',
      url: '/generate-tests',
      data: { projectId, options },
      timeout: 60000 // AI services may take longer
    });
  }

  static async analyzeFailures(testResults: any): Promise<ServiceResponse> {
    return this.makeRequest('AI_SERVICES', {
      method: 'POST',
      url: '/analyze-failures',
      data: { testResults },
      timeout: 30000
    });
  }

  static async optimizePipeline(pipelineData: any): Promise<ServiceResponse> {
    return this.makeRequest('AI_SERVICES', {
      method: 'POST',
      url: '/optimize-pipeline',
      data: { pipelineData },
      timeout: 45000
    });
  }

  // Health check for a specific service
  static async checkServiceHealth(serviceName: keyof typeof SERVICES): Promise<HealthCheck> {
    const service = SERVICES[serviceName];
    const startTime = Date.now();

    try {
      const response = await axios.get(getHealthCheckUrl(serviceName), {
        timeout: 5000,
        validateStatus: () => true
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === 200;

      return {
        service: service.name,
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: response.data || {}
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        service: service.name,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          error: error.message,
          code: error.code
        }
      };
    }
  }

  // Health check for all services
  static async checkAllServicesHealth(): Promise<HealthCheck[]> {
    const serviceNames = Object.keys(SERVICES) as (keyof typeof SERVICES)[];
    const healthChecks = await Promise.all(
      serviceNames.map(serviceName => this.checkServiceHealth(serviceName))
    );

    return healthChecks;
  }

  // Utility methods
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Circuit breaker pattern (simplified)
  private static serviceCircuitBreakers: Map<string, {
    failures: number;
    lastFailureTime: number;
    state: 'closed' | 'open' | 'half-open';
  }> = new Map();

  static isServiceAvailable(serviceName: keyof typeof SERVICES): boolean {
    const breaker = this.serviceCircuitBreakers.get(serviceName);
    if (!breaker) return true;

    const now = Date.now();
    const timeSinceLastFailure = now - breaker.lastFailureTime;

    // If circuit is open and enough time has passed, try half-open
    if (breaker.state === 'open' && timeSinceLastFailure > 30000) { // 30 seconds
      breaker.state = 'half-open';
      this.serviceCircuitBreakers.set(serviceName, breaker);
      return true;
    }

    return breaker.state !== 'open';
  }

  static recordServiceFailure(serviceName: keyof typeof SERVICES): void {
    const breaker = this.serviceCircuitBreakers.get(serviceName) || {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed' as const
    };

    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    // Open circuit if too many failures
    if (breaker.failures >= 5) {
      breaker.state = 'open';
      logger.warn(`Circuit breaker opened for service ${serviceName}`, {
        service: serviceName,
        failures: breaker.failures
      });
    }

    this.serviceCircuitBreakers.set(serviceName, breaker);
  }

  static recordServiceSuccess(serviceName: keyof typeof SERVICES): void {
    const breaker = this.serviceCircuitBreakers.get(serviceName);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'closed';
      this.serviceCircuitBreakers.set(serviceName, breaker);
    }
  }
}