"use client"

import { useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useToast } from '@/components/ui/toast';

/**
 * Hook to automatically show toast notifications for real-time WebSocket events
 */
export function useRealTimeToasts() {
  const { subscribe } = useWebSocket();
  const { showToast } = useToast();

  useEffect(() => {
    // Subscribe to pipeline updates
    const unsubscribePipelines = subscribe('pipelines', (data: any) => {
      if (data.type === 'started') {
        showToast('Pipeline Started', {
          message: `Pipeline execution has begun`,
          type: 'info',
          duration: 3000
        });
      } else if (data.type === 'completed') {
        showToast('Pipeline Completed', {
          message: `Status: ${data.status} | Duration: ${data.duration}s`,
          type: data.status === 'SUCCESS' ? 'success' : 'error',
          duration: 5000
        });
      } else if (data.type === 'failed') {
        showToast('Pipeline Failed', {
          message: data.error || 'Pipeline execution failed',
          type: 'error',
          duration: 7000
        });
      }
    });

    // Subscribe to test updates
    const unsubscribeTests = subscribe('tests', (data: any) => {
      if (data.type === 'started') {
        showToast('Tests Started', {
          message: `Test execution has begun`,
          type: 'info',
          duration: 3000
        });
      } else if (data.type === 'completed') {
        const passRate = data.totalTests > 0 ? Math.round((data.passedTests / data.totalTests) * 100) : 0;
        showToast('Tests Completed', {
          message: `${data.passedTests}/${data.totalTests} passed (${passRate}%) | Coverage: ${data.coverage}%`,
          type: data.failedTests === 0 ? 'success' : 'warning',
          duration: 5000
        });
      } else if (data.type === 'failed') {
        showToast('Tests Failed', {
          message: data.error || 'Test execution failed',
          type: 'error',
          duration: 7000
        });
      }
    });

    // Subscribe to deployment updates
    const unsubscribeDeployments = subscribe('deployments', (data: any) => {
      if (data.type === 'started') {
        const env = data.environment || 'environment';
        showToast('Deployment Started', {
          message: `Deploying to ${env}`,
          type: 'info',
          duration: 3000
        });
      } else if (data.type === 'completed') {
        const env = (data.deployment && data.deployment.environment) || 'environment';
        showToast('Deployment Completed', {
          message: `Successfully deployed to ${env}`,
          type: 'success',
          duration: 5000
        });
      } else if (data.type === 'failed') {
        showToast('Deployment Failed', {
          message: data.error || 'Deployment failed',
          type: 'error',
          duration: 7000
        });
      }
    });

    // Subscribe to general notifications
    const unsubscribeNotifications = subscribe('notifications', (data: any) => {
      showToast(data.title || 'Notification', {
        message: data.message,
        type: data.type || 'info',
        duration: data.duration || 5000
      });
    });

    // Cleanup subscriptions
    return () => {
      unsubscribePipelines();
      unsubscribeTests();
      unsubscribeDeployments();
      unsubscribeNotifications();
    };
  }, [subscribe, showToast]);
}
