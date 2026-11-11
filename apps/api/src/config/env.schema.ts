import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z.string().min(10),
    SESSION_TTL_MS: z.coerce
      .number()
      .int()
      .min(60_000)
      .max(30 * 24 * 60 * 60 * 1000)
      .default(8 * 60 * 60 * 1000),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    TURNSTILE_SECRET_KEY: z.string().default(''),
    STORAGE_DRIVER: z.enum(['local']).default('local'),
    UPLOAD_DIR: z.string().min(1).default('./uploads'),
    UPLOAD_MAX_BYTES: z.coerce.number().int().min(1024).default(10 * 1024 * 1024),
    RATE_LIMIT_LOGIN: z.coerce.number().int().min(1).default(5),
    RATE_LIMIT_LEADS: z.coerce.number().int().min(1).default(3),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.TURNSTILE_SECRET_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['TURNSTILE_SECRET_KEY'],
        message: 'TURNSTILE_SECRET_KEY is required in production',
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;
