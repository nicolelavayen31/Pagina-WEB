import type { PublicService } from '@repo/contracts';
import { apiFetch } from '@/shared/api/client';

export const getPublicServices = () => apiFetch<PublicService[]>('/services');
