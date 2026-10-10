import { execSync } from 'child_process';
import * as path from 'path';
import { loadTestEnv } from './test-env';

/** Brings the test database schema up to date with the versioned migrations. */
export default async function globalSetup() {
  loadTestEnv();
  const apiRoot = path.resolve(__dirname, '..', '..', '..');
  const prismaBin = path.join(apiRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
  execSync(`"${prismaBin}" migrate deploy`, { cwd: apiRoot, env: process.env, stdio: 'pipe' });
}
