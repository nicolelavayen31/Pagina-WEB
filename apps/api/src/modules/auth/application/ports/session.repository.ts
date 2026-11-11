import type { AuthenticatedUser } from '../authenticated-user';

export type NewSession = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
};

export type StoredSession = {
  id: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastSeenAt: Date | null;
  user: AuthenticatedUser & { isActive: boolean };
};

export abstract class SessionRepository {
  abstract create(session: NewSession): Promise<{ id: string }>;
  abstract findByTokenHash(tokenHash: string): Promise<StoredSession | null>;
  abstract touch(sessionId: string, at: Date): Promise<void>;
  abstract revokeByTokenHash(tokenHash: string, at: Date): Promise<void>;
  abstract revokeAllForUser(userId: string, at: Date): Promise<void>;
}
