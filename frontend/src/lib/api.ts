'use client';

import { getAuthToken, setAuthToken } from './auth';

export interface ApiRequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  token?: string | null;
  withAuth?: boolean;
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
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { body, headers = {}, query, token, withAuth = true, signal } = options;

    const url = this.buildUrl(path, query);
    const finalHeaders = new Headers(headers);

    if (!finalHeaders.has('Accept')) {
      finalHeaders.set('Accept', 'application/json');
    }

    if (body !== undefined && body !== null && !finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json');
    }

    let authToken = token ?? null;
    if (withAuth && !authToken) {
      authToken = getAuthToken();
    }

    if (withAuth && authToken) {
      finalHeaders.set('Authorization', `Bearer ${authToken}`);
    }

    const requestInit: RequestInit = {
      method,
      headers: finalHeaders,
      signal,
      credentials: 'include',
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
