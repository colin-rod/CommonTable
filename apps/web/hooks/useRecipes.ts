import { RecipeService } from '@commontable/api-client';
import type { Recipe, RecipeId, HouseholdId } from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from './useAuth';

import { createClient } from '@/lib/supabase/client';

/**
 * useRecipes Hook
 *
 * Manages recipe list operations and state for a household
 *
 * Provides:
 * - List of recipes for the current household
 * - Toggle favorite action
 * - Loading and error states
 * - Refresh function
 */
export function useRecipes() {
  const { household } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const recipeService = useMemo(() => new RecipeService(supabase), [supabase]);

  /**
   * Load recipes for the household
   */
  const loadRecipes = useCallback(async () => {
    if (!household?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await recipeService.getByHousehold(household.id as HouseholdId);
      setRecipes(data);
    } catch (err) {
      setError(err as Error);
      console.error('useRecipes.loadRecipes failed:', err);
    } finally {
      setLoading(false);
    }
  }, [household?.id, recipeService]);

  // Load recipes on mount and when household changes
  useEffect(() => {
    if (household?.id) {
      void loadRecipes();
    }
  }, [household?.id, loadRecipes]);

  /**
   * Toggle favorite status of a recipe
   */
  const toggleFavorite = useCallback(
    async (recipeId: RecipeId) => {
      try {
        const updatedRecipe = await recipeService.toggleFavorite(recipeId);

        // Update local state optimistically
        setRecipes((prev) => prev.map((r) => (r.id === recipeId ? updatedRecipe : r)));
      } catch (err) {
        console.error('useRecipes.toggleFavorite failed:', err);
        throw err;
      }
    },
    [recipeService],
  );

  /**
   * Refresh recipes
   */
  const refresh = useCallback(() => {
    void loadRecipes();
  }, [loadRecipes]);

  return {
    recipes,
    loading,
    error,
    toggleFavorite,
    refresh,
  };
}
