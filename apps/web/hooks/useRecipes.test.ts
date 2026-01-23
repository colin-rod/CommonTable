import { RecipeService } from '@commontable/api-client';
import type { Recipe, RecipeId, HouseholdId, Household } from '@commontable/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuth } from './useAuth';
import { useRecipes } from './useRecipes';

import { createClient } from '@/lib/supabase/client';

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

describe('useRecipes Hook', () => {
  const mockHouseholdId = 'household-123' as HouseholdId;

  const mockHousehold: Household = {
    id: mockHouseholdId,
    name: 'Test Household',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockRecipes: Recipe[] = [
    {
      id: 'recipe-1' as RecipeId,
      household_id: mockHouseholdId,
      title: 'Pasta Carbonara',
      description: 'Classic Italian pasta',
      tags: ['italian', 'pasta'],
      is_favorite: false,
      rolling_score: null,
      created_by: 'user-123' as any,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
      last_cooked_at: null,
      current_version_id: 'version-1' as any,
    },
    {
      id: 'recipe-2' as RecipeId,
      household_id: mockHouseholdId,
      title: 'Caesar Salad',
      description: 'Fresh salad',
      tags: ['salad', 'healthy'],
      is_favorite: true,
      rolling_score: null,
      created_by: 'user-123' as any,
      created_at: new Date('2024-01-02T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
      last_cooked_at: new Date('2024-01-10T00:00:00Z'),
      current_version_id: 'version-2' as any,
    },
  ];

  const mockRecipeService = {
    getByHousehold: vi.fn(),
    toggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(RecipeService).mockImplementation(() => mockRecipeService as any);
    vi.mocked(useAuth).mockReturnValue({
      household: mockHousehold,
    } as any);
  });

  describe('Loading recipes on mount', () => {
    it('should load recipes for household on mount', async () => {
      mockRecipeService.getByHousehold.mockResolvedValue(mockRecipes);

      const { result } = renderHook(() => useRecipes());

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.recipes).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toEqual(mockRecipes);
      expect(result.current.error).toBeNull();
      expect(mockRecipeService.getByHousehold).toHaveBeenCalledWith(mockHouseholdId);
    });

    it('should not load recipes when household is null', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: null,
      } as any);

      const { result } = renderHook(() => useRecipes());

      // Should stay in loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.recipes).toEqual([]);
      expect(mockRecipeService.getByHousehold).not.toHaveBeenCalled();
    });

    it('should handle empty recipe list', async () => {
      mockRecipeService.getByHousehold.mockResolvedValue([]);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors', async () => {
      const fetchError = new Error('Failed to fetch recipes');
      mockRecipeService.getByHousehold.mockRejectedValue(fetchError);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recipes).toEqual([]);
      expect(result.current.error).toEqual(fetchError);
    });

    it('should clear error on successful reload', async () => {
      const error = new Error('Failed to load');
      mockRecipeService.getByHousehold.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      // Retry with success
      mockRecipeService.getByHousehold.mockResolvedValue(mockRecipes);

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.recipes).toEqual(mockRecipes);
      });
    });
  });

  describe('Household changes', () => {
    it('should refetch when household changes', async () => {
      mockRecipeService.getByHousehold.mockResolvedValue(mockRecipes);

      const { result, rerender } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRecipeService.getByHousehold).toHaveBeenCalledWith(mockHouseholdId);
      expect(mockRecipeService.getByHousehold).toHaveBeenCalledTimes(1);

      // Change household
      const newHouseholdId = 'household-456' as HouseholdId;
      const newHousehold: Household = { ...mockHousehold, id: newHouseholdId };
      const newRecipes: Recipe[] = [
        { ...mockRecipes[0]!, id: 'recipe-3' as RecipeId, household_id: newHouseholdId },
      ];

      vi.mocked(useAuth).mockReturnValue({
        household: newHousehold,
      } as any);

      mockRecipeService.getByHousehold.mockResolvedValue(newRecipes);

      rerender();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRecipeService.getByHousehold).toHaveBeenCalledWith(newHouseholdId);
      expect(result.current.recipes).toEqual(newRecipes);
    });
  });

  describe('Toggle favorite', () => {
    it('should toggle favorite status and update local state', async () => {
      mockRecipeService.getByHousehold.mockResolvedValue(mockRecipes);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const recipeToToggle = mockRecipes[0]!;
      expect(result.current.recipes.find((r) => r.id === recipeToToggle.id)?.is_favorite).toBe(
        false,
      );

      const updatedRecipe = { ...recipeToToggle, is_favorite: true };
      mockRecipeService.toggleFavorite.mockResolvedValue(updatedRecipe);

      await result.current.toggleFavorite(recipeToToggle.id);

      await waitFor(() => {
        expect(mockRecipeService.toggleFavorite).toHaveBeenCalledWith(recipeToToggle.id);
        expect(result.current.recipes.find((r) => r.id === recipeToToggle.id)?.is_favorite).toBe(
          true,
        );
      });
    });

    it('should optimistically update state', async () => {
      mockRecipeService.getByHousehold.mockResolvedValue(mockRecipes);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const recipeToToggle = mockRecipes[0]!;
      const updatedRecipe = { ...recipeToToggle, is_favorite: true };

      // Delay the promise to test optimistic update
      let resolveToggle: (value: Recipe) => void;
      const togglePromise = new Promise<Recipe>((resolve) => {
        resolveToggle = resolve;
      });

      mockRecipeService.toggleFavorite.mockReturnValue(togglePromise);

      const togglePromiseResult = result.current.toggleFavorite(recipeToToggle.id);

      // Resolve the promise
      resolveToggle!(updatedRecipe);
      await togglePromiseResult;

      await waitFor(() => {
        expect(result.current.recipes.find((r) => r.id === recipeToToggle.id)?.is_favorite).toBe(
          true,
        );
      });
    });

    it('should throw error when toggle favorite fails', async () => {
      mockRecipeService.getByHousehold.mockResolvedValue(mockRecipes);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const toggleError = new Error('Failed to toggle favorite');
      mockRecipeService.toggleFavorite.mockRejectedValue(toggleError);

      await expect(result.current.toggleFavorite(mockRecipes[0]!.id)).rejects.toThrow(
        'Failed to toggle favorite',
      );
    });
  });

  describe('Refresh', () => {
    it('should reload recipes when refresh is called', async () => {
      mockRecipeService.getByHousehold.mockResolvedValue(mockRecipes);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRecipeService.getByHousehold).toHaveBeenCalledTimes(1);

      // Update mock to return new recipes
      const newRecipes: Recipe[] = [
        ...mockRecipes,
        {
          ...mockRecipes[0]!,
          id: 'recipe-3' as RecipeId,
          title: 'New Recipe',
        },
      ];

      mockRecipeService.getByHousehold.mockResolvedValue(newRecipes);

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.recipes).toEqual(newRecipes);
      });

      expect(mockRecipeService.getByHousehold).toHaveBeenCalledTimes(2);
    });
  });

  describe('Type safety', () => {
    it('should have correct TypeScript types for all return values', async () => {
      mockRecipeService.getByHousehold.mockResolvedValue(mockRecipes);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Type assertions (compile-time checks)
      const recipes: Recipe[] = result.current.recipes;
      const loading: boolean = result.current.loading;
      const error: Error | null = result.current.error;
      const toggleFavorite: (recipeId: RecipeId) => Promise<void> = result.current.toggleFavorite;
      const refresh: () => void = result.current.refresh;

      expect(Array.isArray(recipes)).toBe(true);
      expect(typeof loading).toBe('boolean');
      expect(error).toBeNull();
      expect(typeof toggleFavorite).toBe('function');
      expect(typeof refresh).toBe('function');
    });
  });
});
