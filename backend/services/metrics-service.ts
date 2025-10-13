import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import Table from 'cli-table3';

interface KPIMetric {
  id: string;
  label: string;
  value: string;
  delta: string;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
}

interface PipelineStatus {
  id: string;
  name: string;
  status: 'deployed' | 'testing' | 'building' | 'failed' | 'queued';
  progress: number;
  buildNumber: number;
  duration: string;
  branch: string;
  timestamp: Date;
}

interface ActivityEvent {
  id: string;
  type: 'deployment' | 'test' | 'quality' | 'release';
  message: string;
  details: string;
  status: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
}

class MetricsService {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private port = 9090;

  // Simulated data stores
  private kpiMetrics: KPIMetric[] = [];
  private pipelines: PipelineStatus[] = [];
  private activities: ActivityEvent[] = [];

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.initializeData();
    this.startDataSimulation();
  }

  private setupMiddleware() {
    this.app.use(cors({
      origin: ['http://localhost:3030', 'http://127.0.0.1:3030'],
      credentials: true
    }));
    this.app.use(express.json());
  }

  private setupRoutes() {
    // KPI Metrics endpoint
    this.app.get('/api/metrics/kpis', (req, res) => {
      res.json({
        success: true,
        data: this.kpiMetrics,
        timestamp: new Date().toISOString()
      });
    });

    // Pipeline Status endpoint
    this.app.get('/api/metrics/pipelines', (req, res) => {
      res.json({
        success: true,
        data: this.pipelines,
        timestamp: new Date().toISOString()
      });
    });

    // Activity Feed endpoint
    this.app.get('/api/metrics/activities', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 10;
      res.json({
        success: true,
        data: this.activities.slice(0, limit),
        timestamp: new Date().toISOString()
      });
    });

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        service: 'metrics-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('📡 New WebSocket client connected');
      this.clients.add(ws);

      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial-data',
        data: {
          kpis: this.kpiMetrics,
          pipelines: this.pipelines,
          activities: this.activities.slice(0, 5)
        }
      }));

      ws.on('close', () => {
        console.log('📡 WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('📡 WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private initializeData() {
    // Initialize KPI metrics
    this.kpiMetrics = [
      {
        id: 'deployment-success',
        label: 'Deployment Success Rate',
        value: '98.5%',
        delta: '+2.1% from last week',
        color: 'green',
        trend: 'up',
        timestamp: new Date()
      },
      {
        id: 'lead-time',
        label: 'Lead Time',
        value: '2.3h',
        delta: '-15min from last week',
        color: 'blue',
        trend: 'down',
        timestamp: new Date()
      },
      {
        id: 'test-coverage',
        label: 'Test Coverage',
        value: '94.2%',
        delta: '+1.8% from last week',
        color: 'purple',
        trend: 'up',
        timestamp: new Date()
      },
      {
        id: 'active-deployments',
        label: 'Active Deployments',
        value: '7',
        delta: '2 in production',
        color: 'orange',
        trend: 'stable',
        timestamp: new Date()
      }
    ];

    // Initialize pipeline data
    this.pipelines = [
      {
        id: 'auth-service',
        name: 'user-authentication-service',
        status: 'deployed',
        progress: 100,
        buildNumber: 142,
        duration: '3m 24s',
        branch: 'main',
        timestamp: new Date(Date.now() - 2 * 60 * 1000)
      },
      {
        id: 'payment-api',
        name: 'payment-processing-api',
        status: 'testing',
        progress: 75,
        buildNumber: 89,
        duration: '1m 12s',
        branch: 'feature/payment-v2',
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: 'frontend-dashboard',
        name: 'frontend-dashboard',
        status: 'building',
        progress: 45,
        buildNumber: 67,
        duration: '2m 8s',
        branch: 'develop',
        timestamp: new Date(Date.now() - 8 * 60 * 1000)
      }
    ];

    // Initialize activity data
    this.activities = [
      {
        id: 'activity-1',
        type: 'deployment',
        message: 'Production deployment successful',
        details: 'user-service v2.1.4 • 2 minutes ago',
        status: 'success',
        timestamp: new Date(Date.now() - 2 * 60 * 1000)
      },
      {
        id: 'activity-2',
        type: 'quality',
        message: 'Code quality scan completed',
        details: 'payment-api • Grade A • 5 minutes ago',
        status: 'success',
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: 'activity-3',
        type: 'test',
        message: 'Test suite execution completed',
        details: 'frontend-app • 847 tests passed • 8 minutes ago',
        status: 'success',
        timestamp: new Date(Date.now() - 8 * 60 * 1000)
      },
      {
        id: 'activity-4',
        type: 'release',
        message: 'Release candidate created',
        details: 'mobile-app v3.0.0-rc.1 • 12 minutes ago',
        status: 'info',
        timestamp: new Date(Date.now() - 12 * 60 * 1000)
      }
    ];
  }

  private startDataSimulation() {
    // Simulate real-time updates every 10 seconds
    setInterval(() => {
      this.simulateMetricUpdates();
      this.simulatePipelineUpdates();
      this.simulateActivityUpdates();
      this.broadcastUpdates();
    }, 10000);

    // Simulate pipeline progress updates more frequently
    setInterval(() => {
      this.updatePipelineProgress();
      this.broadcastPipelineUpdates();
    }, 3000);
  }

  private simulateMetricUpdates() {
    // Randomly update metrics with realistic changes
    this.kpiMetrics = this.kpiMetrics.map(metric => {
      const change = (Math.random() - 0.5) * 0.1; // Small random changes
      
      switch (metric.id) {
        case 'deployment-success':
          const newSuccess = Math.max(95, Math.min(100, parseFloat(metric.value) + change));
          return {
            ...metric,
            value: `${newSuccess.toFixed(1)}%`,
            timestamp: new Date()
          };
        case 'lead-time':
          const newTime = Math.max(1.5, Math.min(4, parseFloat(metric.value) + change * 0.1));
          return {
            ...metric,
            value: `${newTime.toFixed(1)}h`,
            timestamp: new Date()
          };
        default:
          return { ...metric, timestamp: new Date() };
      }
    });
  }

  private simulatePipelineUpdates() {
    // Randomly update pipeline statuses
    if (Math.random() < 0.3) { // 30% chance
      const randomPipeline = this.pipelines[Math.floor(Math.random() * this.pipelines.length)];
      
      if (randomPipeline.status === 'building' && randomPipeline.progress >= 100) {
        randomPipeline.status = Math.random() < 0.9 ? 'deployed' : 'failed';
      } else if (randomPipeline.status === 'testing' && Math.random() < 0.5) {
        randomPipeline.status = 'deployed';
        randomPipeline.progress = 100;
      }
    }
  }

  private updatePipelineProgress() {
    this.pipelines = this.pipelines.map(pipeline => {
      if (pipeline.status === 'building' || pipeline.status === 'testing') {
        const increment = Math.random() * 10;
        pipeline.progress = Math.min(100, pipeline.progress + increment);
      }
      return pipeline;
    });
  }

  private simulateActivityUpdates() {
    // Add new activities occasionally
    if (Math.random() < 0.2) { // 20% chance
      const activities = [
        'Security scan completed',
        'Dependency update available',
        'Performance test executed',
        'Backup completed successfully',
        'Environment health check passed'
      ];
      
      const newActivity: ActivityEvent = {
        id: `activity-${Date.now()}`,
        type: ['deployment', 'test', 'quality', 'release'][Math.floor(Math.random() * 4)] as any,
        message: activities[Math.floor(Math.random() * activities.length)],
        details: `System • Just now`,
        status: Math.random() < 0.8 ? 'success' : 'warning',
        timestamp: new Date()
      };

      this.activities.unshift(newActivity);
      this.activities = this.activities.slice(0, 20); // Keep last 20 activities
    }
  }

  private broadcastUpdates() {
    const update = {
      type: 'metrics-update',
      data: {
        kpis: this.kpiMetrics,
        timestamp: new Date().toISOString()
      }
    };

    this.broadcast(update);
  }

  private broadcastPipelineUpdates() {
    const update = {
      type: 'pipeline-update',
      data: {
        pipelines: this.pipelines,
        timestamp: new Date().toISOString()
      }
    };

    this.broadcast(update);
  }

  private broadcast(data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Creates a perfectly aligned startup table using cli-table3
   */
  private displayStartupTable(): void {
    // Create a single table with custom border control
    const table = new Table({
      chars: {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
        'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
        'left': '║', 'left-mid': '', 'mid': '', 'mid-mid': '',
        'right': '║', 'right-mid': '', 'middle': ''
      },
      style: {
        head: [],
        border: [],
        'padding-left': 1,
        'padding-right': 1
      },
      colWidths: [60],
      wordWrap: false
    });

    // Add all content
    table.push([{ content: '📊 METRICS & ANALYTICS SERVICE', hAlign: 'center' }]);
    table.push(['Status: ✅ RUNNING']);
    table.push([`Port: ${this.port}`]);
    table.push([`Environment: ${process.env.NODE_ENV || 'development'}`.toUpperCase()]);
    table.push([`Version: ${process.env.APP_VERSION || '1.0.0'}`]);
    table.push(['']); // Empty line
    table.push([`📊 KPIs API: http://localhost:${this.port}/api/metrics/kpis`]);
    table.push([`🚀 Pipelines: http://localhost:${this.port}/api/metrics/pipelines`]);
    table.push([`📈 Activities: http://localhost:${this.port}/api/metrics/activities`]);
    table.push([`📡 WebSocket: ws://localhost:${this.port} (Real-time updates)`]);

    // Get the table string and manually add the separator after the header
    const tableStr = table.toString();
    const lines = tableStr.split('\n');
    
    // Insert separator after the first content line (after service name)
    const separatorLine = '╠' + '═'.repeat(60) + '╣';
    lines.splice(2, 0, separatorLine); // Insert after line 1 (0-indexed, after service name)

    console.log('\n' + lines.join('\n') + '\n');
  }

  public start() {
    this.server.listen(this.port, () => {
      // Display perfectly aligned startup table
      this.displayStartupTable();
    });
  }
}

// Start the service
const metricsService = new MetricsService();
metricsService.start();

export default MetricsService;