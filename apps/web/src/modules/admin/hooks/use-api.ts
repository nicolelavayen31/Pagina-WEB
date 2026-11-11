'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiFetch, friendlyMessage } from '@/shared/api/client';

/** Full page load on purpose: it discards any client state that belonged to the expired session. */
export function goToLogin(next?: string) {
  const url = new URL('/admin/login', window.location.origin);
  if (next) url.searchParams.set('next', next);
  window.location.assign(url);
}

/** Sends the user back to the login page when the session is gone. */
export function handleAuthError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    goToLogin(window.location.pathname);
    return true;
  }
  return false;
}

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;

    apiFetch<T>(path)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled && !handleAuthError(err)) setError(friendlyMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { data, error, loading, reload };
}

/** Runs a mutation and returns a user-facing error message, or null on success. */
export async function mutate(path: string, init: RequestInit): Promise<string | null> {
  try {
    await apiFetch(path, init);
    return null;
  } catch (err) {
    if (handleAuthError(err)) return null;
    if (err instanceof ApiError && err.status === 400 && err.fieldErrors.length > 0) {
      return `Revise los campos: ${err.fieldErrors.map((field) => field.path).join(', ')}.`;
    }
    if (err instanceof ApiError && (err.status === 400 || err.status === 409)) {
      return err.message;
    }
    return friendlyMessage(err);
  }
}
