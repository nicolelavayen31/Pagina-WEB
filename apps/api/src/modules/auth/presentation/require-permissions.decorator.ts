import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type { PermissionName } from '@repo/contracts';
import { PERMISSIONS_KEY, PermissionsGuard } from './permissions.guard';
import { SessionAuthGuard } from './session-auth.guard';

/**
 * Requires a valid server-side session and every listed permission.
 * Permissions are loaded from the database on each request, never from the client.
 */
export const RequirePermissions = (...permissions: PermissionName[]) =>
  applyDecorators(SetMetadata(PERMISSIONS_KEY, permissions), UseGuards(SessionAuthGuard, PermissionsGuard));
