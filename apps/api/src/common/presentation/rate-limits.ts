// Resolved per request so the values come from the loaded environment, not from import time.
export const loginRateLimit = () => Number(process.env.RATE_LIMIT_LOGIN ?? 5);
export const leadsRateLimit = () => Number(process.env.RATE_LIMIT_LEADS ?? 3);
export const RATE_LIMIT_WINDOW_MS = 60_000;
