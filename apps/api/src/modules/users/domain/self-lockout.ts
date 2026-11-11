import { SelfLockoutError } from './user.errors';

const ADMIN_ROLE = 'ADMIN';

export type AccountChanges = { isActive?: boolean; roles?: readonly string[] };

/** An administrator may not deactivate their own account nor drop their own ADMIN role. */
export function assertNoSelfLockout(actorId: string, targetUserId: string, changes: AccountChanges): void {
  if (actorId !== targetUserId) {
    return;
  }
  const deactivatesSelf = changes.isActive === false;
  const dropsOwnAdminRole = changes.roles !== undefined && !changes.roles.includes(ADMIN_ROLE);
  if (deactivatesSelf || dropsOwnAdminRole) {
    throw new SelfLockoutError();
  }
}
