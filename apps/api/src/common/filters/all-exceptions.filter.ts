import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

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

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = mapPrismaError(exception.code);
      if (mapped) {
        res.status(mapped.status).json({ statusCode: mapped.status, message: mapped.message });
        return;
      }
    }

    // body-parser errors (malformed JSON, payload too large) carry an HTTP status.
    const parserStatus = (exception as { status?: unknown; type?: unknown })?.status;
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

function mapPrismaError(code: string): { status: number; message: string } | null {
  switch (code) {
    case 'P2002':
      return { status: HttpStatus.CONFLICT, message: 'Ya existe un registro con ese valor' };
    case 'P2003':
      return { status: HttpStatus.BAD_REQUEST, message: 'Referencia a un registro inexistente' };
    case 'P2025':
      return { status: HttpStatus.NOT_FOUND, message: 'Registro no encontrado' };
    default:
      return null;
  }
}
