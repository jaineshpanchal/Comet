"use client"

import { useRealTimeToasts } from '@/hooks/useRealTimeToasts';

/**
 * Component that enables real-time toast notifications
 * Add this component to your layout to automatically show toasts for WebSocket events
 */
export function RealTimeNotifications() {
  useRealTimeToasts();
  return null; // This component doesn't render anything
}
