import type { AuthenticatedUser } from '../authenticated-user';

export type UserAccount = AuthenticatedUser & { passwordHash: string; isActive: boolean };

export abstract class UserAccountRepository {
  /** Case-insensitive lookup. */
  abstract findByEmail(email: string): Promise<UserAccount | null>;
  abstract recordLogin(userId: string, at: Date): Promise<void>;
}
