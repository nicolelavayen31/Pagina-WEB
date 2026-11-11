import { BadRequestException, type PipeTransform } from '@nestjs/common';

/** Prisma `@default(cuid())` ids (users, services, roles): "c" followed by 24 lowercase alphanumerics. */
const CUID_PATTERN = /^c[a-z0-9]{24}$/;

/** Counterpart of `ParseUUIDPipe` for cuid-keyed tables: malformed ids get a 400 before any query runs. */
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!CUID_PATTERN.test(value)) {
      throw new BadRequestException('Validation failed (cuid is expected)');
    }
    return value;
  }
}
