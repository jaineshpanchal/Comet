'use client';

import { useState, useEffect, useCallback } from 'react';

interface CsrfTokenData {
  csrfToken: string;
}

interface CsrfResponse {
  success: boolean;
  data: CsrfTokenData;
  message: string;
  timestamp: string;
  path: string;
  statusCode: number;
}

/**
 * CSRF Token Management Hook
 *
 * Manages CSRF token fetching, storage, and automatic refresh.
 * Tokens are stored in memory (not localStorage) for security.
 *
 * @example
 * ```tsx
 * const { csrfToken, isLoading, error, refreshToken } = useCsrf();
 *
 * // Use token in API requests
 * if (csrfToken) {
 *   await api.post('/users', data, {
 *     headers: { 'X-CSRF-Token': csrfToken }
 *   });
 * }
 * ```
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCsrfToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include', // Important: Include cookies for double-submit pattern
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
      }

      const data: CsrfResponse = await response.json();

      if (!data.success || !data.data?.csrfToken) {
        throw new Error('Invalid CSRF token response format');
      }

      setCsrfToken(data.data.csrfToken);
      return data.data.csrfToken;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRF token';
      console.error('CSRF token fetch error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch token on mount
  useEffect(() => {
    fetchCsrfToken();
  }, [fetchCsrfToken]);

  // Refresh token (useful for retry after 403 errors)
  const refreshToken = useCallback(async () => {
    return await fetchCsrfToken();
  }, [fetchCsrfToken]);

  return {
    csrfToken,
    isLoading,
    error,
    refreshToken,
  };
}

/**
 * CSRF Token Storage for Global Access
 *
 * Singleton pattern for managing CSRF token across the application.
 * Used by the API client for automatic token injection.
 */
class CsrfTokenStorage {
  private static instance: CsrfTokenStorage;
  private token: string | null = null;
  private promise: Promise<string | null> | null = null;

  private constructor() {}

  static getInstance(): CsrfTokenStorage {
    if (!CsrfTokenStorage.instance) {
      CsrfTokenStorage.instance = new CsrfTokenStorage();
    }
    return CsrfTokenStorage.instance;
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Fetch CSRF token with deduplication
   * Multiple simultaneous calls will share the same fetch promise
   */
  async fetchToken(): Promise<string | null> {
    // If already fetching, return the existing promise
    if (this.promise) {
      return this.promise;
    }

    // Start new fetch
    this.promise = this.doFetchToken();

    try {
      const token = await this.promise;
      return token;
    } finally {
      // Clear promise after completion
      this.promise = null;
    }
  }

  private async doFetchToken(): Promise<string | null> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch CSRF token:', response.statusText);
        return null;
      }

      const data: CsrfResponse = await response.json();

      if (data.success && data.data?.csrfToken) {
        this.token = data.data.csrfToken;
        return this.token;
      }

      return null;
    } catch (error) {
      console.error('CSRF token fetch error:', error);
      return null;
    }
  }

  clearToken(): void {
    this.token = null;
  }
}

export const csrfStorage = CsrfTokenStorage.getInstance();
