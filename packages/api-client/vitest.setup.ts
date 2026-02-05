/**
 * Vitest setup file for @commontable/api-client
 *
 * This file runs before all tests to set up global mocks and test utilities.
 */

import { vi } from 'vitest';

/**
 * Mock Supabase client
 *
 * This prevents actual API calls during tests and allows us to test
 * service logic in isolation.
 */
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
  })),
}));

/**
 * Mock environment variables
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
