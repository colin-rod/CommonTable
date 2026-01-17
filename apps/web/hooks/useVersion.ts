import { RecipeService } from '@commontable/api-client';
import type { RecipeId, RecipeVersion } from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { createClient } from '@/lib/supabase/client';

/**
 * useVersion Hook
 *
 * Fetches a specific version of a recipe
 *
 * Provides:
 * - Version data (ingredients, steps, metadata)
 * - Loading and error states
 */
export function useVersion(recipeId: RecipeId | null, versionNumber: number) {
  const [version, setVersion] = useState<RecipeVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const recipeService = useMemo(() => new RecipeService(supabase), [supabase]);

  /**
   * Load the specific version
   */
  const loadVersion = useCallback(async () => {
    if (!recipeId || versionNumber <= 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const versionData = await recipeService.getVersion(recipeId, versionNumber);
      setVersion(versionData);
    } catch (err) {
      setError(err as Error);
      setVersion(null);
      console.error('useVersion.loadVersion failed:', err);
    } finally {
      setLoading(false);
    }
  }, [recipeId, versionNumber, recipeService]);

  // Load version on mount and when parameters change
  useEffect(() => {
    void loadVersion();
  }, [loadVersion]);

  return {
    version,
    loading,
    error,
  };
}
