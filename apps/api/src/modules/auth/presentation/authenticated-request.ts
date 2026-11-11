import type { Request } from 'express';
import type { SessionUser } from '../application/authenticated-user';

export type { SessionUser };

export type AuthenticatedRequest = Request & { user?: SessionUser };
