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
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        include: ['src/env.ts', 'src/services/BaseService.ts', 'src/services/Calendar*.ts'],
        exclude: [
          'src/**/*.d.ts',
          'src/**/index.ts', // Re-export files don't need coverage
        ],
      },
      setupFiles: ['./vitest.setup.ts'],
    },
  }),
);
