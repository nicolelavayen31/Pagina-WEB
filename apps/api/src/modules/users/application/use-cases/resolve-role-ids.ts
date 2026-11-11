import { UnknownRoleError } from '../../domain/user.errors';
import type { UserRepository } from '../ports/user.repository';

export async function resolveRoleIds(users: UserRepository, names: readonly string[]): Promise<string[]> {
  const roleIds = await users.findRoleIds(names);
  if (roleIds.length !== new Set(names).size) {
    throw new UnknownRoleError();
  }
  return roleIds;
}
