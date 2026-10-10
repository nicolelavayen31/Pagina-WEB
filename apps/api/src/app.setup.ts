import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { EnvConfig } from '@repo/contracts';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Applies the HTTP hardening shared by the real server and the integration tests.
 */
export function configureApp(app: NestExpressApplication) {
  const config = app.get<ConfigService<EnvConfig, true>>(ConfigService);
  const allowedOrigins = config
    .get('CORS_ORIGIN', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const trustProxy = config.get('TRUST_PROXY', { infer: true });
  app.set('trust proxy', trustProxy > 0 ? trustProxy : false);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: allowedOrigins, credentials: true });

  // CSRF defence in depth: browsers always send Origin on cross-site writes.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (!SAFE_METHODS.has(req.method) && origin && !allowedOrigins.includes(origin)) {
      res.status(403).json({ statusCode: 403, message: 'Origen no permitido' });
      return;
    }
    next();
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  return { port: config.get('PORT', { infer: true }) };
}
