import { apiFetch } from '@/shared/api/client';

export const createLead = (payload: Record<string, unknown>) =>
  apiFetch<{ success: boolean }>('/leads', { method: 'POST', body: JSON.stringify(payload) });
