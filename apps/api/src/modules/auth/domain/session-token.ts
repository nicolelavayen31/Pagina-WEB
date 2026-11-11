import { createHash, randomBytes } from 'crypto';

const MAX_TOKEN_LENGTH = 200;

/** 256 random bits, URL-safe. Only the client ever holds the raw token. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Only the SHA-256 of the session token is stored, so a database leak does not leak live sessions. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Cheap pre-check that avoids a database round trip for missing or absurd cookie values. */
export function isPlausibleSessionToken(token: unknown): token is string {
  return typeof token === 'string' && token.length > 0 && token.length <= MAX_TOKEN_LENGTH;
}
