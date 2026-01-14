/**
 * Vitest setup file for @commontable/web
 *
 * This file runs before all tests to set up global mocks and test utilities.
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

/**
 * Mock Next.js router
 *
 * This prevents errors when testing components that use Next.js navigation.
 */
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
}));

/**
 * Mock environment variables
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
