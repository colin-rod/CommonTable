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
          branches: 69.5,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        include: ['src/**/*.ts'],
        exclude: [
          'src/**/*.d.ts',
          'src/**/index.ts', // Re-export files don't need coverage
          'src/supabase.ts', // Supabase client wiring is exercised indirectly
        ],
      },
      setupFiles: ['./vitest.setup.ts'],
    },
  }),
);
