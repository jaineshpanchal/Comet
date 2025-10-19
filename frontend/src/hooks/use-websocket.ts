import { useEffect, useState, useCallback } from 'react';
import { websocketService } from '@/services/websocket';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const handleConnectionStatus = (data: { connected: boolean }) => {
      setConnected(data.connected);
    };

    websocketService.on('connection:status', handleConnectionStatus);

    // Check initial connection status
    setConnected(websocketService.connected);

    return () => {
      websocketService.off('connection:status', handleConnectionStatus);
    };
  }, []);

  const connect = useCallback((token: string) => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';
    websocketService.connect({ url: wsUrl, token });
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  return {
    connected,
    connect,
    disconnect,
    service: websocketService
  };
}

export function usePipelineUpdates(pipelineId: string | null, onUpdate: (data: any) => void) {
  useEffect(() => {
    if (!pipelineId) return;

    const handleUpdate = (data: any) => {
      if (data.pipelineId === pipelineId) {
        onUpdate(data);
      }
    };

    websocketService.on('pipeline:run:update', handleUpdate);
    websocketService.on('pipeline:status:change', handleUpdate);
    websocketService.subscribeToPipeline(pipelineId);

    return () => {
      websocketService.off('pipeline:run:update', handleUpdate);
      websocketService.off('pipeline:status:change', handleUpdate);
      websocketService.unsubscribe(`pipeline:${pipelineId}`);
    };
  }, [pipelineId, onUpdate]);
}

export function useMetricsUpdates(onUpdate: (data: any) => void) {
  useEffect(() => {
    websocketService.on('metrics:update', onUpdate);

    return () => {
      websocketService.off('metrics:update', onUpdate);
    };
  }, [onUpdate]);
}

export function useNotifications(onNotification: (data: any) => void) {
  useEffect(() => {
    websocketService.on('notification', onNotification);

    return () => {
      websocketService.off('notification', onNotification);
    };
  }, [onNotification]);
}

export function useTestUpdates(onUpdate: (data: any) => void) {
  useEffect(() => {
    websocketService.on('test:run:update', onUpdate);

    return () => {
      websocketService.off('test:run:update', onUpdate);
    };
  }, [onUpdate]);
}

export function useDeploymentUpdates(onUpdate: (data: any) => void) {
  useEffect(() => {
    websocketService.on('deployment:update', onUpdate);

    return () => {
      websocketService.off('deployment:update', onUpdate);
    };
  }, [onUpdate]);
}
