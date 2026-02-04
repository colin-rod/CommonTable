import { NotFoundError, type LaneType, type QueueStatus } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { BaseService } from './BaseService';

/**
 * Queue entry interface (database representation)
 */
export interface QueueEntry {
  readonly id: string;
  readonly household_id: string;
  readonly recipe_id: string;
  readonly added_by: string;
  readonly position: number;
  readonly status: QueueStatus;
  readonly notes: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;
}

/**
 * Queue entry with recipe data (for display)
 */
export interface QueueEntryWithRecipe extends QueueEntry {
  readonly recipe: {
    readonly id: string;
    readonly title: string;
    readonly meal_type: string | null;
    readonly cuisine: string | null;
    readonly cooking_method: string | null;
    readonly dietary_categories: readonly string[];
    readonly dish_category: string | null;
  };
}

/**
 * Service for managing recipe queue
 * Handles adding recipes to queue, reordering, and marking as cooked
 */
export class RecipeQueueService extends BaseService {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * List all queue entries
   *
   * @param filters - Optional filters (status)
   * @returns Array of queue entries sorted by position
   * @throws {AppError} If database query fails
   */
  async list(filters?: { status?: QueueStatus }): Promise<QueueEntry[]> {
    let query = this.supabase.from('recipe_queue').select('*');

    // Apply status filter if provided
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    // Sort by position (ascending)
    query = query.order('position', { ascending: true });

    const { data, error } = await query;

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeQueueService.list', { filters });
    }

    return BaseService.hydrateDatesArray(data || [], [
      'created_at',
      'updated_at',
    ]) as unknown as QueueEntry[];
  }

  /**
   * Add recipe to queue
   * Auto-assigns next available position
   *
   * @param recipeId - Recipe ID to add
   * @returns Created queue entry
   * @throws {ConflictError} If recipe already in queue
   * @throws {AppError} If database operation fails
   */
  async add(recipeId: string): Promise<QueueEntry> {
    // Get next position (count existing entries)
    const { count, error: countError } = await this.supabase
      .from('recipe_queue')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      BaseService.handleSupabaseError(countError, 'RecipeQueueService.add:count', { recipeId });
    }

    const nextPosition = count || 0;

    // Insert entry with auto-assigned position
    const { data, error } = await this.supabase
      .from('recipe_queue')
      .insert({
        recipe_id: recipeId,
        position: nextPosition,
        status: 'queued',
        // household_id and added_by are handled by RLS/triggers
      } as { recipe_id: string; household_id: string })
      .select()
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeQueueService.add', { recipeId });
    }

    return BaseService.hydrateDates(data, ['created_at', 'updated_at']) as unknown as QueueEntry;
  }

  /**
   * Remove entry from queue
   *
   * @param id - Queue entry ID
   * @throws {NotFoundError} If entry does not exist
   * @throws {AppError} If database operation fails
   */
  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('recipe_queue').delete().eq('id', id);

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeQueueService.remove', { id });
    }
  }

  /**
   * Reorder queue entry (drag-and-drop)
   *
   * @param id - Queue entry ID
   * @param newPosition - New position (0-indexed)
   * @throws {ValidationError} If position is negative
   * @throws {NotFoundError} If entry does not exist
   * @throws {AppError} If database operation fails
   */
  async reorder(id: string, newPosition: number): Promise<void> {
    const { error } = await this.supabase
      .from('recipe_queue')
      .update({ position: newPosition })
      .eq('id', id);

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeQueueService.reorder', { id, newPosition });
    }
  }

  /**
   * Mark queue entry as cooked
   * Creates cooking event and removes from queue
   *
   * @param id - Queue entry ID
   * @param input - Optional rating, servings, notes
   * @throws {NotFoundError} If entry or recipe does not exist
   * @throws {AppError} If database operation fails
   */
  async markAsCooked(
    id: string,
    input?: { rating?: number; servings_made?: number; notes?: string },
  ): Promise<void> {
    // Get queue entry
    const { data: entry, error: entryError } = await this.supabase
      .from('recipe_queue')
      .select('*')
      .eq('id', id)
      .single();

    if (entryError) {
      BaseService.handleSupabaseError(entryError, 'RecipeQueueService.markAsCooked:getEntry', {
        id,
      });
    }
    if (!entry) throw new NotFoundError('QueueEntry', id);

    // Get recipe details (need current_version_id)
    const { data: recipe, error: recipeError } = await this.supabase
      .from('recipes')
      .select('id, current_version_id, household_id')
      .eq('id', entry.recipe_id)
      .single();

    if (recipeError) {
      BaseService.handleSupabaseError(recipeError, 'RecipeQueueService.markAsCooked:getRecipe', {
        recipe_id: entry.recipe_id,
      });
    }
    if (!recipe) throw new NotFoundError('Recipe', entry.recipe_id);

    // Create cooking event
    const { error: eventError } = await this.supabase
      .from('cooking_events')
      .insert({
        recipe_id: recipe.id,
        recipe_version_id: recipe.current_version_id,
        household_id: recipe.household_id,
        cooked_at: new Date().toISOString(),
        rating: input?.rating || null,
        servings_made: input?.servings_made || null,
        notes: input?.notes || null,
        // cooked_by is handled by triggers
      } as { recipe_id: string; household_id: string })
      .select()
      .single();

    if (eventError) {
      BaseService.handleSupabaseError(eventError, 'RecipeQueueService.markAsCooked:createEvent', {
        recipe_id: recipe.id,
      });
    }

    // Remove from queue
    await this.remove(id);
  }

  /**
   * Get queue entries grouped by lane type
   * Groups recipes based on metadata (meal_type, cuisine, etc.)
   *
   * @param laneType - Type of lane organization
   * @returns Object with lane keys and arrays of queue entries
   * @throws {AppError} If database query fails
   */
  async getByLaneType(laneType: LaneType): Promise<Record<string, QueueEntry[]>> {
    // Get all queued entries
    const entries = await this.list({ status: 'queued' });

    // Group by metadata field
    const lanes: Record<string, QueueEntry[]> = {};

    for (const entry of entries) {
      // Fetch recipe metadata
      const { data: recipe, error } = await this.supabase
        .from('recipes')
        .select('id, title, meal_type, cuisine, cooking_method, dietary_categories, dish_category')
        .eq('id', entry.recipe_id)
        .single();

      if (error) {
        BaseService.handleSupabaseError(error, 'RecipeQueueService.getByLaneType:getRecipe', {
          recipe_id: entry.recipe_id,
        });
      }
      if (!recipe) continue; // Skip if recipe not found

      // Determine lane key based on type
      let laneKey: string;
      switch (laneType) {
        case 'meal_type':
          laneKey = recipe.meal_type || 'uncategorized';
          break;
        case 'cuisine':
          laneKey = recipe.cuisine || 'uncategorized';
          break;
        case 'cooking_method':
          laneKey = recipe.cooking_method || 'uncategorized';
          break;
        case 'dietary':
          laneKey = recipe.dietary_categories?.[0] || 'uncategorized';
          break;
        case 'dish_category':
          laneKey = recipe.dish_category || 'uncategorized';
          break;
        default:
          laneKey = 'uncategorized';
      }

      // Add to lane
      if (!lanes[laneKey]) lanes[laneKey] = [];
      const lane = lanes[laneKey];
      if (lane) lane.push(entry);
    }

    return lanes;
  }
}
