import type {
  Recipe,
  RecipeId,
  HouseholdId,
  RecipeSuggestion,
  SuggestionContext,
} from '@commontable/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useRecipeSuggestions } from './useRecipeSuggestions';

import { getRecipeSuggestions } from '@/app/actions/recipeSuggestion';

// Mock server action
vi.mock('@/app/actions/recipeSuggestion', () => ({
  getRecipeSuggestions: vi.fn(),
}));

describe('useRecipeSuggestions Hook', () => {
  const mockRecipe: Recipe = {
    id: 'recipe-1' as RecipeId,
    household_id: 'household-1' as HouseholdId,
    title: 'Test Recipe',
    description: null,
    tags: ['dinner'],
    is_favorite: false,
    rolling_score: 3.5,
    created_by: 'user-1' as any,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    last_cooked_at: null,
    current_version_id: 'version-1' as any,
    // Phase 3 metadata fields
    cuisine: null,
    meal_type: null,
    key_ingredients: [],
    priority: null,
    status: 'suggested',
    cooking_method: null,
    dietary_categories: null,
    dish_category: null,
    source_url: null,
  };

  const mockSuggestions: RecipeSuggestion[] = [
    {
      recipe: mockRecipe,
      score: 0.75,
      badge: 'Top Rated',
      matchingTags: ['dinner'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fetching suggestions on mount', () => {
    it('should fetch suggestions on mount', async () => {
      vi.mocked(getRecipeSuggestions).mockResolvedValue({
        success: true,
        data: mockSuggestions,
      });

      const context: SuggestionContext = { mealSlot: 'dinner' };
      const { result } = renderHook(() => useRecipeSuggestions({ context }));

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.suggestions).toEqual(mockSuggestions);
      expect(result.current.error).toBeNull();
      expect(getRecipeSuggestions).toHaveBeenCalledWith(context, undefined, undefined);
    });

    it('should show loading state while fetching', async () => {
      vi.mocked(getRecipeSuggestions).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: mockSuggestions,
                }),
              100,
            );
          }),
      );

      const context: SuggestionContext = { mealSlot: 'dinner' };
      const { result } = renderHook(() => useRecipeSuggestions({ context }));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle errors', async () => {
      const errorMessage = 'Failed to fetch suggestions';
      vi.mocked(getRecipeSuggestions).mockResolvedValue({
        success: false,
        error: { message: errorMessage },
      });

      const context: SuggestionContext = { mealSlot: 'dinner' };
      const { result } = renderHook(() => useRecipeSuggestions({ context }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe(errorMessage);
      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe('Refetch function', () => {
    it('should refetch suggestions when called', async () => {
      vi.mocked(getRecipeSuggestions).mockResolvedValue({
        success: true,
        data: mockSuggestions,
      });

      const context: SuggestionContext = { mealSlot: 'dinner' };
      const { result } = renderHook(() => useRecipeSuggestions({ context }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock calls
      vi.mocked(getRecipeSuggestions).mockClear();

      // Call refetch
      await result.current.refetch();

      expect(getRecipeSuggestions).toHaveBeenCalledTimes(1);
    });
  });

  describe('Enabled parameter', () => {
    it('should not fetch if enabled=false', async () => {
      vi.mocked(getRecipeSuggestions).mockResolvedValue({
        success: true,
        data: mockSuggestions,
      });

      const context: SuggestionContext = { mealSlot: 'dinner' };
      const { result } = renderHook(() => useRecipeSuggestions({ context, enabled: false }));

      // Wait a bit to ensure no fetch happens
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result.current.loading).toBe(false);
      expect(result.current.suggestions).toEqual([]);
      expect(getRecipeSuggestions).not.toHaveBeenCalled();
    });
  });

  describe('Context changes', () => {
    it('should update suggestions when context changes', async () => {
      vi.mocked(getRecipeSuggestions).mockResolvedValue({
        success: true,
        data: mockSuggestions,
      });

      const { result, rerender } = renderHook(
        ({ context }: { context: SuggestionContext }) => useRecipeSuggestions({ context }),
        {
          initialProps: { context: { mealSlot: 'dinner' } as SuggestionContext },
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock calls
      vi.mocked(getRecipeSuggestions).mockClear();

      // Change context
      rerender({ context: { mealSlot: 'breakfast' } as SuggestionContext });

      await waitFor(() => {
        expect(getRecipeSuggestions).toHaveBeenCalledWith(
          { mealSlot: 'breakfast' },
          undefined,
          undefined,
        );
      });
    });
  });

  describe('Custom weights and limit', () => {
    it('should pass custom weights to server action', async () => {
      vi.mocked(getRecipeSuggestions).mockResolvedValue({
        success: true,
        data: mockSuggestions,
      });

      const context: SuggestionContext = { mealSlot: 'dinner' };
      const customWeights = { favoriteWeight: 0.5, ratingWeight: 0.5 };
      const { result } = renderHook(() =>
        useRecipeSuggestions({ context, weights: customWeights }),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getRecipeSuggestions).toHaveBeenCalledWith(context, customWeights, undefined);
    });

    it('should pass custom limit to server action', async () => {
      vi.mocked(getRecipeSuggestions).mockResolvedValue({
        success: true,
        data: mockSuggestions,
      });

      const context: SuggestionContext = { mealSlot: 'dinner' };
      const { result } = renderHook(() => useRecipeSuggestions({ context, limit: 3 }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getRecipeSuggestions).toHaveBeenCalledWith(context, undefined, 3);
    });
  });
});
