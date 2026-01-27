import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { sharedConfig } from '../../vitest.config.shared';
import path from 'path';

/**
 * Vitest configuration for @commontable/web app
 *
 * Per CLAUDE.md TDD requirements:
 * - 80%+ coverage for components and hooks
 * - Business logic in hooks must have 100% coverage
 * - Use React Testing Library for component tests
 */
export default mergeConfig(
  sharedConfig,
  defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      coverage: {
        thresholds: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        include: ['components/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}'],
        exclude: [
          'app/**/layout.tsx', // Layout files are Next.js boilerplate
          'app/**/loading.tsx',
          'app/**/error.tsx',
          'app/**/not-found.tsx',
          'components/recipe/RecipeImportPreview.tsx',
          '**/*.d.ts',
        ],
      },
      setupFiles: ['./vitest.setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  }),
);
