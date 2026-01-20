import type { Recipe, SortOption } from '@commontable/types';
import { useMemo } from 'react';

/**
 * Custom hook to filter and sort recipes client-side
 *
 * @param recipes - Array of recipes to filter and sort
 * @param selectedTags - Tags to filter by (AND logic: recipes must have ALL selected tags)
 * @param showFavoritesOnly - If true, only show favorite recipes
 * @param sortBy - Sort option to apply
 * @returns Filtered and sorted array of recipes
 */
export function useRecipeFilters(
  recipes: Recipe[],
  selectedTags: string[],
  showFavoritesOnly: boolean,
  sortBy: SortOption,
): Recipe[] {
  return useMemo(() => {
    let filtered = [...recipes];

    // Apply tag filter (AND logic)
    if (selectedTags.length > 0) {
      filtered = filtered.filter((recipe) =>
        selectedTags.every((tag) => recipe.tags.includes(tag)),
      );
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((recipe) => recipe.is_favorite);
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'last-cooked':
          // Nulls last
          if (!a.last_cooked_at) return 1;
          if (!b.last_cooked_at) return -1;
          return new Date(b.last_cooked_at).getTime() - new Date(a.last_cooked_at).getTime();
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'favorites':
          if (a.is_favorite && !b.is_favorite) return -1;
          if (!a.is_favorite && b.is_favorite) return 1;
          return 0;
        case 'rating':
          return (b.rolling_score || 0) - (a.rolling_score || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [recipes, selectedTags, showFavoritesOnly, sortBy]);
}
