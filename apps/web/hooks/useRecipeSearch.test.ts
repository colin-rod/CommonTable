import { RecipeService } from '@commontable/api-client';
import type { RecipeSearchResult, HouseholdId, Household } from '@commontable/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useAuth } from './useAuth';
import { useRecipeSearch } from './useRecipeSearch';

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

describe('useRecipeSearch Hook', () => {
  const mockHouseholdId = 'household-123' as HouseholdId;

  const mockHousehold: Household = {
    id: mockHouseholdId,
    name: 'Test Household',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSearchResults: RecipeSearchResult[] = [
    {
      id: 'recipe-1' as any,
      household_id: mockHouseholdId,
      title: 'Pasta Carbonara',
      description: 'Classic Italian pasta',
      current_version_id: null,
      rolling_score: null,
      tags: ['italian', 'pasta'],
      is_favorite: false,
      last_cooked_at: null,
      created_by: 'user-1' as any,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      // Phase 3 metadata fields
      cuisine: null,
      meal_type: null,
      key_ingredients: [],
      priority: null,
      status: 'suggested',
      cooking_method: null,
      dietary_categories: null,
      dish_category: null,
      rank: 0.95,
    },
    {
      id: 'recipe-2' as any,
      household_id: mockHouseholdId,
      title: 'Spaghetti Bolognese',
      description: 'Traditional meat sauce',
      current_version_id: null,
      rolling_score: null,
      tags: ['italian', 'pasta'],
      is_favorite: false,
      last_cooked_at: null,
      created_by: 'user-1' as any,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      // Phase 3 metadata fields
      cuisine: null,
      meal_type: null,
      key_ingredients: [],
      priority: null,
      status: 'suggested',
      cooking_method: null,
      dietary_categories: null,
      dish_category: null,
      rank: 0.87,
    },
  ];

  const mockRecipeService = {
    search: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecipeService.search.mockReset();
    vi.mocked(RecipeService).mockImplementation(() => mockRecipeService as any);
    vi.mocked(useAuth).mockReturnValue({
      household: mockHousehold,
    } as any);
  });

  describe('Debounced search', () => {
    it('should debounce search input by default (300ms)', async () => {
      mockRecipeService.search.mockResolvedValue(mockSearchResults);

      const { result } = renderHook(() => useRecipeSearch('pasta'));

      // Should not search immediately
      expect(mockRecipeService.search).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(true);

      // Wait for debounce to complete
      await waitFor(
        () => {
          expect(mockRecipeService.search).toHaveBeenCalledWith('pasta', mockHouseholdId);
        },
        { timeout: 2000 },
      );

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
          expect(result.current.results).toEqual(mockSearchResults);
        },
        { timeout: 2000 },
      );
    }, 10000);

    it('should use custom debounce delay', async () => {
      mockRecipeService.search.mockResolvedValue(mockSearchResults);

      const { result } = renderHook(() => useRecipeSearch('pasta', 500));

      expect(result.current.loading).toBe(true);
      expect(mockRecipeService.search).not.toHaveBeenCalled();

      // Wait for debounce to complete (500ms + buffer)
      await waitFor(
        () => {
          expect(mockRecipeService.search).toHaveBeenCalledWith('pasta', mockHouseholdId);
        },
        { timeout: 2000 },
      );

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 2000 },
      );
    }, 10000);

    it('should cancel pending search when query changes', async () => {
      mockRecipeService.search.mockResolvedValue(mockSearchResults);

      const { rerender } = renderHook(({ query }) => useRecipeSearch(query), {
        initialProps: { query: 'pasta' },
      });

      // Change query before debounce completes
      await new Promise((resolve) => setTimeout(resolve, 100));
      rerender({ query: 'salad' });

      // Wait for new search to complete
      await waitFor(
        () => {
          expect(mockRecipeService.search).toHaveBeenCalledWith('salad', mockHouseholdId);
        },
        { timeout: 2000 },
      );

      // Should only have been called once (for 'salad', not 'pasta')
      expect(mockRecipeService.search).toHaveBeenCalledTimes(1);
    }, 10000);
  });

  describe('Search functionality', () => {
    it('should search recipes by query', async () => {
      mockRecipeService.search.mockResolvedValue(mockSearchResults);

      const { result } = renderHook(() => useRecipeSearch('pasta'));

      expect(result.current.results).toEqual([]);
      expect(result.current.loading).toBe(true);

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 2000 },
      );

      expect(result.current.results).toEqual(mockSearchResults);
      expect(result.current.error).toBeNull();
      expect(mockRecipeService.search).toHaveBeenCalledWith('pasta', mockHouseholdId);
    }, 10000);

    it('should clear results when query is empty', async () => {
      mockRecipeService.search.mockResolvedValue(mockSearchResults);

      const { result, rerender } = renderHook(({ query }) => useRecipeSearch(query), {
        initialProps: { query: 'pasta' },
      });

      await waitFor(
        () => {
          expect(result.current.results).toEqual(mockSearchResults);
        },
        { timeout: 2000 },
      );

      // Clear query
      rerender({ query: '' });

      // Should clear results immediately without debounce
      await waitFor(() => {
        expect(result.current.results).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
      expect(mockRecipeService.search).toHaveBeenCalledTimes(1); // No new search call
    }, 10000);

    it('should clear results when query is whitespace', async () => {
      mockRecipeService.search.mockResolvedValue(mockSearchResults);

      const { result, rerender } = renderHook(({ query }) => useRecipeSearch(query), {
        initialProps: { query: 'pasta' },
      });

      await waitFor(
        () => {
          expect(result.current.results).toEqual(mockSearchResults);
        },
        { timeout: 2000 },
      );

      // Set query to whitespace
      rerender({ query: '   ' });

      await waitFor(() => {
        expect(result.current.results).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
    }, 10000);

    it('should not search when household is null', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: null,
      } as any);

      const { result } = renderHook(() => useRecipeSearch('pasta'));

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 2000 },
      );

      expect(result.current.results).toEqual([]);
      expect(mockRecipeService.search).not.toHaveBeenCalled();
    }, 10000);
  });

  describe('Error handling', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should handle search errors', async () => {
      const searchError = new Error('Search failed');
      mockRecipeService.search.mockRejectedValue(searchError);

      const { result } = renderHook(() => useRecipeSearch('pasta'));

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 2000 },
      );

      expect(result.current.results).toEqual([]);
      expect(result.current.error).toEqual(searchError);
    }, 10000);

    it('should clear error on successful search', async () => {
      const error = new Error('Search failed');
      mockRecipeService.search.mockRejectedValueOnce(error);

      const { result, rerender } = renderHook(({ query }) => useRecipeSearch(query), {
        initialProps: { query: 'pasta' },
      });

      await waitFor(
        () => {
          expect(result.current.error).toEqual(error);
        },
        { timeout: 2000 },
      );

      // Retry with success
      mockRecipeService.search.mockResolvedValue(mockSearchResults);
      rerender({ query: 'salad' });

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 2000 },
      );

      expect(result.current.error).toBeNull();
      expect(result.current.results).toEqual(mockSearchResults);
    }, 10000);
  });

  describe('Race condition handling', () => {
    it('should only update with latest query results', async () => {
      let resolveFirstSearch: (value: RecipeSearchResult[]) => void;
      const firstSearchPromise = new Promise<RecipeSearchResult[]>((resolve) => {
        resolveFirstSearch = resolve;
      });

      const secondSearchResults: RecipeSearchResult[] = [
        {
          id: 'recipe-3' as any,
          household_id: mockHouseholdId,
          title: 'Caesar Salad',
          description: 'Fresh salad',
          current_version_id: null,
          rolling_score: null,
          tags: ['salad'],
          is_favorite: false,
          last_cooked_at: null,
          created_by: 'user-1' as any,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          // Phase 3 metadata fields
          cuisine: null,
          meal_type: null,
          key_ingredients: [],
          priority: null,
          status: 'suggested',
          cooking_method: null,
          dietary_categories: null,
          dish_category: null,
          rank: 0.98,
        },
      ];

      mockRecipeService.search.mockReturnValueOnce(firstSearchPromise);
      mockRecipeService.search.mockResolvedValueOnce(secondSearchResults);

      const { result, rerender } = renderHook(({ query }) => useRecipeSearch(query), {
        initialProps: { query: 'pasta' },
      });

      // Wait for debounce, then change query before first search completes
      await new Promise((resolve) => setTimeout(resolve, 350));
      rerender({ query: 'salad' });

      // Wait for second search to complete
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
          expect(result.current.results).toEqual(secondSearchResults);
        },
        { timeout: 2000 },
      );

      // Resolve first search (should be ignored due to latestQueryRef)
      resolveFirstSearch!(mockSearchResults);

      // Verify results haven't changed to first search results
      await waitFor(() => {
        expect(result.current.results).toEqual(secondSearchResults);
      });
    }, 10000);

    it('should not update error from stale search', async () => {
      let rejectFirstSearch: (error: Error) => void;
      const firstSearchPromise = new Promise<RecipeSearchResult[]>((_, reject) => {
        rejectFirstSearch = reject;
      }).catch(() => {
        // Catch to prevent unhandled rejection
      });

      mockRecipeService.search.mockReturnValueOnce(
        firstSearchPromise as Promise<RecipeSearchResult[]>,
      );
      mockRecipeService.search.mockResolvedValueOnce(mockSearchResults);

      const { result, rerender } = renderHook(({ query }) => useRecipeSearch(query), {
        initialProps: { query: 'pasta' },
      });

      // Wait for debounce, then change query before first search completes
      await new Promise((resolve) => setTimeout(resolve, 350));
      rerender({ query: 'salad' });

      // Wait for second search to complete successfully
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
          expect(result.current.results).toEqual(mockSearchResults);
          expect(result.current.error).toBeNull();
        },
        { timeout: 2000 },
      );

      // Reject first search (should be ignored, no unhandled rejection)
      rejectFirstSearch!(new Error('Stale search error'));

      // Wait a bit to ensure state doesn't change
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Error should still be null, results should be from second search
      expect(result.current.error).toBeNull();
      expect(result.current.results).toEqual(mockSearchResults);
    }, 10000);
  });

  describe('Type safety', () => {
    it('should have correct TypeScript types for all return values', async () => {
      mockRecipeService.search.mockResolvedValue(mockSearchResults);

      const { result } = renderHook(() => useRecipeSearch('pasta'));

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 2000 },
      );

      // Type assertions (compile-time checks)
      const results: RecipeSearchResult[] = result.current.results;
      const loading: boolean = result.current.loading;
      const error: Error | null = result.current.error;

      expect(Array.isArray(results)).toBe(true);
      expect(typeof loading).toBe('boolean');
      expect(error).toBeNull();
    }, 10000);
  });
});
