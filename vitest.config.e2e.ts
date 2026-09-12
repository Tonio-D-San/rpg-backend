import {resolve} from 'node:path';
import {config as loadEnv} from 'dotenv';
import {expand} from 'dotenv-expand';
import {defineConfig} from 'vitest/config';

expand(
  loadEnv({
    path: resolve(process.cwd(), '.env.test'),
    override: true,
  }),
);

console.log('[E2E ENV]', {
  cwd: process.cwd(),
  baseUrl: process.env.KC_BASE_URL,
  realm: process.env.KC_REALM,
  clientId: process.env.KC_SERVICE_CLIENT_ID,
  databaseUrl: process.env.DATABASE_URL,
});

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    fileParallelism: false,
    testTimeout: 15_000,
  },
});
