/**
 * Integration tests against a real PostgreSQL test database.
 * The setup refuses to run unless the database name ends with "_test".
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/integration/**/*.int-spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  globalSetup: '<rootDir>/test/integration/setup/global-setup.ts',
  setupFiles: ['<rootDir>/test/integration/setup/load-test-env.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
};
