import { RecipeService } from '@commontable/api-client';
import type { HouseholdId, Household } from '@commontable/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuth } from './useAuth';
import { useTags } from './useTags';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock RecipeService
vi.mock('@commontable/api-client', () => ({
  RecipeService: vi.fn(),
}));

// Mock useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('useTags', () => {
  const mockHouseholdId = 'household-456' as HouseholdId;

  const mockHousehold: Household = {
    id: mockHouseholdId,
    name: 'Test Household',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  let mockGetAllTags: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetAllTags = vi.fn();

    // Mock RecipeService instance
    vi.mocked(RecipeService).mockImplementation(
      () =>
        ({
          getAllTags: mockGetAllTags,
        }) as any,
    );

    // Mock useAuth to return household
    vi.mocked(useAuth).mockReturnValue({
      household: mockHousehold,
      isAuthenticated: true,
      isLoading: false,
      isError: false,
    } as any);
  });

  it('should load tags on mount', async () => {
    const mockTags = ['pasta', 'italian', 'quick'];
    mockGetAllTags.mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTags());

    expect(result.current.loading).toBe(true);
    expect(result.current.tags).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.tags).toEqual(mockTags);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle loading errors', async () => {
    const mockError = new Error('Failed to load tags');
    mockGetAllTags.mockRejectedValue(mockError);

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(mockError);
      expect(result.current.tags).toEqual([]);
    });
  });

  it('should not load tags if no household', async () => {
    vi.mocked(useAuth).mockReturnValue({
      household: null,
      isAuthenticated: false,
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.tags).toEqual([]);
    });

    expect(mockGetAllTags).not.toHaveBeenCalled();
  });

  it('should return empty array while loading', () => {
    mockGetAllTags.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useTags());

    expect(result.current.tags).toEqual([]);
    // Note: loading will eventually become false due to useEffect cleanup
  });

  it('should call getAllTags with household id', async () => {
    const mockTags = ['pasta'];
    mockGetAllTags.mockResolvedValue(mockTags);

    renderHook(() => useTags());

    await waitFor(() => {
      expect(mockGetAllTags).toHaveBeenCalledWith(mockHouseholdId);
    });
  });
});
