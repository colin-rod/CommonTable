import { RecipeService } from '@commontable/api-client';
import type { RecipeId, VersionHistoryEntry } from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { createClient } from '@/lib/supabase/client';

/**
 * useVersionHistory Hook
 *
 * Manages version history for a recipe
 *
 * Provides:
 * - Array of version history entries (newest first)
 * - Loading and error states
 * - Refresh function to reload data
 */
export function useVersionHistory(recipeId: RecipeId | null) {
  const [versions, setVersions] = useState<VersionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const recipeService = useMemo(() => new RecipeService(supabase), [supabase]);

  /**
   * Load version history for the recipe
   */
  const loadVersionHistory = useCallback(async () => {
    if (!recipeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const history = await recipeService.getVersionHistory(recipeId);
      setVersions(history as VersionHistoryEntry[]);
    } catch (err) {
      setError(err as Error);
      setVersions([]);
      console.error('useVersionHistory.loadVersionHistory failed:', err);
    } finally {
      setLoading(false);
    }
  }, [recipeId, recipeService]);

  // Load version history on mount and when recipeId changes
  useEffect(() => {
    void loadVersionHistory();
  }, [loadVersionHistory]);

  /**
   * Refresh version history
   */
  const refresh = useCallback(() => {
    void loadVersionHistory();
  }, [loadVersionHistory]);

  return {
    versions,
    loading,
    error,
    refresh,
  };
}
