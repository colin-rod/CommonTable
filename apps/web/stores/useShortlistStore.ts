import { ShortlistService } from '@commontable/api-client';
import type { RecipeId, UserId, HouseholdId, ShortlistItem } from '@commontable/types';
import { create } from 'zustand';

import { createClient } from '@/lib/supabase/client';

interface ShortlistState {
  items: ShortlistItem[];
  loading: boolean;
  error: string | null;
}

interface ShortlistActions {
  load: (householdId: HouseholdId) => Promise<void>;
  add: (recipeId: RecipeId, userId: UserId) => Promise<void>;
  remove: (recipeId: RecipeId) => Promise<void>;
  clear: () => void;
  getCount: () => number;
  hasRecipe: (recipeId: RecipeId) => boolean;
}

type ShortlistStore = ShortlistState & ShortlistActions;

export const useShortlistStore = create<ShortlistStore>((set, get) => ({
  // Initial state
  items: [],
  loading: false,
  error: null,

  // Load shortlist items from service
  load: async (householdId: HouseholdId) => {
    set({ loading: true, error: null });

    try {
      const supabase = createClient();
      const service = new ShortlistService(supabase);
      const items = await service.getAll(householdId);

      set({ items, loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load shortlist';
      set({ loading: false, error: errorMessage });
    }
  },

  // Add recipe to shortlist (optimistic update)
  add: async (recipeId: RecipeId, userId: UserId) => {
    const { items } = get();

    // Check if recipe already in shortlist (idempotent)
    if (items.some((item) => item.recipe.id === recipeId)) {
      return;
    }

    // Optimistic update: add placeholder item with minimal recipe data
    const placeholderItem: ShortlistItem = {
      id: `temp-${Date.now()}`,
      recipe: {
        id: recipeId,
        household_id: '' as HouseholdId,
        title: 'Loading...',
        description: null,
        current_version_id: null,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      addedBy: {
        id: userId,
        name: 'You',
      },
      addedAt: new Date(),
    };

    set({ items: [...items, placeholderItem], error: null });

    try {
      const supabase = createClient();
      const service = new ShortlistService(supabase);
      await service.add(recipeId, userId);

      // Success: keep the optimistic update
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add recipe';
      set({ error: errorMessage });

      // Rollback optimistic update on error
      set({ items: items.filter((item) => item.id !== placeholderItem.id) });
    }
  },

  // Remove recipe from shortlist (optimistic update)
  remove: async (recipeId: RecipeId) => {
    const { items } = get();
    const removedItem = items.find((item) => item.recipe.id === recipeId);

    if (!removedItem) {
      return; // Recipe not in shortlist
    }

    // Store original items for rollback
    const originalItems = items;

    // Optimistic update: remove immediately
    set({ items: items.filter((item) => item.recipe.id !== recipeId), error: null });

    try {
      const supabase = createClient();
      const service = new ShortlistService(supabase);
      await service.remove(recipeId);

      // Success: keep the optimistic update
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove recipe';
      set({ error: errorMessage });

      // Rollback optimistic update on error (restore original state)
      set({ items: originalItems });
    }
  },

  // Clear all items and reset state
  clear: () => {
    set({ items: [], loading: false, error: null });
  },

  // Get count of shortlisted recipes
  getCount: () => {
    return get().items.length;
  },

  // Check if recipe is in shortlist
  hasRecipe: (recipeId: RecipeId) => {
    return get().items.some((item) => item.recipe.id === recipeId);
  },
}));
