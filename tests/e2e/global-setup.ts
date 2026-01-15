import { type FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 *
 * Runs once before all tests.
 * Checks that required services are running.
 */
async function globalSetup(config: FullConfig) {
  console.warn('🚀 Starting E2E test suite...');

  // Check if dev server will be started
  const baseURL = config.use?.baseURL || 'http://localhost:3000';
  console.warn(`📍 Base URL: ${baseURL}`);

  // Check if Supabase is running
  try {
    const response = await globalThis.fetch('http://127.0.0.1:54321/rest/v1/');
    if (response.ok || response.status === 401) {
      console.warn('✅ Local Supabase is running');
    }
  } catch (_error) {
    console.warn('⚠️  Local Supabase may not be running. Start it with: supabase start');
    // Don't fail - let tests handle it
  }

  console.warn('✅ Global setup complete\n');
}

export default globalSetup;
