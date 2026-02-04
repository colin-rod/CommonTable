import {
  type RecipeId,
  type HouseholdId,
  type UserId,
  type ShortlistItem,
  type Recipe,
  type Database,
  AppError,
} from '@commontable/types';
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
      const householdId = await this.getCurrentHouseholdId();

      const { error } = await this.supabase
        .from('recipe_shortlists')
        .insert({
          recipe_id: recipeId,
          household_id: householdId,
          added_by_user_id: userId,
        })
        .single();

      // Ignore duplicate key errors (idempotent behavior)
      if (error && error.code === '23505') {
        return;
      }

      if (error) throw error;
    } catch (error: unknown) {
      // Re-throw AppError from getCurrentHouseholdId()
      if (error instanceof AppError) {
        throw error;
      }

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
   * Helper: Get current household ID from context
   * Uses Supabase RLS function to retrieve household_id for current user
   *
   * @returns Current user's household ID
   * @throws {AppError} If user is not authenticated or not part of a household
   */
  private async getCurrentHouseholdId(): Promise<HouseholdId> {
    const { data, error } = await this.supabase.rpc('get_user_household_id');

    if (error || !data) {
      throw new AppError('Failed to get current household ID', 'AUTH_ERROR', 401);
    }

    return data as HouseholdId;
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

  /**
   * Get all shortlisted recipes for household
   * Includes recipe details and user attribution with display names
   *
   * @param householdId - Household ID to get shortlist for
   * @returns Array of shortlisted recipes with user attribution
   * @throws {AppError} If database operation fails
   */
  async getAll(householdId: HouseholdId): Promise<ShortlistItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('recipe_shortlists')
        .select('*, recipes(*)')
        .eq('household_id', householdId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Extract unique user IDs for batch profile lookup
      const userIds = [...new Set(data.map((row) => row.added_by_user_id))];

      // Fetch profiles in single query
      const { data: profilesData } = await this.supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      // Build lookup map for O(1) access
      const profilesMap = new Map((profilesData ?? []).map((p) => [p.id, p.display_name]));

      // Transform database response to ShortlistItem format with user names
      return data.map((row) => ({
        id: row.id,
        recipe: row.recipes as unknown as Recipe,
        addedBy: {
          id: row.added_by_user_id as UserId,
          name: profilesMap.get(row.added_by_user_id) ?? 'Unknown member',
        },
        addedAt: new Date(row.added_at),
      }));
    } catch (error: unknown) {
      console.error('ShortlistService.getAll failed:', error);
      throw new AppError('Failed to get shortlisted recipes', 'FETCH_ERROR', 500, {
        householdId,
      });
    }
  }
}
