export type UserView = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  roles: string[];
};

export type NewUser = { email: string; name: string; passwordHash: string; roleIds: string[] };

export type UserChanges = { name?: string; isActive?: boolean; roleIds?: string[] };

export abstract class UserRepository {
  abstract list(): Promise<UserView[]>;
  abstract exists(id: string): Promise<boolean>;
  /** Ids of the roles that exist among `names`; unknown names are simply missing from the result. */
  abstract findRoleIds(names: readonly string[]): Promise<string[]>;
  abstract create(user: NewUser): Promise<UserView>;
  /** Applies the changes atomically; `roleIds`, when present, replaces every current role. */
  abstract update(id: string, changes: UserChanges): Promise<UserView>;
}
