import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrador';

  if (!email || !password) {
    console.warn('Bootstrap skipped: ADMIN_EMAIL and ADMIN_PASSWORD must be set before running the admin seed.');
    return;
  }

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Full administrative access' },
  });

  const projectManagerRole = await prisma.role.upsert({
    where: { name: 'PROJECT_MANAGER' },
    update: {},
    create: { name: 'PROJECT_MANAGER', description: 'Manage projects, media, and publication permissions' },
  });

  const permissions = [
    'project:read',
    'project:write',
    'project:publish',
    'project:archive',
    'project:delete',
    'lead:read',
    'lead:write',
    'audit:read',
  ];

  for (const permissionName of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: permissionName },
      update: {},
      create: { name: permissionName },
    });

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id },
    });

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: projectManagerRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: projectManagerRole.id, permissionId: permission.id },
    });
  }

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      isActive: true,
    },
    create: {
      email,
      name,
      passwordHash,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });

  console.log('Bootstrap complete for:', user.email); 
}

async function main() {
  await bootstrapAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
