import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../../src/common/guards/permissions.guard';

function contextWith(user: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function guardRequiring(permissions: string[] | undefined) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(permissions) } as unknown as Reflector;
  return new PermissionsGuard(reflector);
}

describe('PermissionsGuard', () => {
  it('allows when every required permission is present', () => {
    const guard = guardRequiring(['project:read', 'project:create']);
    expect(guard.canActivate(contextWith({ permissions: ['project:read', 'project:create'] }))).toBe(true);
  });

  it('forbids when one permission is missing', () => {
    const guard = guardRequiring(['project:delete']);
    expect(() => guard.canActivate(contextWith({ permissions: ['project:read'] }))).toThrow(ForbiddenException);
  });

  it('rejects requests without an authenticated user', () => {
    const guard = guardRequiring(['project:read']);
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(UnauthorizedException);
  });

  it('lets routes without permission metadata through', () => {
    expect(guardRequiring(undefined).canActivate(contextWith(undefined))).toBe(true);
  });
});
