import { defineConfig, devices } from '@playwright/test';
import { existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

/**
 * E2E runs a production build of the web app and the compiled API on their own ports
 * (3100/3101) against the *_test database, so it never touches dev servers or real data.
 */
const WEB_PORT = 3100;
const API_PORT = 3101;
const apiDir = path.resolve(__dirname, '..', 'api');

function testDatabaseUrl(): string {
  let url = process.env.DATABASE_URL;
  const envFile = path.join(apiDir, '.env.test');
  if (!url && existsSync(envFile)) {
    url = readFileSync(envFile, 'utf8').match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m)?.[1];
  }
  if (!url || !new URL(url).pathname.endsWith('_test')) {
    throw new Error('E2E requires DATABASE_URL pointing to a database whose name ends with "_test".');
  }
  return url;
}

const apiEnv = {
  NODE_ENV: 'test',
  PORT: String(API_PORT),
  DATABASE_URL: testDatabaseUrl(),
  CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
  TRUST_PROXY: '1',
  TURNSTILE_SECRET_KEY: '',
  UPLOAD_DIR: path.join(tmpdir(), 'mantenimiento-e2e-uploads'),
  RATE_LIMIT_LOGIN: '50',
  RATE_LIMIT_LEADS: '50',
};

const webEnv = {
  NEXT_DIST_DIR: '.next-e2e',
  API_INTERNAL_URL: `http://127.0.0.1:${API_PORT}`,
  NEXT_PUBLIC_APP_URL: `http://localhost:${WEB_PORT}`,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
  NEXT_TELEMETRY_DISABLED: '1',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: 'node node_modules/@nestjs/cli/bin/nest.js build && node dist/main.js',
      cwd: apiDir,
      url: `http://127.0.0.1:${API_PORT}/api/v1/health/ready`,
      env: apiEnv,
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: `node node_modules/next/dist/bin/next build && node node_modules/next/dist/bin/next start -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/admin/login`,
      env: webEnv,
      timeout: 300_000,
      reuseExistingServer: false,
    },
  ],
});
