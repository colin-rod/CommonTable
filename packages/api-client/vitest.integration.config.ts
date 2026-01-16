import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Do NOT use the setup file that mocks Supabase
    // Integration tests need real Supabase connections
    include: ['**/*.integration.test.ts'],
    testTimeout: 30000, // 30 seconds for database operations
  },
  resolve: {
    alias: {
      '@commontable/types': path.resolve(__dirname, '../types/src'),
    },
  },
});
