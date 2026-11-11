/** Roles and permissions: single source of truth for the API, the seed and the web. */
export const PERMISSIONS = [
  'project:read',
  'project:create',
  'project:update',
  'project:publish',
  'project:unpublish',
  'project:archive',
  'project:delete',
  'project:assign_author',
  'media:upload',
  'media:delete',
  'service:read',
  'service:write',
  'lead:read',
  'lead:update_status',
  'audit:read',
  'user:manage',
  'role:manage',
] as const;

export type PermissionName = (typeof PERMISSIONS)[number];

export const ROLES = ['ADMIN', 'PROJECT_MANAGER'] as const;
export type RoleName = (typeof ROLES)[number];

export const ROLE_PERMISSIONS: Record<RoleName, readonly PermissionName[]> = {
  ADMIN: PERMISSIONS,
  PROJECT_MANAGER: [
    'project:read',
    'project:create',
    'project:update',
    'project:archive',
    'media:upload',
    'media:delete',
  ],
};
