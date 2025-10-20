'use client';

const AUTH_TOKEN_STORAGE_KEY = 'golive_jwt';
const AUTH_EVENT_NAME = 'golive-auth-change';

export type AuthChangeDetail = {
  isAuthenticated: boolean;
  token: string | null;
};

type AuthChangeListener = (detail: AuthChangeDetail) => void;

const defaultKeysToClear = ['userPreferences'];

const isBrowser = typeof window !== 'undefined';

const broadcastAuthChange = (detail: AuthChangeDetail) => {
  if (!isBrowser) {
    return;
  }
  window.dispatchEvent(new CustomEvent<AuthChangeDetail>(AUTH_EVENT_NAME, { detail }));
};

export const getAuthToken = (): string | null => {
  if (!isBrowser) {
    return null;
  }
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to read auth token from storage', error);
    return null;
  }
};

export const isAuthenticated = (): boolean => Boolean(getAuthToken());

export const setAuthToken = (token: string | null): void => {
  if (!isBrowser) {
    return;
  }
  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      broadcastAuthChange({ isAuthenticated: true, token });
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      broadcastAuthChange({ isAuthenticated: false, token: null });
    }
  } catch (error) {
    console.warn('Unable to persist auth token', error);
  }
};

export const clearAuthState = (options?: { preservePreferences?: boolean; additionalKeys?: string[] }): void => {
  if (!isBrowser) {
    return;
  }

  const { preservePreferences = false, additionalKeys = [] } = options || {};

  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

    const keysToClear = new Set<string>(additionalKeys);
    if (!preservePreferences) {
      defaultKeysToClear.forEach((key) => keysToClear.add(key));
    }

    keysToClear.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Unable to remove '${key}' from localStorage`, error);
      }
    });

    if (typeof window.sessionStorage !== 'undefined') {
      try {
        window.sessionStorage.removeItem('golive-session');
      } catch (error) {
        console.warn('Unable to clear session storage', error);
      }
    }
  } finally {
    broadcastAuthChange({ isAuthenticated: false, token: null });
  }
};

export const logout = (options?: { preservePreferences?: boolean; additionalKeys?: string[] }): void => {
  if (!isBrowser) {
    return;
  }
  clearAuthState(options);
};

export const onAuthChange = (listener: AuthChangeListener): (() => void) => {
  if (!isBrowser) {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<AuthChangeDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(AUTH_EVENT_NAME, handler as EventListener);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, handler as EventListener);
  };
};

export { AUTH_TOKEN_STORAGE_KEY };