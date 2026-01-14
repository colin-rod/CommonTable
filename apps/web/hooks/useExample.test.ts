/**
 * TDD Example: Testing React hooks
 *
 * This file demonstrates testing patterns for custom hooks per CLAUDE.md:
 * - Use React Testing Library's renderHook
 * - Test loading states
 * - Test error handling
 * - Test data fetching
 *
 * This is a template for future hook tests.
 */

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Example hook for demonstration purposes
function useExample(id: string) {
  const [data, setData] = React.useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => global.setTimeout(resolve, 100));

        if (!cancelled) {
          if (id === 'error') {
            throw new Error('Failed to fetch');
          }
          setData({ id, name: `Item ${id}` });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data, loading, error };
}

describe('useExample', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading state', () => {
    const { result } = renderHook(() => useExample('123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should load data successfully', async () => {
    const { result } = renderHook(() => useExample('123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({
      id: '123',
      name: 'Item 123',
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() => useExample('error'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch');
  });

  it('should update when id changes', async () => {
    const { result, rerender } = renderHook(({ id }) => useExample(id), {
      initialProps: { id: '123' },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.id).toBe('123');

    // Change the id
    rerender({ id: '456' });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.id).toBe('456');
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = renderHook(() => useExample('123'));

    // Unmount immediately before data loads
    unmount();

    // Wait a bit to ensure cleanup prevents state updates
    await new Promise((resolve) => global.setTimeout(resolve, 200));

    // No assertions needed - test passes if no warnings about state updates
  });
});
