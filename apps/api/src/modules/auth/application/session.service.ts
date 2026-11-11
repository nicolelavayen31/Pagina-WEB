import { Injectable } from '@nestjs/common';
import { isSessionUsable, shouldRefreshLastSeen } from '../domain/session';
import { generateSessionToken, hashSessionToken, isPlausibleSessionToken } from '../domain/session-token';
import type { SessionUser } from './authenticated-user';
import { SessionRepository } from './ports/session.repository';

export abstract class SessionPolicy {
  abstract readonly ttlMs: number;
}

export type IssuedSession = { sessionId: string; token: string; expiresAt: Date };

/**
 * Opaque server-side sessions. The user and their permissions are reloaded on every request,
 * so revocation, deactivation and role changes apply immediately.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly policy: SessionPolicy,
  ) {}

  async create(userId: string, client: { userAgent: string | null; ipAddress: string | null }): Promise<IssuedSession> {
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + this.policy.ttlMs);
    const { id } = await this.sessions.create({
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      userAgent: client.userAgent ? client.userAgent.slice(0, 300) : null,
      ipAddress: client.ipAddress,
    });
    return { sessionId: id, token, expiresAt };
  }

  async resolve(token: unknown): Promise<SessionUser | null> {
    if (!isPlausibleSessionToken(token)) {
      return null;
    }

    const session = await this.sessions.findByTokenHash(hashSessionToken(token));
    const now = new Date();
    if (!session || !isSessionUsable({ ...session, userIsActive: session.user.isActive }, now)) {
      return null;
    }

    if (shouldRefreshLastSeen(session.lastSeenAt, now)) {
      await this.sessions.touch(session.id, now).catch(() => undefined);
    }

    const { isActive: _isActive, ...user } = session.user;
    return { ...user, sessionId: session.id };
  }

  async revoke(token: unknown): Promise<void> {
    if (isPlausibleSessionToken(token)) {
      await this.sessions.revokeByTokenHash(hashSessionToken(token), new Date());
    }
  }

  revokeAllForUser(userId: string): Promise<void> {
    return this.sessions.revokeAllForUser(userId, new Date());
  }
}
