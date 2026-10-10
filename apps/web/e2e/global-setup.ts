import { execFileSync } from 'child_process';
import * as path from 'path';

/** Resets the *_test database (users, roles, services) before the suite. */
export default function globalSetup() {
  const apiDir = path.resolve(__dirname, '..', '..', 'api');
  execFileSync(
    process.execPath,
    [path.join(apiDir, 'node_modules', 'ts-node', 'dist', 'bin.js'), '--transpile-only', 'test/e2e/prepare-e2e-db.ts'],
    { cwd: apiDir, stdio: 'inherit' },
  );
}
