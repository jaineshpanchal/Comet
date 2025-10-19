import { io, Socket } from 'socket.io-client';

type WebSocketEventCallback = (data: any) => void;

interface WebSocketConfig {
  url: string;
  token?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventCallbacks: Map<string, Set<WebSocketEventCallback>> = new Map();
  private isConnected = false;

  /**
   * Initialize WebSocket connection
   */
  connect(config: WebSocketConfig): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const { url, token } = config;

    console.log('Connecting to WebSocket server:', url);

    this.socket = io(url, {
      auth: {
        token: token || ''
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.setupEventHandlers();
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection:status', { connected: true });
    });

    this.socket.on('connected', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection:status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('connection:failed', { error: error.message });
      }
    });

    // Subscription events
    this.socket.on('subscribed', (data) => {
      console.log('Subscribed to:', data);
      this.emit('subscription:success', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Real-time update events
    this.socket.on('pipeline:run:update', (data) => {
      console.log('Pipeline run update:', data);
      this.emit('pipeline:run:update', data);
    });

    this.socket.on('pipeline:status:change', (data) => {
      console.log('Pipeline status change:', data);
      this.emit('pipeline:status:change', data);
    });

    this.socket.on('test:run:update', (data) => {
      console.log('Test run update:', data);
      this.emit('test:run:update', data);
    });

    this.socket.on('deployment:update', (data) => {
      console.log('Deployment update:', data);
      this.emit('deployment:update', data);
    });

    this.socket.on('metrics:update', (data) => {
      console.log('Metrics update received');
      this.emit('metrics:update', data);
    });

    this.socket.on('notification', (data) => {
      console.log('Notification received:', data);
      this.emit('notification', data);
    });

    // Ping/pong for connection health
    this.socket.on('pong', (data) => {
      console.log('Pong received:', data);
    });
  }

  /**
   * Subscribe to pipeline updates
   */
  subscribeToPipeline(pipelineId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe - WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:pipeline', pipelineId);
    console.log('Subscribing to pipeline:', pipelineId);
  }

  /**
   * Subscribe to project updates
   */
  subscribeToProject(projectId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe - WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:project', projectId);
    console.log('Subscribing to project:', projectId);
  }

  /**
   * Subscribe to test suite updates
   */
  subscribeToTestSuite(testSuiteId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe - WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:testSuite', testSuiteId);
    console.log('Subscribing to test suite:', testSuiteId);
  }

  /**
   * Unsubscribe from a room
   */
  unsubscribe(room: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('unsubscribe', room);
    console.log('Unsubscribed from:', room);
  }

  /**
   * Send ping to check connection health
   */
  ping(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('ping');
  }

  /**
   * Register event listener
   */
  on(event: string, callback: WebSocketEventCallback): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)?.add(callback);
  }

  /**
   * Unregister event listener
   */
  off(event: string, callback: WebSocketEventCallback): void {
    this.eventCallbacks.get(event)?.delete(callback);
  }

  /**
   * Emit event to registered callbacks
   */
  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting from WebSocket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventCallbacks.clear();
    }
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket ID
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
