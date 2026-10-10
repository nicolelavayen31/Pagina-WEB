import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import request from 'supertest';
import type { RoleName } from '@repo/contracts';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { hashSessionToken } from '../../src/modules/auth/auth.service';
import { syncRolesAndPermissions } from '../../src/modules/auth/rbac-sync';
import { PrismaService } from '../../src/prisma/prisma.service';
import { assertTestDatabase } from './setup/test-env';

export const TEST_PASSWORD = 'Contrasena-Segura-2026';
export const ALLOWED_ORIGIN = 'http://localhost:3000';

export type TestContext = Awaited<ReturnType<typeof createTestApp>>;

export async function createTestApp() {
  assertTestDatabase();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error'] });
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);
  const http = () => request(app.getHttpServer());
  return { app, prisma, http };
}

export async function resetDatabase(prisma: PrismaService) {
  assertTestDatabase();
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "AuditLog", "Session", "UserRole", "RolePermission", "ProjectImage", "Project", "Lead", "Service", "Permission", "Role", "User" CASCADE',
  );
  await syncRolesAndPermissions(prisma);
}

let passwordHash: Promise<string> | undefined;

export async function createUser(
  prisma: PrismaService,
  options: { email: string; roles?: RoleName[]; isActive?: boolean },
) {
  passwordHash ??= argon2.hash(TEST_PASSWORD, { type: argon2.argon2id });
  const roles = await prisma.role.findMany({ where: { name: { in: options.roles ?? [] } } });
  return prisma.user.create({
    data: {
      email: options.email,
      name: options.email.split('@')[0],
      passwordHash: await passwordHash,
      isActive: options.isActive ?? true,
      roles: { create: roles.map((role) => ({ roleId: role.id })) },
    },
  });
}

/** Creates a session directly in the database and returns the Cookie header value. */
export async function sessionCookieFor(
  prisma: PrismaService,
  userId: string,
  overrides: { expiresAt?: Date; revokedAt?: Date } = {},
) {
  const token = randomBytes(32).toString('base64url');
  await prisma.session.create({
    data: {
      userId,
      sessionKey: hashSessionToken(token),
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
      revokedAt: overrides.revokedAt,
    },
  });
  return `session_token=${token}`;
}

export function projectPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Remodelación de oficinas centrales',
    slug: `remodelacion-oficinas-${randomBytes(3).toString('hex')}`,
    summary: 'Adecuación integral de 600 m2 de oficinas corporativas.',
    description:
      'Proyecto de remodelación integral que incluyó tabiquería, cielos rasos, instalaciones eléctricas, iluminación LED y acabados.',
    category: 'Remodelación',
    location: 'Quito',
    ...overrides,
  };
}

export function leadPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Ana Pérez',
    company: 'Comercial Andina',
    email: 'Ana.Perez@Example.com',
    phone: '+593 99 123 4567',
    location: 'Quito',
    description: 'Necesitamos mantenimiento preventivo para un edificio de cinco pisos.',
    budgetRange: 'FROM_1K_TO_5K',
    privacyAccepted: true,
    website: '',
    ...overrides,
  };
}
