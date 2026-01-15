import { type FullConfig } from '@playwright/test';

/**
 * Global teardown for E2E tests
 *
 * Runs once after all tests complete.
 */
async function globalTeardown(_config: FullConfig) {
  console.warn('\n🏁 E2E test suite complete');
}

export default globalTeardown;
