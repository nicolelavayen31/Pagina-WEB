/** Read-only lookups that other modules may make about users, without depending on their storage. */
export abstract class UserDirectory {
  abstract isActive(userId: string): Promise<boolean>;
}
