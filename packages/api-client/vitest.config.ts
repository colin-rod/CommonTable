import { defineConfig, mergeConfig } from 'vitest/config';
import { sharedConfig } from '../../vitest.config.shared';

/**
 * Vitest configuration for @commontable/api-client package
 *
 * Per CLAUDE.md TDD requirements:
 * - 100% coverage for all services and business logic
 * - All branches, functions, lines, and statements must be tested
 * - Mock Supabase client for isolated testing
 */
export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      coverage: {
        thresholds: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        include: ['src/**/*.ts'],
        exclude: [
          'src/**/*.d.ts',
          'src/**/index.ts', // Re-export files don't need coverage
        ],
      },
      setupFiles: ['./vitest.setup.ts'],
    },
  }),
);
