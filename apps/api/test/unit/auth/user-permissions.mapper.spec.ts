import {
  toAuthenticatedUser,
  type UserWithPermissions,
} from '../../../src/modules/auth/infrastructure/user-permissions.mapper';

const role = (name: string, permissions: string[]) => ({
  role: { name, permissions: permissions.map((permission) => ({ permission: { name: permission } })) },
});

describe('toAuthenticatedUser', () => {
  it('merges the permissions of every role, without duplicates and sorted', () => {
    const user = {
      id: 'user-1',
      email: 'ops@example.com',
      name: 'Operator',
      passwordHash: 'secret',
      roles: [role('PROJECT_MANAGER', ['project:read', 'media:upload']), role('ADMIN', ['project:read', 'audit:read'])],
    } as unknown as UserWithPermissions;

    expect(toAuthenticatedUser(user)).toEqual({
      id: 'user-1',
      email: 'ops@example.com',
      name: 'Operator',
      roles: ['PROJECT_MANAGER', 'ADMIN'],
      permissions: ['audit:read', 'media:upload', 'project:read'],
    });
  });
});
