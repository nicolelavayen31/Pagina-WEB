import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import { DomainError } from '../../../common/domain/domain-error';
import type { HumanVerifier } from '../application/ports/human-verifier';
import {
  HumanVerificationFailedError,
  HumanVerificationRequiredError,
  HumanVerificationUnavailableError,
} from '../domain/lead.errors';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 5000;

@Injectable()
export class TurnstileHumanVerifier implements HumanVerifier {
  private readonly logger = new Logger(TurnstileHumanVerifier.name);

  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  /** No-op when no secret is configured (allowed only outside production by the env schema). */
  async verify(token: string | undefined, remoteIp: string | undefined): Promise<void> {
    const secret = this.config.get('TURNSTILE_SECRET_KEY', { infer: true });
    if (!secret) {
      return;
    }
    if (!token) {
      throw new HumanVerificationRequiredError();
    }

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    try {
      const response = await fetch(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS) });
      const result = (await response.json()) as { success?: boolean };
      if (!result.success) {
        throw new HumanVerificationFailedError();
      }
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      this.logger.error('Turnstile verification unavailable', (error as Error).stack);
      throw new HumanVerificationUnavailableError();
    }
  }
}
