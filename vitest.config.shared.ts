import { defineConfig } from 'vitest/config';

/**
 * Shared Vitest configuration for CommonTable monorepo
 *
 * This configuration enforces TDD discipline per CLAUDE.md:
 * - Services & Utils: 100% coverage required
 * - Components: 80%+ coverage required
 * - Coverage provider: v8
 */
export const sharedConfig = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/coverage/**', '**/.turbo/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/coverage/**',
        '**/*.config.ts',
        '**/*.config.js',
        '**/*.d.ts',
        '**/types/**',
        '**/__mocks__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
