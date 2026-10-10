import type { Request } from 'express';
import type { AuthUser } from '@repo/contracts';

export type SessionUser = AuthUser & { sessionId: string };

export type AuthenticatedRequest = Request & { user?: SessionUser };
