/** Port shared by every module that stores or checks passwords. */
export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  /** Resolves to false (never throws) for a wrong password or a malformed hash. */
  abstract verify(hash: string, password: string): Promise<boolean>;
}
