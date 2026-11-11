import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type { NewSession, SessionRepository, StoredSession } from '../application/ports/session.repository';
import { toAuthenticatedUser, userWithPermissionsInclude } from './user-permissions.mapper';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create({ tokenHash, ...session }: NewSession): Promise<{ id: string }> {
    return this.prisma.session.create({ data: { ...session, sessionKey: tokenHash }, select: { id: true } });
  }

  async findByTokenHash(tokenHash: string): Promise<StoredSession | null> {
    const row = await this.prisma.session.findUnique({
      where: { sessionKey: tokenHash },
      include: { user: { include: userWithPermissionsInclude } },
    });
    if (!row) {
      return null;
    }
    const { id, expiresAt, revokedAt, lastSeenAt, user } = row;
    return { id, expiresAt, revokedAt, lastSeenAt, user: { ...toAuthenticatedUser(user), isActive: user.isActive } };
  }

  async touch(sessionId: string, at: Date): Promise<void> {
    await this.prisma.session.update({ where: { id: sessionId }, data: { lastSeenAt: at } });
  }

  async revokeByTokenHash(tokenHash: string, at: Date): Promise<void> {
    await this.prisma.session.updateMany({ where: { sessionKey: tokenHash, revokedAt: null }, data: { revokedAt: at } });
  }

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: at } });
  }
}
