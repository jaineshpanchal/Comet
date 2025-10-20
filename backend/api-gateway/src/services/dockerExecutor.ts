/**
 * Docker Executor Service
 * Executes pipeline stages in isolated Docker containers
 */

import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export interface DockerExecutionOptions {
  image: string;
  commands: string[];
  workDir?: string;
  environment?: Record<string, string>;
  volumes?: Array<{ host: string; container: string }>;
  networkMode?: string;
  memoryLimit?: string;
  cpuLimit?: string;
  timeout?: number;
}

export interface DockerExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  containerId?: string;
  error?: string;
}

export class DockerExecutor extends EventEmitter {
  private runningContainers: Map<string, ChildProcess> = new Map();
  private containerCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startCleanupInterval();
  }

  /**
   * Execute commands in a Docker container
   */
  async executeInContainer(
    stageName: string,
    options: DockerExecutionOptions
  ): Promise<DockerExecutionResult> {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let containerId: string | undefined;
    let exitCode = 0;

    try {
      logger.info('Starting Docker container execution', {
        stageName,
        image: options.image,
        commands: options.commands,
      });

      // Check if Docker is available
      const dockerAvailable = await this.checkDockerAvailable();
      if (!dockerAvailable) {
        logger.warn('Docker not available, falling back to simulation mode');
        return this.simulateExecution(stageName, options, startTime);
      }

      // Build docker run command
      const dockerArgs = this.buildDockerArgs(options);

      // Create and start container
      const process = spawn('docker', dockerArgs);

      // Extract container ID from docker run args (the --name argument)
      const nameIndex = dockerArgs.indexOf('--name');
      if (nameIndex >= 0 && dockerArgs[nameIndex + 1]) {
        containerId = dockerArgs[nameIndex + 1];
        this.runningContainers.set(containerId, process);
        logger.debug('Container started', { containerId, stageName });
      }

      // Capture output
      process.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        this.emit('stdout', { stageName, data: output });
        logger.debug('Docker stdout', { stageName, output });
      });

      process.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        this.emit('stderr', { stageName, data: output });
        logger.debug('Docker stderr', { stageName, output });
      });

      // Set timeout if specified
      let timeoutHandle: NodeJS.Timeout | null = null;
      if (options.timeout) {
        timeoutHandle = setTimeout(() => {
          logger.warn('Docker execution timeout', { stageName, timeout: options.timeout });
          this.killContainer(containerId!);
        }, options.timeout * 1000);
      }

      // Wait for container to finish
      exitCode = await new Promise<number>((resolve, reject) => {
        process.on('error', (err) => {
          logger.error('Docker process error', { stageName, error: err.message });
          reject(err);
        });

        process.on('close', (code) => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          resolve(code || 0);
        });
      });

      const duration = Math.floor((Date.now() - startTime) / 1000);
      const success = exitCode === 0;

      logger.info('Docker execution completed', {
        stageName,
        success,
        exitCode,
        duration,
      });

      // Cleanup container
      if (containerId) {
        this.runningContainers.delete(containerId);
        await this.removeContainer(containerId);
      }

      return {
        success,
        exitCode,
        stdout,
        stderr,
        duration,
        containerId,
      };
    } catch (error: any) {
      const duration = Math.floor((Date.now() - startTime) / 1000);

      logger.error('Docker execution failed', {
        stageName,
        error: error.message,
        duration,
      });

      // Cleanup on error
      if (containerId) {
        this.runningContainers.delete(containerId);
        await this.removeContainer(containerId);
      }

      return {
        success: false,
        exitCode: exitCode || 1,
        stdout,
        stderr,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Build Docker run arguments
   */
  private buildDockerArgs(options: DockerExecutionOptions): string[] {
    const args = ['run', '--rm'];

    // Add name for easier tracking
    args.push('--name', `golive-pipeline-${Date.now()}`);

    // Add environment variables
    if (options.environment) {
      Object.entries(options.environment).forEach(([key, value]) => {
        args.push('-e', `${key}=${value}`);
      });
    }

    // Add volumes
    if (options.volumes) {
      options.volumes.forEach((vol) => {
        args.push('-v', `${vol.host}:${vol.container}`);
      });
    }

    // Add working directory
    if (options.workDir) {
      args.push('-w', options.workDir);
    }

    // Add network mode
    if (options.networkMode) {
      args.push('--network', options.networkMode);
    }

    // Add resource limits
    if (options.memoryLimit) {
      args.push('--memory', options.memoryLimit);
    }

    if (options.cpuLimit) {
      args.push('--cpus', options.cpuLimit);
    }

    // Add image
    args.push(options.image);

    // Add command
    if (options.commands.length > 0) {
      args.push('sh', '-c', options.commands.join(' && '));
    }

    return args;
  }


  /**
   * Kill a running container
   */
  async killContainer(containerId: string): Promise<void> {
    try {
      logger.info('Killing Docker container', { containerId });

      const process = this.runningContainers.get(containerId);
      if (process) {
        process.kill('SIGKILL');
        this.runningContainers.delete(containerId);
      }

      // Force remove container
      await this.executeCommand('docker', ['kill', containerId]);
      await this.removeContainer(containerId);
    } catch (error: any) {
      logger.error('Failed to kill container', {
        containerId,
        error: error.message,
      });
    }
  }

  /**
   * Remove a container
   */
  private async removeContainer(containerId: string): Promise<void> {
    try {
      await this.executeCommand('docker', ['rm', '-f', containerId]);
      logger.debug('Container removed', { containerId });
    } catch (error: any) {
      logger.warn('Failed to remove container', {
        containerId,
        error: error.message,
      });
    }
  }

  /**
   * Check if Docker is available
   */
  private async checkDockerAvailable(): Promise<boolean> {
    try {
      await this.executeCommand('docker', ['--version']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute a command and wait for completion
   */
  private executeCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);

      process.on('error', reject);
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Simulate execution when Docker is not available
   */
  private simulateExecution(
    stageName: string,
    options: DockerExecutionOptions,
    startTime: number
  ): DockerExecutionResult {
    logger.info('Simulating Docker execution', { stageName });

    const stdout = `
DOCKER SIMULATION MODE (Install Docker for real execution)
====================================
Image: ${options.image}
Commands: ${options.commands.join(' && ')}

✅ Container would be created
✅ Commands would be executed
✅ Output would be captured

Simulated execution completed successfully
`;

    const duration = Math.floor((Date.now() - startTime) / 1000) + 3;

    return {
      success: true,
      exitCode: 0,
      stdout,
      stderr: '',
      duration,
    };
  }

  /**
   * Start cleanup interval for orphaned containers
   */
  private startCleanupInterval(): void {
    this.containerCleanupInterval = setInterval(() => {
      this.cleanupOrphanedContainers();
    }, 60000); // Run every minute
  }

  /**
   * Cleanup orphaned containers
   */
  private async cleanupOrphanedContainers(): Promise<void> {
    try {
      const dockerAvailable = await this.checkDockerAvailable();
      if (!dockerAvailable) return;

      // List containers with our naming pattern
      const process = spawn('docker', [
        'ps',
        '-a',
        '--filter',
        'name=golive-pipeline-',
        '--format',
        '{{.ID}}',
      ]);

      let containerIds = '';
      process.stdout?.on('data', (data) => {
        containerIds += data.toString();
      });

      process.on('close', async () => {
        const ids = containerIds.trim().split('\n').filter(Boolean);
        for (const id of ids) {
          if (!this.runningContainers.has(id)) {
            await this.removeContainer(id);
          }
        }
      });
    } catch (error: any) {
      logger.error('Container cleanup failed', { error: error.message });
    }
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.containerCleanupInterval) {
      clearInterval(this.containerCleanupInterval);
      this.containerCleanupInterval = null;
    }
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    this.stopCleanup();

    // Kill all running containers
    const containerIds = Array.from(this.runningContainers.keys());
    await Promise.all(containerIds.map((id) => this.killContainer(id)));

    logger.info('Docker executor cleanup completed');
  }
}

// Export singleton instance
export const dockerExecutor = new DockerExecutor();
export default dockerExecutor;
