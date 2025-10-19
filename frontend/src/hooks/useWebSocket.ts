import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketMessage = {
  type: 'pipeline_started' | 'pipeline_completed' | 'pipeline_failed' | 'stage_started' | 'stage_completed' | 'stage_failed' | 'activity' | 'metrics';
  data: any;
  timestamp: string;
};

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url: string;
  enabled?: boolean;
  reconnectInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket({
  url,
  enabled = true,
  reconnectInterval = 3000,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setStatus('connecting');
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to', url);
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setStatus('error');
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setStatus('disconnected');
        onDisconnect?.();

        // Attempt to reconnect
        if (enabled && reconnectAttemptsRef.current < 10) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(reconnectInterval * reconnectAttemptsRef.current, 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WebSocket] Connection failed:', err);
      setStatus('error');
    }
  }, [url, enabled, reconnectInterval, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('disconnected');
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send message - connection not open');
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    status,
    lastMessage,
    send,
    connect,
    disconnect,
  };
}
