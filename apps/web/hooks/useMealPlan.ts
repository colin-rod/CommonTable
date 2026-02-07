import type { LaneType } from '@commontable/types';
import { useCallback } from 'react';

import { useRecipeQueue } from './useRecipeQueue';

/**
 * useMealPlan - A wrapper around useRecipeQueue with meal-plan-friendly terminology.
 *
 * This hook provides the same functionality as useRecipeQueue but with naming
 * that aligns with the "Meal Plan" feature instead of "Queue".
 *
 * @param laneType - Optional lane type for grouping entries (meal_type, cuisine, etc.)
 */
export function useMealPlan(laneType?: LaneType) {
  const queue = useRecipeQueue(laneType);

  /**
   * Check if a recipe is already in the meal plan
   */
  const hasRecipe = useCallback(
    (recipeId: string): boolean => {
      return queue.entries.some((entry) => entry.recipe_id === recipeId);
    },
    [queue.entries],
  );

  return {
    // State
    entries: queue.entries,
    lanes: queue.lanes,
    loading: queue.loading,
    error: queue.error,
    count: queue.entries.length,

    // Actions with meal-plan terminology
    addToMealPlan: queue.addToQueue,
    removeFromMealPlan: queue.remove,
    reorder: queue.reorder,
    markAsCooked: queue.markAsCooked,
    refresh: queue.refresh,

    // Utility
    hasRecipe,
  };
}
