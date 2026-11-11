const LAST_SEEN_REFRESH_MS = 5 * 60 * 1000;

export type SessionValidity = { expiresAt: Date; revokedAt: Date | null; userIsActive: boolean };

/** Revocation, expiry and user deactivation all take effect on the very next request. */
export function isSessionUsable(session: SessionValidity, now: Date): boolean {
  return !session.revokedAt && session.expiresAt > now && session.userIsActive;
}

/** `lastSeenAt` is refreshed at most every few minutes to avoid a write on every request. */
export function shouldRefreshLastSeen(lastSeenAt: Date | null, now: Date): boolean {
  return !lastSeenAt || now.getTime() - lastSeenAt.getTime() > LAST_SEEN_REFRESH_MS;
}
