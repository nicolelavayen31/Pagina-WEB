/**
 * Resets the *_test database to a known state for the Playwright E2E suite.
 * Refuses to run against any database whose name does not end with "_test".
 */
import { execSync } from 'child_process';
import * as path from 'path';
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { syncRolesAndPermissions } from '../../src/modules/auth/infrastructure/rbac-sync';
import { assertTestDatabase, loadTestEnv } from '../integration/setup/test-env';

export const E2E_USERS = {
  admin: { email: 'e2e-admin@test.local', password: 'E2e-Admin-Password-2026', name: 'Admin E2E', role: 'ADMIN' },
  pm: { email: 'e2e-pm@test.local', password: 'E2e-Manager-Password-2026', name: 'Gestor E2E', role: 'PROJECT_MANAGER' },
} as const;

async function main() {
  loadTestEnv();
  assertTestDatabase();

  const apiRoot = path.resolve(__dirname, '..', '..');
  const prismaBin = path.join(apiRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
  execSync(`"${prismaBin}" migrate deploy`, { cwd: apiRoot, env: process.env, stdio: 'pipe' });

  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "AuditLog", "Session", "UserRole", "RolePermission", "ProjectImage", "Project", "Lead", "Service", "Permission", "Role", "User" CASCADE',
    );
    await syncRolesAndPermissions(prisma);

    for (const user of Object.values(E2E_USERS)) {
      const role = await prisma.role.findUniqueOrThrow({ where: { name: user.role } });
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          passwordHash: await argon2.hash(user.password, { type: argon2.argon2id }),
          roles: { create: [{ roleId: role.id }] },
        },
      });
    }

    await prisma.service.createMany({
      data: [
        { name: 'Mantenimiento integral', slug: 'mantenimiento-integral', summary: 'Mantenimiento preventivo y correctivo.', description: 'Planes de mantenimiento para edificios.', sortOrder: 0 },
        { name: 'Remodelaciones', slug: 'remodelaciones', summary: 'Renovación de espacios.', description: 'Remodelación de oficinas y viviendas.', sortOrder: 10 },
        // Same slug as the real catalogue, so the photo mapping is exercised end to end.
        { name: 'Sistemas neumáticos para camales', slug: 'sistemas-neumaticos-camales', summary: 'Circuitos neumáticos para faenamiento.', description: 'Diseño e instalación de circuitos neumáticos para plantas de faenamiento.', sortOrder: 20 },
      ],
    });
    console.log('E2E database ready.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
