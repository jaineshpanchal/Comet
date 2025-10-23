'use client';

import { useEffect } from 'react';
import { csrfStorage } from '@/hooks/useCsrf';

/**
 * CSRF Provider Component
 *
 * Initializes CSRF token on app mount and stores it globally.
 * This ensures tokens are available before any state-changing requests.
 *
 * Usage: Wrap your app with this provider in the root layout.
 */
export function CsrfProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fetch CSRF token on mount
    const initializeCsrf = async () => {
      try {
        await csrfStorage.fetchToken();
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
      }
    };

    initializeCsrf();

    // Optional: Refresh token periodically (e.g., every 30 minutes)
    // CSRF tokens don't typically expire, but this can help maintain fresh tokens
    const refreshInterval = setInterval(() => {
      csrfStorage.fetchToken().catch(err => {
        console.error('Failed to refresh CSRF token:', err);
      });
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  return <>{children}</>;
}
