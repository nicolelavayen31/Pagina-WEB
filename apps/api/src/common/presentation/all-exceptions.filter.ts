import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { DomainError, type DomainErrorKind } from '../domain/domain-error';
import { mapPrismaError } from '../persistence/prisma-errors';

const DOMAIN_ERROR_HTTP: Record<DomainErrorKind, { status: HttpStatus; error: string }> = {
  not_found: { status: HttpStatus.NOT_FOUND, error: 'Not Found' },
  conflict: { status: HttpStatus.CONFLICT, error: 'Conflict' },
  invalid: { status: HttpStatus.BAD_REQUEST, error: 'Bad Request' },
  unsupported: { status: HttpStatus.UNSUPPORTED_MEDIA_TYPE, error: 'Unsupported Media Type' },
  unauthenticated: { status: HttpStatus.UNAUTHORIZED, error: 'Unauthorized' },
  unavailable: { status: HttpStatus.SERVICE_UNAVAILABLE, error: 'Service Unavailable' },
};

/**
 * Converts every error into a predictable JSON body and never leaks internals.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof DomainError) {
      const { status, error } = DOMAIN_ERROR_HTTP[exception.kind];
      res.status(status).json({ statusCode: status, message: exception.message, error });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(typeof body === 'string' ? { statusCode: status, message: body } : body);
      return;
    }

    if (exception instanceof ZodError) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Datos inválidos',
        errors: exception.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });
      return;
    }

    const prismaError = mapPrismaError(exception);
    if (prismaError) {
      res.status(prismaError.status).json({ statusCode: prismaError.status, message: prismaError.message });
      return;
    }

    // body-parser errors (malformed JSON, payload too large) carry an HTTP status.
    const parserStatus = (exception as { status?: unknown } | null)?.status;
    if (typeof parserStatus === 'number' && parserStatus >= 400 && parserStatus < 500) {
      res.status(parserStatus).json({ statusCode: parserStatus, message: 'Solicitud inválida' });
      return;
    }

    this.logger.error(
      `${req.method} ${req.originalUrl} -> unhandled error`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
    });
  }
}
