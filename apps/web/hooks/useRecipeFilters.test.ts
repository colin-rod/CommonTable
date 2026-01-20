import type { Recipe, RecipeId, HouseholdId, UserId } from '@commontable/types';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useRecipeFilters } from './useRecipeFilters';

// Test data factory
function createTestRecipe(overrides: Partial<Recipe>): Recipe {
  return {
    id: 'recipe-1' as RecipeId,
    household_id: 'household-1' as HouseholdId,
    title: 'Test Recipe',
    description: null,
    current_version_id: null,
    rolling_score: null,
    tags: [],
    is_favorite: false,
    last_cooked_at: null,
    created_by: 'user-1' as UserId,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

describe('useRecipeFilters', () => {
  describe('tag filter (AND logic)', () => {
    it('should return all recipes when no tags selected', () => {
      const recipes: Recipe[] = [
        createTestRecipe({ id: 'recipe-1' as RecipeId, tags: ['pasta', 'italian'] }),
        createTestRecipe({ id: 'recipe-2' as RecipeId, tags: ['chicken', 'asian'] }),
      ];

      const { result } = renderHook(() => useRecipeFilters(recipes, [], false, 'last-cooked'));

      expect(result.current).toHaveLength(2);
    });

    it('should filter recipes that have ALL selected tags (AND logic)', () => {
      const recipes: Recipe[] = [
        createTestRecipe({
          id: 'recipe-1' as RecipeId,
          title: 'Pasta Carbonara',
          tags: ['pasta', 'italian', 'dinner'],
        }),
        createTestRecipe({
          id: 'recipe-2' as RecipeId,
          title: 'Chicken Pasta',
          tags: ['pasta', 'chicken'],
        }),
        createTestRecipe({
          id: 'recipe-3' as RecipeId,
          title: 'Italian Risotto',
          tags: ['italian', 'rice'],
        }),
      ];

      const { result } = renderHook(() =>
        useRecipeFilters(recipes, ['pasta', 'italian'], false, 'last-cooked'),
      );

      // Only recipe-1 has both 'pasta' AND 'italian'
      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.id).toBe('recipe-1');
      expect(result.current[0]?.title).toBe('Pasta Carbonara');
    });

    it('should return empty array when no recipes match all selected tags', () => {
      const recipes: Recipe[] = [
        createTestRecipe({ id: 'recipe-1' as RecipeId, tags: ['pasta'] }),
        createTestRecipe({ id: 'recipe-2' as RecipeId, tags: ['italian'] }),
      ];

      const { result } = renderHook(() =>
        useRecipeFilters(recipes, ['pasta', 'italian'], false, 'last-cooked'),
      );

      expect(result.current).toHaveLength(0);
    });

    it('should handle single tag selection', () => {
      const recipes: Recipe[] = [
        createTestRecipe({ id: 'recipe-1' as RecipeId, tags: ['pasta', 'italian'] }),
        createTestRecipe({ id: 'recipe-2' as RecipeId, tags: ['chicken', 'asian'] }),
        createTestRecipe({ id: 'recipe-3' as RecipeId, tags: ['pasta'] }),
      ];

      const { result } = renderHook(() =>
        useRecipeFilters(recipes, ['pasta'], false, 'last-cooked'),
      );

      expect(result.current).toHaveLength(2);
      expect(result.current.map((r) => r.id)).toEqual(
        expect.arrayContaining(['recipe-1', 'recipe-3']),
      );
    });
  });

  describe('favorites filter', () => {
    it('should return all recipes when showFavoritesOnly is false', () => {
      const recipes: Recipe[] = [
        createTestRecipe({ id: 'recipe-1' as RecipeId, is_favorite: true }),
        createTestRecipe({ id: 'recipe-2' as RecipeId, is_favorite: false }),
      ];

      const { result } = renderHook(() => useRecipeFilters(recipes, [], false, 'last-cooked'));

      expect(result.current).toHaveLength(2);
    });

    it('should filter only favorite recipes when showFavoritesOnly is true', () => {
      const recipes: Recipe[] = [
        createTestRecipe({
          id: 'recipe-1' as RecipeId,
          title: 'Favorite Recipe',
          is_favorite: true,
        }),
        createTestRecipe({
          id: 'recipe-2' as RecipeId,
          title: 'Normal Recipe',
          is_favorite: false,
        }),
        createTestRecipe({
          id: 'recipe-3' as RecipeId,
          title: 'Another Favorite',
          is_favorite: true,
        }),
      ];

      const { result } = renderHook(() => useRecipeFilters(recipes, [], true, 'last-cooked'));

      expect(result.current).toHaveLength(2);
      expect(result.current.map((r) => r.title)).toEqual(
        expect.arrayContaining(['Favorite Recipe', 'Another Favorite']),
      );
    });

    it('should combine tag filter and favorites filter', () => {
      const recipes: Recipe[] = [
        createTestRecipe({
          id: 'recipe-1' as RecipeId,
          tags: ['pasta', 'italian'],
          is_favorite: true,
        }),
        createTestRecipe({
          id: 'recipe-2' as RecipeId,
          tags: ['pasta', 'italian'],
          is_favorite: false,
        }),
        createTestRecipe({
          id: 'recipe-3' as RecipeId,
          tags: ['chicken'],
          is_favorite: true,
        }),
      ];

      const { result } = renderHook(() =>
        useRecipeFilters(recipes, ['pasta', 'italian'], true, 'last-cooked'),
      );

      // Only recipe-1 has both tags AND is favorite
      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.id).toBe('recipe-1');
    });
  });

  describe('sort options', () => {
    describe('last-cooked sort', () => {
      it('should sort by last_cooked_at descending (most recent first)', () => {
        const recipes: Recipe[] = [
          createTestRecipe({
            id: 'recipe-1' as RecipeId,
            title: 'Old Recipe',
            last_cooked_at: new Date('2025-01-01'),
          }),
          createTestRecipe({
            id: 'recipe-2' as RecipeId,
            title: 'Recent Recipe',
            last_cooked_at: new Date('2025-01-20'),
          }),
          createTestRecipe({
            id: 'recipe-3' as RecipeId,
            title: 'Middle Recipe',
            last_cooked_at: new Date('2025-01-10'),
          }),
        ];

        const { result } = renderHook(() => useRecipeFilters(recipes, [], false, 'last-cooked'));

        expect(result.current.map((r) => r.title)).toEqual([
          'Recent Recipe',
          'Middle Recipe',
          'Old Recipe',
        ]);
      });

      it('should place recipes with null last_cooked_at at the end', () => {
        const recipes: Recipe[] = [
          createTestRecipe({
            id: 'recipe-1' as RecipeId,
            title: 'Never Cooked',
            last_cooked_at: null,
          }),
          createTestRecipe({
            id: 'recipe-2' as RecipeId,
            title: 'Recently Cooked',
            last_cooked_at: new Date('2025-01-20'),
          }),
          createTestRecipe({
            id: 'recipe-3' as RecipeId,
            title: 'Also Never Cooked',
            last_cooked_at: null,
          }),
        ];

        const { result } = renderHook(() => useRecipeFilters(recipes, [], false, 'last-cooked'));

        expect(result.current[0]?.title).toBe('Recently Cooked');
        expect(result.current.slice(1).map((r) => r.title)).toEqual(
          expect.arrayContaining(['Never Cooked', 'Also Never Cooked']),
        );
      });
    });

    describe('recent sort', () => {
      it('should sort by created_at descending (newest first)', () => {
        const recipes: Recipe[] = [
          createTestRecipe({
            id: 'recipe-1' as RecipeId,
            title: 'Old Recipe',
            created_at: new Date('2025-01-01'),
          }),
          createTestRecipe({
            id: 'recipe-2' as RecipeId,
            title: 'Newest Recipe',
            created_at: new Date('2025-01-20'),
          }),
          createTestRecipe({
            id: 'recipe-3' as RecipeId,
            title: 'Middle Recipe',
            created_at: new Date('2025-01-10'),
          }),
        ];

        const { result } = renderHook(() => useRecipeFilters(recipes, [], false, 'recent'));

        expect(result.current.map((r) => r.title)).toEqual([
          'Newest Recipe',
          'Middle Recipe',
          'Old Recipe',
        ]);
      });
    });

    describe('alphabetical sort', () => {
      it('should sort by title A-Z', () => {
        const recipes: Recipe[] = [
          createTestRecipe({ id: 'recipe-1' as RecipeId, title: 'Zucchini Pasta' }),
          createTestRecipe({ id: 'recipe-2' as RecipeId, title: 'Apple Pie' }),
          createTestRecipe({ id: 'recipe-3' as RecipeId, title: 'Banana Bread' }),
        ];

        const { result } = renderHook(() => useRecipeFilters(recipes, [], false, 'alphabetical'));

        expect(result.current.map((r) => r.title)).toEqual([
          'Apple Pie',
          'Banana Bread',
          'Zucchini Pasta',
        ]);
      });

      it('should handle case-insensitive sorting', () => {
        const recipes: Recipe[] = [
          createTestRecipe({ id: 'recipe-1' as RecipeId, title: 'zebra' }),
          createTestRecipe({ id: 'recipe-2' as RecipeId, title: 'Apple' }),
          createTestRecipe({ id: 'recipe-3' as RecipeId, title: 'banana' }),
        ];

        const { result } = renderHook(() => useRecipeFilters(recipes, [], false, 'alphabetical'));

        expect(result.current.map((r) => r.title)).toEqual(['Apple', 'banana', 'zebra']);
      });
    });

    describe('favorites sort', () => {
      it('should sort favorites first, then non-favorites', () => {
        const recipes: Recipe[] = [
          createTestRecipe({
            id: 'recipe-1' as RecipeId,
            title: 'Normal Recipe',
            is_favorite: false,
          }),
          createTestRecipe({
            id: 'recipe-2' as RecipeId,
            title: 'Favorite Recipe 1',
            is_favorite: true,
          }),
          createTestRecipe({
            id: 'recipe-3' as RecipeId,
            title: 'Favorite Recipe 2',
            is_favorite: true,
          }),
          createTestRecipe({
            id: 'recipe-4' as RecipeId,
            title: 'Another Normal',
            is_favorite: false,
          }),
        ];

        const { result } = renderHook(() => useRecipeFilters(recipes, [], false, 'favorites'));

        const favorites = result.current.slice(0, 2);
        const nonFavorites = result.current.slice(2);

        expect(favorites.every((r) => r.is_favorite)).toBe(true);
        expect(nonFavorites.every((r) => !r.is_favorite)).toBe(true);
      });
    });

    describe('rating sort', () => {
      it('should sort by rolling_score descending (highest first)', () => {
        const recipes: Recipe[] = [
          createTestRecipe({
            id: 'recipe-1' as RecipeId,
            title: 'Low Rated',
            rolling_score: 3.5,
          }),
          createTestRecipe({
            id: 'recipe-2' as RecipeId,
            title: 'Top Rated',
            rolling_score: 5.0,
          }),
          createTestRecipe({
            id: 'recipe-3' as RecipeId,
            title: 'Mid Rated',
            rolling_score: 4.2,
          }),
        ];

        const { result } = renderHook(() => useRecipeFilters(recipes, [], false, 'rating'));

        expect(result.current.map((r) => r.title)).toEqual(['Top Rated', 'Mid Rated', 'Low Rated']);
      });

      it('should place recipes with null rolling_score at the end', () => {
        const recipes: Recipe[] = [
          createTestRecipe({
            id: 'recipe-1' as RecipeId,
            title: 'No Rating',
            rolling_score: null,
          }),
          createTestRecipe({
            id: 'recipe-2' as RecipeId,
            title: 'Rated Recipe',
            rolling_score: 4.5,
          }),
        ];

        const { result } = renderHook(() => useRecipeFilters(recipes, [], false, 'rating'));

        expect(result.current[0]?.title).toBe('Rated Recipe');
        expect(result.current[1]?.title).toBe('No Rating');
      });
    });
  });

  describe('combined filters and sort', () => {
    it('should apply filters first, then sort', () => {
      const recipes: Recipe[] = [
        createTestRecipe({
          id: 'recipe-1' as RecipeId,
          title: 'Zucchini Pasta',
          tags: ['pasta', 'vegetarian'],
          is_favorite: true,
        }),
        createTestRecipe({
          id: 'recipe-2' as RecipeId,
          title: 'Apple Pasta',
          tags: ['pasta', 'dessert'],
          is_favorite: false,
        }),
        createTestRecipe({
          id: 'recipe-3' as RecipeId,
          title: 'Banana Pasta',
          tags: ['pasta', 'vegetarian'],
          is_favorite: true,
        }),
        createTestRecipe({
          id: 'recipe-4' as RecipeId,
          title: 'Chicken Rice',
          tags: ['rice'],
          is_favorite: true,
        }),
      ];

      // Filter: pasta + vegetarian tags, favorites only, sort alphabetically
      const { result } = renderHook(() =>
        useRecipeFilters(recipes, ['pasta', 'vegetarian'], true, 'alphabetical'),
      );

      // Should only show recipe-1 and recipe-3 (both have pasta + vegetarian AND are favorites)
      // Sorted alphabetically: Banana Pasta, Zucchini Pasta
      expect(result.current).toHaveLength(2);
      expect(result.current.map((r) => r.title)).toEqual(['Banana Pasta', 'Zucchini Pasta']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty recipe array', () => {
      const { result } = renderHook(() => useRecipeFilters([], ['pasta'], false, 'last-cooked'));

      expect(result.current).toHaveLength(0);
    });

    it('should handle recipes with empty tags array', () => {
      const recipes: Recipe[] = [createTestRecipe({ id: 'recipe-1' as RecipeId, tags: [] })];

      const { result } = renderHook(() =>
        useRecipeFilters(recipes, ['pasta'], false, 'last-cooked'),
      );

      expect(result.current).toHaveLength(0);
    });
  });
});
