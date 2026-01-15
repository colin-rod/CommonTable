import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for integration tests
 *
 * Integration tests run against a local Supabase instance
 * and test the interaction between services, database, and RLS policies.
 */
export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.next', 'coverage', '.turbo'],
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    testTimeout: 30000, // 30 seconds for database operations
    hookTimeout: 30000,
    teardownTimeout: 30000,
    // Run integration tests sequentially to avoid database conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@commontable/types': path.resolve(__dirname, './packages/types/src'),
      '@commontable/api-client': path.resolve(__dirname, './packages/api-client/src'),
    },
  },
});
