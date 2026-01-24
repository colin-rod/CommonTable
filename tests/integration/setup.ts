import { afterAll, beforeAll } from 'vitest';

import { isSupabaseRunning, cleanup } from './helpers/database';

/**
 * Global setup for integration tests
 *
 * Ensures local Supabase instance is running before tests execute.
 */

const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

export type IntegrationTestStatus = {
  enabled: boolean;
  supabaseRunning: boolean;
  skipReason?: string;
};

export const integrationTestStatusPromise: Promise<IntegrationTestStatus> = (async () => {
  if (!runIntegrationTests) {
    const skipReason =
      'Integration tests are disabled. Set RUN_INTEGRATION_TESTS=true to enable them.';
    console.warn(`⚠️ ${skipReason}`);
    return {
      enabled: false,
      supabaseRunning: false,
      skipReason,
    };
  }

  const supabaseRunning = await isSupabaseRunning();

  if (!supabaseRunning) {
    const skipReason =
      'RUN_INTEGRATION_TESTS is true but the local Supabase instance is not running. Start it with: supabase start';
    console.warn(`⚠️ ${skipReason}`);
    return {
      enabled: true,
      supabaseRunning: false,
      skipReason,
    };
  }

  console.warn('✓ Local Supabase instance is running');

  return {
    enabled: true,
    supabaseRunning: true,
  };
})();

beforeAll(async () => {
  await integrationTestStatusPromise;
});

afterAll(async () => {
  const status = await integrationTestStatusPromise;

  if (status.enabled && status.supabaseRunning) {
    await cleanup();
  }
});
