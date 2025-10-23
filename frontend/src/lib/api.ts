'use client';

import { getAuthToken, setAuthToken } from './auth';
import { csrfStorage } from '@/hooks/useCsrf';

export interface ApiRequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  token?: string | null;
  withAuth?: boolean;
  withCsrf?: boolean; // Enable CSRF protection (default: true for state-changing methods)
  signal?: AbortSignal;
  method?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  status: number;
  error?: string | null;
  message?: string | null;
  raw: Response | null;
}

const toQueryString = (query?: Record<string, unknown>): string => {
  if (!query) {
    return '';
  }

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    if (path.startsWith('http')) {
      return `${path}${toQueryString(query)}`;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}${toQueryString(query)}`;
  }

  private async request<T>(
    method: string,
    path: string,
    options: ApiRequestOptions = {},
    retryOnCsrfError = true
  ): Promise<ApiResponse<T>> {
    const { body, headers = {}, query, token, withAuth = true, withCsrf, signal } = options;

    // Determine if CSRF protection should be applied
    const needsCsrf = withCsrf ?? ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());

    const url = this.buildUrl(path, query);
    const finalHeaders = new Headers(headers);

    if (!finalHeaders.has('Accept')) {
      finalHeaders.set('Accept', 'application/json');
    }

    if (body !== undefined && body !== null && !finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json');
    }

    // Add Authorization header
    let authToken = token ?? null;
    if (withAuth && !authToken) {
      authToken = getAuthToken();
    }

    if (withAuth && authToken) {
      finalHeaders.set('Authorization', `Bearer ${authToken}`);
    }

    // Add CSRF token for state-changing requests
    if (needsCsrf) {
      let csrfToken = csrfStorage.getToken();

      // If no token in memory, fetch one
      if (!csrfToken) {
        csrfToken = await csrfStorage.fetchToken();
      }

      if (csrfToken) {
        finalHeaders.set('X-CSRF-Token', csrfToken);
      } else {
        console.warn('CSRF token not available for state-changing request');
      }
    }

    const requestInit: RequestInit = {
      method,
      headers: finalHeaders,
      signal,
      credentials: 'include', // Required for CSRF cookie
    };

    if (body !== undefined && body !== null) {
      requestInit.body = finalHeaders.get('Content-Type') === 'application/json' ? JSON.stringify(body) : (body as BodyInit);
    }

    try {
      const response = await fetch(url, requestInit);
      const responseClone = response.clone();

      let payload: any = null;
      try {
        if (response.headers.get('Content-Type')?.includes('application/json')) {
          payload = await response.json();
        }
      } catch (error) {
        console.warn('Failed to parse API response as JSON', error);
      }

      // Handle CSRF token validation failure
      if (response.status === 403 && payload?.error === 'Invalid CSRF token' && retryOnCsrfError && needsCsrf) {
        console.warn('CSRF token invalid, refreshing and retrying request');

        // Fetch new CSRF token
        const newToken = await csrfStorage.fetchToken();

        if (newToken) {
          // Retry request once with new token (retryOnCsrfError = false to prevent infinite loop)
          return this.request<T>(method, path, options, false);
        }
      }

      if (!response.ok) {
        const errorMessage = payload?.error || payload?.message || response.statusText;
        return {
          status: response.status,
          error: errorMessage ?? 'Request failed',
          data: payload?.data,
          message: payload?.message ?? errorMessage ?? null,
          raw: responseClone,
        };
      }

      if (payload?.data?.tokens?.accessToken && withAuth) {
        setAuthToken(payload.data.tokens.accessToken);
      }

      return {
        status: response.status,
        data: (payload?.data ?? payload) as T,
        message: payload?.message ?? null,
        raw: responseClone,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network request failed';
      return {
        status: 0,
        error: message,
        message,
        raw: null,
      };
    }
  }

  get<T>(path: string, query?: Record<string, unknown>, options?: ApiRequestOptions) {
    return this.request<T>('GET', path, { ...options, query });
  }

  post<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>('POST', path, { ...options, body });
  }

  put<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>('PUT', path, { ...options, body });
  }

  patch<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  delete<T>(path: string, options?: ApiRequestOptions) {
    return this.request<T>('DELETE', path, options);
  }

  setToken(token: string | null) {
    setAuthToken(token);
  }

  clearToken() {
    setAuthToken(null);
  }
}

export const api = new ApiClient();
export default api;