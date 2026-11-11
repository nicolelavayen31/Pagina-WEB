import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type MappedError = { status: HttpStatus; message: string };

const KNOWN_PRISMA_ERRORS: Record<string, MappedError> = {
  P2002: { status: HttpStatus.CONFLICT, message: 'Ya existe un registro con ese valor' },
  P2003: { status: HttpStatus.BAD_REQUEST, message: 'Referencia a un registro inexistente' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Registro no encontrado' },
};

/** Safety net for constraint violations the application layer does not check explicitly (e.g. unique slugs). */
export function mapPrismaError(exception: unknown): MappedError | null {
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    return KNOWN_PRISMA_ERRORS[exception.code] ?? null;
  }
  return null;
}
