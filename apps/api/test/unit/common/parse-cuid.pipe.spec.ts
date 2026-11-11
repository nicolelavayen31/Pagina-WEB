import { BadRequestException } from '@nestjs/common';
import { ParseCuidPipe } from '../../../src/common/presentation/parse-cuid.pipe';

describe('ParseCuidPipe', () => {
  const pipe = new ParseCuidPipe();

  it('accepts Prisma cuid ids', () => {
    expect(pipe.transform('cmwc9fvny0004l8f6cllfzqx8')).toBe('cmwc9fvny0004l8f6cllfzqx8');
  });

  it.each(['123', 'nope', '8c0f6f1e-1d2b-4c1a-9f7e-2b7c1f0e9a11', 'CMWC9FVNY0004L8F6CLLFZQX8', 'cmwc9fvny0004l8f6cllfzqx8x', ''])(
    'rejects %p with a 400',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(BadRequestException);
    },
  );
});
