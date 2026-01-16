import { RecipeService } from '@commontable/api-client';
import type { RecipeWithVersion, RecipeImage, RecipeId } from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { createClient } from '@/lib/supabase/client';

/**
 * useRecipe Hook
 *
 * Manages single recipe operations and state
 *
 * Provides:
 * - Recipe with current version data
 * - Primary image (cover photo)
 * - Toggle favorite action
 * - Loading and error states
 * - Refresh function
 */
export function useRecipe(recipeId: RecipeId | null) {
  const [recipe, setRecipe] = useState<RecipeWithVersion | null>(null);
  const [primaryImage, setPrimaryImage] = useState<RecipeImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const recipeService = useMemo(() => new RecipeService(supabase), [supabase]);

  /**
   * Load recipe with version and primary image
   */
  const loadRecipe = useCallback(async () => {
    if (!recipeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [recipeData, imageData] = await Promise.all([
        recipeService.getWithVersion(recipeId),
        recipeService.getPrimaryImage(recipeId),
      ]);

      setRecipe(recipeData);
      setPrimaryImage(imageData);
    } catch (err) {
      setError(err as Error);
      console.error('useRecipe.loadRecipe failed:', err);
    } finally {
      setLoading(false);
    }
  }, [recipeId, recipeService]);

  // Load recipe on mount and when recipeId changes
  useEffect(() => {
    void loadRecipe();
  }, [loadRecipe]);

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(async () => {
    if (!recipeId || !recipe) return;

    try {
      const updatedRecipe = await recipeService.toggleFavorite(recipeId);

      // Update local state with new favorite status
      setRecipe((prev) => (prev ? { ...prev, is_favorite: updatedRecipe.is_favorite } : null));
    } catch (err) {
      console.error('useRecipe.toggleFavorite failed:', err);
      throw err;
    }
  }, [recipeId, recipe, recipeService]);

  /**
   * Refresh recipe data
   */
  const refresh = useCallback(() => {
    void loadRecipe();
  }, [loadRecipe]);

  return {
    recipe,
    primaryImage,
    loading,
    error,
    toggleFavorite,
    refresh,
  };
}
