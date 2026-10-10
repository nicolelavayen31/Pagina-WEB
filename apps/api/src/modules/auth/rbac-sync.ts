import type { PrismaClient } from '@prisma/client';
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from '@repo/contracts';

const ROLE_DESCRIPTIONS: Record<(typeof ROLES)[number], string> = {
  ADMIN: 'Acceso administrativo completo',
  PROJECT_MANAGER: 'Gestiona proyectos y sus imágenes, sin publicar ni eliminar',
};

/**
 * Makes the roles and permissions in the database match `ROLE_PERMISSIONS` exactly.
 * Idempotent: obsolete permissions are removed and missing ones are created.
 */
export async function syncRolesAndPermissions(prisma: PrismaClient): Promise<void> {
  const permissionNames: readonly string[] = PERMISSIONS;

  await prisma.permission.deleteMany({ where: { name: { notIn: [...permissionNames] } } });
  for (const name of permissionNames) {
    await prisma.permission.upsert({ where: { name }, update: {}, create: { name } });
  }

  const permissions = await prisma.permission.findMany({ select: { id: true, name: true } });
  const permissionIdByName = new Map(permissions.map((permission) => [permission.name, permission.id]));

  for (const roleName of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: ROLE_DESCRIPTIONS[roleName] },
      create: { name: roleName, description: ROLE_DESCRIPTIONS[roleName] },
    });

    const desiredIds = ROLE_PERMISSIONS[roleName].map((name) => permissionIdByName.get(name)!);

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id, permissionId: { notIn: desiredIds } } });
    await prisma.rolePermission.createMany({
      data: desiredIds.map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }
}
