import { envSchema, type EnvConfig } from './env.schema';

/** Fails fast at startup: the API refuses to boot with missing or invalid settings. */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment configuration -> ${issues.join('; ')}`);
  }
  return result.data;
}
