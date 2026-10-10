import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type { PermissionName } from '@repo/contracts';
import { PermissionsGuard } from '../guards/permissions.guard';
import { SessionAuthGuard } from '../guards/session-auth.guard';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Requires a valid server-side session and every listed permission.
 * Permissions are loaded from the database on each request, never from the client.
 */
export const RequirePermissions = (...permissions: PermissionName[]) =>
  applyDecorators(SetMetadata(PERMISSIONS_KEY, permissions), UseGuards(SessionAuthGuard, PermissionsGuard));
