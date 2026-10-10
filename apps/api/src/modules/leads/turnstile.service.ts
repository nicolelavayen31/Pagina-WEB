import { BadRequestException, HttpException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '@repo/contracts';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  get enabled(): boolean {
    return Boolean(this.config.get('TURNSTILE_SECRET_KEY', { infer: true }));
  }

  /** No-op when no secret is configured (allowed only outside production by the env schema). */
  async verify(token: string | undefined, remoteIp: string | undefined): Promise<void> {
    if (!this.enabled) {
      return;
    }
    if (!token) {
      throw new BadRequestException({ statusCode: 400, message: 'Verificación antispam requerida' });
    }

    const body = new URLSearchParams({
      secret: this.config.get('TURNSTILE_SECRET_KEY', { infer: true }),
      response: token,
    });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    try {
      const response = await fetch(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(5000) });
      const result = (await response.json()) as { success?: boolean };
      if (!result.success) {
        throw new BadRequestException({ statusCode: 400, message: 'Verificación antispam fallida' });
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Turnstile verification unavailable', (error as Error).stack);
      throw new ServiceUnavailableException('No se pudo verificar la solicitud. Inténtelo más tarde.');
    }
  }
}
