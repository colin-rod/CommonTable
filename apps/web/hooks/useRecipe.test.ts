import { RecipeService } from '@commontable/api-client';
import type { RecipeWithVersion, RecipeImage, RecipeId } from '@commontable/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useRecipe } from './useRecipe';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock RecipeService
vi.mock('@commontable/api-client', () => ({
  RecipeService: vi.fn(),
}));

describe('useRecipe Hook', () => {
  const mockRecipeId = 'recipe-123' as RecipeId;

  const mockRecipe: RecipeWithVersion = {
    id: mockRecipeId,
    household_id: 'household-123' as any,
    title: 'Pasta Carbonara',
    description: 'Classic Italian pasta dish',
    tags: ['italian', 'pasta'],
    is_favorite: false,
    rolling_score: null,
    last_cooked_at: null,
    created_by: 'user-123' as any,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    current_version_id: 'version-123' as any,
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
    current_version: {
      id: 'version-123' as any,
      recipe_id: mockRecipeId,
      version_number: 1,
      ingredients_json: [{ name: 'pasta', quantity: 400, unit: 'g' }],
      steps_json: [{ position: 1, text: 'Boil pasta' }],
      servings: 4,
      prep_time_minutes: 10,
      cook_time_minutes: 20,
      notes: null,
      created_by: 'user-123' as any,
      created_at: new Date('2024-01-01T00:00:00Z'),
    },
  };

  const mockPrimaryImage: RecipeImage = {
    id: 'image-123' as any,
    recipe_id: mockRecipeId,
    storage_path: 'recipes/pasta.jpg',
    display_order: 1,
    is_primary: true,
    is_public: false,
    alt_text: 'Pasta Carbonara',
    width: null,
    height: null,
    file_size_bytes: null,
    created_by: 'user-123' as any,
    created_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockRecipeService = {
    getWithVersion: vi.fn(),
    getPrimaryImage: vi.fn(),
    toggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(RecipeService).mockImplementation(() => mockRecipeService as any);
  });

  describe('Loading recipe on mount', () => {
    it('should load recipe and primary image on mount', async () => {
      mockRecipeService.getWithVersion.mockResolvedValue(mockRecipe);
      mockRecipeService.getPrimaryImage.mockResolvedValue(mockPrimaryImage);

      const { result } = renderHook(() => useRecipe(mockRecipeId));

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.recipe).toBeNull();
      expect(result.current.primaryImage).toBeNull();
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipe).toEqual(mockRecipe);
      expect(result.current.primaryImage).toEqual(mockPrimaryImage);
      expect(result.current.error).toBeNull();
      expect(mockRecipeService.getWithVersion).toHaveBeenCalledWith(mockRecipeId);
      expect(mockRecipeService.getPrimaryImage).toHaveBeenCalledWith(mockRecipeId);
    });

    it('should not load recipe when recipeId is null', async () => {
      const { result } = renderHook(() => useRecipe(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipe).toBeNull();
      expect(result.current.primaryImage).toBeNull();
      expect(mockRecipeService.getWithVersion).not.toHaveBeenCalled();
      expect(mockRecipeService.getPrimaryImage).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle recipe not found error', async () => {
      const notFoundError = new Error('Recipe not found');
      mockRecipeService.getWithVersion.mockRejectedValue(notFoundError);
      mockRecipeService.getPrimaryImage.mockResolvedValue(null);

      const { result } = renderHook(() => useRecipe(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipe).toBeNull();
      expect(result.current.error).toEqual(notFoundError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockRecipeService.getWithVersion.mockRejectedValue(networkError);
      mockRecipeService.getPrimaryImage.mockResolvedValue(null);

      const { result } = renderHook(() => useRecipe(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(networkError);
    });

    it('should clear error on successful reload', async () => {
      const error = new Error('Failed to load');
      mockRecipeService.getWithVersion.mockRejectedValueOnce(error);
      mockRecipeService.getPrimaryImage.mockResolvedValue(null);

      const { result } = renderHook(() => useRecipe(mockRecipeId));

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      // Retry with success
      mockRecipeService.getWithVersion.mockResolvedValue(mockRecipe);
      mockRecipeService.getPrimaryImage.mockResolvedValue(mockPrimaryImage);

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.recipe).toEqual(mockRecipe);
      });
    });
  });

  describe('Recipe ID changes', () => {
    it('should refetch when recipe ID changes', async () => {
      mockRecipeService.getWithVersion.mockResolvedValue(mockRecipe);
      mockRecipeService.getPrimaryImage.mockResolvedValue(mockPrimaryImage);

      const { result, rerender } = renderHook(({ id }) => useRecipe(id), {
        initialProps: { id: mockRecipeId },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRecipeService.getWithVersion).toHaveBeenCalledWith(mockRecipeId);

      // Change recipe ID
      const newRecipeId = 'recipe-456' as RecipeId;
      const newRecipe: RecipeWithVersion = { ...mockRecipe, id: newRecipeId, title: 'New Recipe' };

      mockRecipeService.getWithVersion.mockResolvedValue(newRecipe);

      rerender({ id: newRecipeId });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRecipeService.getWithVersion).toHaveBeenCalledWith(newRecipeId);
      expect(result.current.recipe).toEqual(newRecipe);
    });

    it('should cancel previous requests when recipe ID changes', async () => {
      let resolveFirstRequest: (value: RecipeWithVersion) => void;
      const firstRequestPromise = new Promise<RecipeWithVersion>((resolve) => {
        resolveFirstRequest = resolve;
      });

      mockRecipeService.getWithVersion.mockReturnValueOnce(firstRequestPromise);
      mockRecipeService.getPrimaryImage.mockResolvedValue(null);

      const { result, rerender } = renderHook(({ id }) => useRecipe(id), {
        initialProps: { id: mockRecipeId },
      });

      // Change recipe ID before first request completes
      const newRecipeId = 'recipe-456' as RecipeId;
      const newRecipe: RecipeWithVersion = { ...mockRecipe, id: newRecipeId };

      mockRecipeService.getWithVersion.mockResolvedValue(newRecipe);

      rerender({ id: newRecipeId });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Resolve first request (should be ignored)
      resolveFirstRequest!(mockRecipe);

      // Should have the new recipe, not the old one
      expect(result.current.recipe).toEqual(newRecipe);
    });
  });

  describe('Toggle favorite', () => {
    it('should toggle favorite status', async () => {
      mockRecipeService.getWithVersion.mockResolvedValue(mockRecipe);
      mockRecipeService.getPrimaryImage.mockResolvedValue(mockPrimaryImage);

      const { result } = renderHook(() => useRecipe(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipe?.is_favorite).toBe(false);

      // toggleFavorite returns a Recipe (not RecipeWithVersion)
      const updatedRecipeBase = {
        id: mockRecipeId,
        household_id: mockRecipe.household_id,
        title: mockRecipe.title,
        description: mockRecipe.description,
        tags: mockRecipe.tags,
        rolling_score: mockRecipe.rolling_score,
        is_favorite: true,
        created_by: mockRecipe.created_by,
        created_at: mockRecipe.created_at,
        updated_at: mockRecipe.updated_at,
        last_cooked_at: mockRecipe.last_cooked_at,
        current_version_id: mockRecipe.current_version_id,
        // Phase 3 metadata fields
        cuisine: mockRecipe.cuisine,
        meal_type: mockRecipe.meal_type,
        key_ingredients: mockRecipe.key_ingredients,
        priority: mockRecipe.priority,
        status: mockRecipe.status,
      };
      mockRecipeService.toggleFavorite.mockResolvedValue(updatedRecipeBase);

      await result.current.toggleFavorite();

      await waitFor(() => {
        expect(mockRecipeService.toggleFavorite).toHaveBeenCalledWith(mockRecipeId);
        expect(result.current.recipe?.is_favorite).toBe(true);
      });
    });

    it('should not toggle favorite when recipeId is null', async () => {
      const { result } = renderHook(() => useRecipe(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.toggleFavorite();

      expect(mockRecipeService.toggleFavorite).not.toHaveBeenCalled();
    });

    it('should not toggle favorite when recipe is not loaded', async () => {
      mockRecipeService.getWithVersion.mockResolvedValue(null);
      mockRecipeService.getPrimaryImage.mockResolvedValue(null);

      const { result } = renderHook(() => useRecipe(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.toggleFavorite();

      expect(mockRecipeService.toggleFavorite).not.toHaveBeenCalled();
    });

    it('should throw error when toggle favorite fails', async () => {
      mockRecipeService.getWithVersion.mockResolvedValue(mockRecipe);
      mockRecipeService.getPrimaryImage.mockResolvedValue(mockPrimaryImage);

      const { result } = renderHook(() => useRecipe(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const toggleError = new Error('Failed to toggle favorite');
      mockRecipeService.toggleFavorite.mockRejectedValue(toggleError);

      await expect(result.current.toggleFavorite()).rejects.toThrow('Failed to toggle favorite');
    });
  });

  describe('Refresh', () => {
    it('should reload recipe data when refresh is called', async () => {
      mockRecipeService.getWithVersion.mockResolvedValue(mockRecipe);
      mockRecipeService.getPrimaryImage.mockResolvedValue(mockPrimaryImage);

      const { result } = renderHook(() => useRecipe(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRecipeService.getWithVersion).toHaveBeenCalledTimes(1);

      // Update mock to return updated recipe
      const updatedRecipe: RecipeWithVersion = { ...mockRecipe, title: 'Updated Recipe' };
      mockRecipeService.getWithVersion.mockResolvedValue(updatedRecipe);

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.recipe?.title).toBe('Updated Recipe');
      });

      expect(mockRecipeService.getWithVersion).toHaveBeenCalledTimes(2);
    });
  });

  describe('Type safety', () => {
    it('should have correct TypeScript types for all return values', async () => {
      mockRecipeService.getWithVersion.mockResolvedValue(mockRecipe);
      mockRecipeService.getPrimaryImage.mockResolvedValue(mockPrimaryImage);

      const { result } = renderHook(() => useRecipe(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Type assertions (compile-time checks)
      const recipe: RecipeWithVersion | null = result.current.recipe;
      const primaryImage: RecipeImage | null = result.current.primaryImage;
      const loading: boolean = result.current.loading;
      const error: Error | null = result.current.error;
      const toggleFavorite: () => Promise<void> = result.current.toggleFavorite;
      const refresh: () => void = result.current.refresh;

      expect(recipe).toBeDefined();
      expect(primaryImage).toBeDefined();
      expect(typeof loading).toBe('boolean');
      expect(error).toBeNull();
      expect(typeof toggleFavorite).toBe('function');
      expect(typeof refresh).toBe('function');
    });
  });
});
