import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the server-side Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock Next.js redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock LandingPageContent component
vi.mock('@/components/landing/LandingPageContent', () => ({
  LandingPageContent: () => <div data-testid="landing-page-content">Landing Page Content</div>,
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects authenticated users to dashboard', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { redirect } = await import('next/navigation');

    // Mock authenticated user
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any);

    const HomePage = (await import('./page')).default;

    // This test verifies the redirect happens
    // In actual runtime, redirect throws, preventing render
    try {
      await HomePage();
    } catch (_error) {
      // Redirect throws in Next.js, which is expected
    }

    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('renders LandingPageContent for unauthenticated users', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { redirect } = await import('next/navigation');

    // Mock unauthenticated user
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    const HomePage = (await import('./page')).default;
    const result = await HomePage();

    render(result);

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByTestId('landing-page-content')).toBeInTheDocument();
  });
});
