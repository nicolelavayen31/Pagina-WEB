'use client';

import { createContext, useContext } from 'react';
import type { AuthUser, PermissionName } from '@repo/contracts';

export const AdminUserContext = createContext<AuthUser | null>(null);

export function useAdminUser(): AuthUser {
  const user = useContext(AdminUserContext);
  if (!user) {
    throw new Error('useAdminUser must be used inside the admin panel layout');
  }
  return user;
}

/** UI hint only: the API enforces every permission again on each request. */
export function useCan() {
  const user = useAdminUser();
  return (permission: PermissionName) => user.permissions.includes(permission);
}
