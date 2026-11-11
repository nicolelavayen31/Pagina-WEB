import type { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../application/authenticated-user';

export const userWithPermissionsInclude = {
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
} satisfies Prisma.UserInclude;

export type UserWithPermissions = Prisma.UserGetPayload<{ include: typeof userWithPermissionsInclude }>;

/** Flattens user -> roles -> permissions into unique, sorted permission names. */
export function toAuthenticatedUser(user: UserWithPermissions): AuthenticatedUser {
  const roles = user.roles.map((entry) => entry.role.name);
  const permissions = Array.from(
    new Set(user.roles.flatMap((entry) => entry.role.permissions.map((rp) => rp.permission.name))),
  ).sort();
  return { id: user.id, email: user.email, name: user.name, roles, permissions };
}
