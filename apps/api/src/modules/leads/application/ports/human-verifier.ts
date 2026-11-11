/**
 * Anti-spam challenge check (Cloudflare Turnstile today). Resolves when the request comes from a
 * human or when verification is disabled outside production; otherwise throws a lead domain error.
 */
export abstract class HumanVerifier {
  abstract verify(token: string | undefined, remoteIp: string | undefined): Promise<void>;
}
