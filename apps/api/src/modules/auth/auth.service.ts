import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.roles.map((entry) => entry.role.name);
    const permissions = Array.from(
      new Set(
        user.roles.flatMap((entry) =>
          entry.role.permissions.map((permissionEntry) => permissionEntry.permission.name),
        ),
      ),
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
      permissions,
    };
  }

  async createSession(userId: string, userAgent: string | null, ipAddress: string | null) {
    const sessionKey = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + Number(process.env.SESSION_TTL_MS || 8 * 60 * 60 * 1000));

    const session = await this.prisma.session.create({
      data: {
        userId,
        sessionKey,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    return { ...session, sessionKey };
  }

  async revokeSession(sessionKey: string) {
    await this.prisma.session.updateMany({
      where: { sessionKey, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async signTokenForUser(user: { id: string; email: string; name: string; roles: string[]; permissions: string[] }) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      permissions: user.permissions,
    });
  }
}
