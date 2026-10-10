import { existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

const API_ROOT = path.resolve(__dirname, '..', '..', '..');

/** Absolute guard: integration tests may only ever touch a database whose name ends in "_test". */
export function assertTestDatabase(url: string | undefined = process.env.DATABASE_URL): void {
  if (!url) {
    throw new Error('DATABASE_URL is not set for the integration tests.');
  }
  const databaseName = new URL(url).pathname.replace(/^\//, '');
  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to run integration tests against "${databaseName}": the name must end with "_test".`);
  }
}

/**
 * Loads apps/api/.env.test (local) unless the variables are already provided (CI),
 * then forces the test-only settings.
 */
export function loadTestEnv(): void {
  const envFile = path.join(API_ROOT, '.env.test');
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2];
      }
    }
  }

  Object.assign(process.env, {
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:3000',
    TURNSTILE_SECRET_KEY: '',
    TRUST_PROXY: '0',
    UPLOAD_DIR: path.join(tmpdir(), 'mantenimiento-api-test-uploads'),
    UPLOAD_MAX_BYTES: String(1024 * 1024),
    RATE_LIMIT_LOGIN: '1000',
    RATE_LIMIT_LEADS: '1000',
  });

  assertTestDatabase();
}
