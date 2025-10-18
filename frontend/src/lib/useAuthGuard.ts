'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AUTH_TOKEN_STORAGE_KEY,
  AuthChangeDetail,
  getAuthToken,
  isAuthenticated as getIsAuthenticated,
  onAuthChange,
} from './auth';

export interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  onAuthenticated?: (detail: AuthChangeDetail) => void;
  onUnauthenticated?: (detail: AuthChangeDetail) => void;
}

type GuardState = boolean | null;

export const useAuthGuard = (options: UseAuthGuardOptions = {}): GuardState => {
  const {
    redirectTo = '/auth/login',
    requireAuth = true,
    onAuthenticated,
    onUnauthenticated,
  } = options;

  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<GuardState>(null);
  const hasRedirectedRef = useRef(false);

  const evaluateAuth = useCallback(
    (detail?: AuthChangeDetail) => {
      const token = detail?.token ?? getAuthToken();
      const authenticated = detail?.isAuthenticated ?? Boolean(token);

      setIsAuthed((prev) => {
        if (prev === authenticated) {
          return prev;
        }
        return authenticated;
      });

      if (authenticated) {
        hasRedirectedRef.current = false;
        onAuthenticated?.({ isAuthenticated: true, token: token ?? null });
        return;
      }

      const authDetail: AuthChangeDetail = { isAuthenticated: false, token: null };
      onUnauthenticated?.(authDetail);

      if (requireAuth && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.replace(redirectTo);
      }
    },
    [redirectTo, requireAuth, router, onAuthenticated, onUnauthenticated]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    evaluateAuth();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== AUTH_TOKEN_STORAGE_KEY) {
        return;
      }
      evaluateAuth();
    };

    window.addEventListener('storage', handleStorage);

    const unsubscribe = onAuthChange((detail) => {
      evaluateAuth(detail);
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        evaluateAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
    };
  }, [evaluateAuth]);

  return isAuthed;
};

export const useIsAuthenticated = (): boolean => {
  const [authenticated, setAuthenticated] = useState(getIsAuthenticated());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const update = (detail: AuthChangeDetail) => {
      setAuthenticated(detail.isAuthenticated);
    };

    const unsubscribe = onAuthChange(update);

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== AUTH_TOKEN_STORAGE_KEY) {
        return;
      }
      setAuthenticated(getIsAuthenticated());
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return authenticated;
};
