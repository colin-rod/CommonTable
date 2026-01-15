/* eslint-disable react-hooks/rules-of-hooks */
// Playwright fixture functions use 'use' parameter which triggers false positive from react-hooks rule
import { test as base, type Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Extended Playwright test fixtures
 *
 * Provides common utilities for E2E tests.
 */

type TestFixtures = {
  /**
   * Authenticated page with logged-in user
   */
  authenticatedPage: Page;

  /**
   * Supabase client for test data setup
   */
  supabaseClient: SupabaseClient;
};

export const test = base.extend<TestFixtures>({
  /**
   * Supabase client fixture
   * Provides access to Supabase for test data management
   */
  supabaseClient: async (_testInfo, use) => {
    const supabaseUrl = process.env.SUPABASE_TEST_URL || 'http://127.0.0.1:54321';
    const supabaseAnonKey =
      process.env.SUPABASE_TEST_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

    const client = createClient(supabaseUrl, supabaseAnonKey);

    await use(client);

    // Cleanup
    await client.auth.signOut();
  },

  /**
   * Authenticated page fixture
   * Automatically signs in a test user before each test
   */
  authenticatedPage: async ({ page, supabaseClient }, use) => {
    // Create test user
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'TestPassword123!';

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: 'Test User',
        },
      },
    });

    if (error) throw error;

    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Use the authenticated page
    await use(page);

    // Cleanup
    await supabaseClient.auth.signOut();
  },
});

export { expect } from '@playwright/test';
