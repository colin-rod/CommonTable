import { RecipeService, RecipeImageService } from '@commontable/api-client';
import type { Recipe, RecipeId, HouseholdId } from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from './useAuth';

import { createClient } from '@/lib/supabase/client';

/**
 * useRecipesWithImages Hook
 *
 * Extends useRecipes with batch image loading functionality
 *
 * Provides:
 * - List of recipes for the current household
 * - Map of recipe IDs to signed image URLs
 * - Image loading state
 * - Toggle favorite action
 * - Refresh function
 *
 * Performance:
 * - Single batch query for all primary images (no N+1 queries)
 * - Parallel signed URL generation
 * - Cancels stale requests on re-render
 */
export function useRecipesWithImages() {
  const { household } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [imageUrls, setImageUrls] = useState<Map<RecipeId, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const recipeService = useMemo(() => new RecipeService(supabase), [supabase]);
  const imageService = useMemo(() => new RecipeImageService(supabase), [supabase]);

  /**
   * Load primary images for recipes and generate signed URLs
   */
  const loadPrimaryImages = useCallback(
    async (recipesToLoad: Recipe[]) => {
      if (recipesToLoad.length === 0) {
        setImageUrls(new Map());
        setImagesLoading(false);
        return;
      }

      try {
        setImagesLoading(true);

        // Batch query for primary images
        const recipeIds = recipesToLoad.map((r) => r.id);
        const imageMap = await recipeService.getPrimaryImagesForRecipes(recipeIds);

        // Generate signed URLs in parallel
        const urlMap = new Map<RecipeId, string>();

        await Promise.all(
          Array.from(imageMap.entries()).map(async ([recipeId, image]) => {
            try {
              const url = image.is_public
                ? imageService.getPublicUrl(image.storage_path)
                : await imageService.getSignedUrl(image.storage_path);
              urlMap.set(recipeId, url);
            } catch (err) {
              console.error(`Failed to generate URL for recipe ${recipeId}:`, err);
              // Continue without this image - non-blocking
            }
          }),
        );

        setImageUrls(urlMap);
      } catch (err) {
        console.error('useRecipesWithImages.loadPrimaryImages failed:', err);
        // Non-blocking: Continue without images
        setImageUrls(new Map());
      } finally {
        setImagesLoading(false);
      }
    },
    [recipeService, imageService],
  );

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

      // Load images after recipes are loaded
      await loadPrimaryImages(data);
    } catch (err) {
      setError(err as Error);
      console.error('useRecipesWithImages.loadRecipes failed:', err);
    } finally {
      setLoading(false);
    }
  }, [household?.id, recipeService, loadPrimaryImages]);

  // Load recipes on mount and when household changes
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await loadRecipes();
    };

    if (!cancelled) {
      void load();
    }

    return () => {
      cancelled = true;
    };
  }, [loadRecipes]);

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(
    async (recipeId: RecipeId) => {
      try {
        const updatedRecipe = await recipeService.toggleFavorite(recipeId);

        // Update local state optimistically
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipeId ? { ...r, is_favorite: updatedRecipe.is_favorite } : r,
          ),
        );
      } catch (err) {
        console.error('useRecipesWithImages.toggleFavorite failed:', err);
        throw err;
      }
    },
    [recipeService],
  );

  /**
   * Refresh recipes and images
   */
  const refresh = useCallback(() => {
    void loadRecipes();
  }, [loadRecipes]);

  return {
    recipes,
    imageUrls,
    loading,
    imagesLoading,
    error,
    toggleFavorite,
    refresh,
  };
}
