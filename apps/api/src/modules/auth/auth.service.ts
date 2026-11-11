import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import type { AuthUser, EnvConfig } from '@repo/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import type { SessionUser } from '../../common/http/authenticated-request';

const LAST_SEEN_REFRESH_MS = 5 * 60 * 1000;
const MAX_TOKEN_LENGTH = 200;

export const userWithPermissionsInclude = {
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
} satisfies Prisma.UserInclude;

type UserWithPermissions = Prisma.UserGetPayload<{ include: typeof userWithPermissionsInclude }>;

/** Only the SHA-256 of the session token is stored, so a database leak does not leak live sessions. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function toAuthUser(user: UserWithPermissions): AuthUser {
  const roles = user.roles.map((entry) => entry.role.name);
  const permissions = Array.from(
    new Set(user.roles.flatMap((entry) => entry.role.permissions.map((rp) => rp.permission.name))),
  ).sort();
  return { id: user.id, email: user.email, name: user.name, roles, permissions };
}

@Injectable()
export class
AuthService {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  get sessionTtlMs(): number {
    return this.config.get('SESSION_TTL_MS', { infer: true });
  }

  async validateCredentials(email: string, password: string): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: userWithPermissionsInclude,
    });

    if (!user || !user.isActive) {
      // Spend comparable time so response timing does not reveal which accounts exist.
      await this.verifyAgainstDummy(password);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return toAuthUser(user);
  }

  async createSession(userId: string, userAgent: string | null, ipAddress: string | null) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.sessionTtlMs);

    const session = await this.prisma.session.create({
      data: {
        userId,
        sessionKey: hashSessionToken(token),
        expiresAt,
        userAgent: userAgent ? userAgent.slice(0, 300) : null,
        ipAddress,
      },
      select: { id: true },
    });

    return { sessionId: session.id, token, expiresAt };
  }

  async resolveSession(token: string | undefined): Promise<SessionUser | null> {
    if (!token || typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH) {
      return null;
    }

    const session = await this.prisma.session.findUnique({
      where: { sessionKey: hashSessionToken(token) },
      include: { user: { include: userWithPermissionsInclude } },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) {
      return null;
    }

    if (!session.lastSeenAt || Date.now() - session.lastSeenAt.getTime() > LAST_SEEN_REFRESH_MS) {
      await this.prisma.session
        .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
        .catch(() => undefined);
    }

    return { ...toAuthUser(session.user), sessionId: session.id };
  }

  async revokeSession(token: string | undefined): Promise<void> {
    if (!token || token.length > MAX_TOKEN_LENGTH) {
      return;
    }
    await this.prisma.session.updateMany({
      where: { sessionKey: hashSessionToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async verifyAgainstDummy(password: string) {
    this.dummyHash ??= argon2.hash(randomBytes(16).toString('hex'));
    await argon2.verify(await this.dummyHash, password).catch(() => false);
  }
}
