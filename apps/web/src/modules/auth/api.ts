import type { AuthUser } from '@repo/contracts';
import { apiFetch } from '@/shared/api/client';

export const login = (email: string, password: string) =>
  apiFetch<{ user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const logout = () => apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' });

export const getCurrentUser = () => apiFetch<AuthUser>('/auth/me');
