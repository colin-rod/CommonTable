import { beforeAll, afterAll } from 'vitest';

import { isSupabaseRunning, cleanup } from './helpers/database';

/**
 * Global setup for integration tests
 *
 * Ensures local Supabase instance is running before tests execute.
 */

beforeAll(async () => {
  // Check if Supabase is running
  const isRunning = await isSupabaseRunning();

  if (!isRunning) {
    throw new Error('Local Supabase instance is not running. Please start it with: supabase start');
  }

  console.warn('✓ Local Supabase instance is running');
});

afterAll(async () => {
  // Cleanup connections
  await cleanup();
});
