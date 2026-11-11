import { assertNoSelfLockout } from '../../../src/modules/users/domain/self-lockout';
import { SelfLockoutError } from '../../../src/modules/users/domain/user.errors';

describe('assertNoSelfLockout', () => {
  it.each([
    ['deactivate themselves', { isActive: false }],
    ['drop their own ADMIN role', { roles: ['PROJECT_MANAGER'] }],
  ])('an admin cannot %s', (_label, changes) => {
    expect(() => assertNoSelfLockout('admin-1', 'admin-1', changes)).toThrow(SelfLockoutError);
  });

  it('allows harmless changes to oneself', () => {
    expect(() => assertNoSelfLockout('admin-1', 'admin-1', { isActive: true, roles: ['ADMIN'] })).not.toThrow();
  });

  it('allows deactivating or demoting someone else', () => {
    expect(() => assertNoSelfLockout('admin-1', 'user-2', { isActive: false, roles: [] })).not.toThrow();
  });
});
