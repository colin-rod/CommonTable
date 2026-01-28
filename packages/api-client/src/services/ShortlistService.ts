import { type RecipeId, type UserId, type Database, AppError } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { BaseService } from './BaseService';

/**
 * ShortlistService - Manages household recipe shortlist operations
 *
 * Provides methods for:
 * - Adding recipes to household shortlist
 * - Removing recipes from shortlist
 * - Retrieving all shortlisted recipes with user attribution
 * - Clearing entire household shortlist
 */
export class ShortlistService extends BaseService {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase);
  }

  /**
   * Add recipe to household shortlist
   * Idempotent: No error if recipe already exists in shortlist
   *
   * @param recipeId - Recipe ID to add
   * @param userId - User ID who is adding the recipe
   * @returns Promise that resolves when recipe is added
   * @throws {AppError} If database operation fails (excluding duplicate key errors)
   */
  async add(recipeId: RecipeId, userId: UserId): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('recipe_shortlists')
        .insert({
          recipe_id: recipeId,
          added_by_user_id: userId,
        })
        .single();

      // Ignore duplicate key errors (idempotent behavior)
      if (error && error.code === '23505') {
        return;
      }

      if (error) throw error;
    } catch (error: unknown) {
      // Already handled duplicate key errors above
      if ((error as { code?: string })?.code === '23505') {
        return;
      }

      console.error('ShortlistService.add failed:', error);
      throw new AppError('Failed to add recipe to shortlist', 'INSERT_ERROR', 500, {
        recipeId,
        userId,
      });
    }
  }

  /**
   * Remove recipe from household shortlist
   * Idempotent: No error if recipe doesn't exist in shortlist
   *
   * @param recipeId - Recipe ID to remove
   * @returns Promise that resolves when recipe is removed
   * @throws {AppError} If database operation fails
   */
  async remove(recipeId: RecipeId): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('recipe_shortlists')
        .delete()
        .eq('recipe_id', recipeId);

      if (error) throw error;
    } catch (error: unknown) {
      console.error('ShortlistService.remove failed:', error);
      throw new AppError('Failed to remove recipe from shortlist', 'DELETE_ERROR', 500, {
        recipeId,
      });
    }
  }
}
