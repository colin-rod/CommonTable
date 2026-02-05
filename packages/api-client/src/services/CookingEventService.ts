import {
  type CookingEventId,
  type RecipeId,
  type HouseholdId,
  type UserId,
  type CookingEvent,
  type CookingEventWithRecipeAndProfile,
  type CreateCookingEventInput,
  type UpdateCookingEventInput,
  type Database,
  CreateCookingEventSchema,
  UpdateCookingEventSchema,
  NotFoundError,
  AppError,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { BaseService } from './BaseService';

/**
 * CookingEventService - Manages cooking event CRUD operations
 *
 * Provides methods for:
 * - Logging when a recipe was cooked (with optional rating)
 * - Reading cooking history for recipes/households
 * - Updating ratings/notes after cooking
 * - Deleting cooking events
 *
 * Note: Creating a cooking event triggers automatic updates:
 * - recipes.rolling_score (average rating) - via database trigger
 * - recipes.last_cooked_at (most recent cooking) - via database trigger
 * - recipes.status (set to 'cooked') - via service layer
 */
export class CookingEventService extends BaseService {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase);
  }

  /**
   * Create a new cooking event (log a meal)
   *
   * Steps:
   * 1. Validate input with Zod
   * 2. Get current user ID
   * 3. Fetch recipe to get household_id (denormalized for RLS efficiency)
   * 4. Insert cooking event
   * 5. Database triggers automatically update rolling_score and last_cooked_at
   * 6. Update recipe status to 'cooked' (auto-transition on cooking)
   * 7. If calendar_entry_id provided, update entry status to 'completed'
   * 8. Return created cooking event
   *
   * @param input - Cooking event creation input
   * @returns Created cooking event
   * @throws {ValidationError} If input validation fails
   * @throws {NotFoundError} If recipe does not exist
   * @throws {AppError} If user not authenticated or database operation fails
   */
  async create(input: CreateCookingEventInput): Promise<CookingEvent> {
    // 1. Validate input
    const validated = BaseService.validateInput(
      CreateCookingEventSchema,
      input,
      'Invalid cooking event data',
    );

    // 2. Get current user
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError) {
      BaseService.handleSupabaseError(authError, 'CookingEventService.create.auth');
    }
    if (!user) {
      throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
    }

    const userId = user.id as UserId;

    // 3. Fetch recipe to get household_id
    const { data: recipe, error: recipeError } = await this.supabase
      .from('recipes')
      .select('household_id')
      .eq('id', validated.recipe_id)
      .single();

    if (recipeError) {
      BaseService.handleSupabaseError(recipeError, 'CookingEventService.create.fetchRecipe', {
        recipe_id: validated.recipe_id,
      });
    }
    if (!recipe) {
      throw new NotFoundError('Recipe', validated.recipe_id);
    }

    const householdId = recipe.household_id as HouseholdId;

    // 4. Insert cooking event
    const { data: cookingEvent, error: insertError } = await this.supabase
      .from('cooking_events')
      .insert({
        recipe_id: validated.recipe_id,
        recipe_version_id: validated.recipe_version_id,
        household_id: householdId,
        cooked_at: validated.cooked_at?.toISOString() || new Date().toISOString(),
        servings_made: validated.servings_made ?? null,
        rating: validated.rating ?? null,
        notes: validated.notes ?? null,
        cooked_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      BaseService.handleSupabaseError(insertError, 'CookingEventService.create.insert');
    }
    if (!cookingEvent) {
      throw new AppError('Failed to create cooking event - no data returned', 'CREATE_ERROR');
    }

    // 6. Update recipe status to 'cooked' (auto-transition on cooking event)
    const { error: recipeStatusError } = await this.supabase
      .from('recipes')
      .update({ status: 'cooked' })
      .eq('id', validated.recipe_id);

    if (recipeStatusError) {
      console.error('Failed to update recipe status to cooked:', recipeStatusError);
      // Non-fatal: cooking event was created successfully
    }

    // 7. If calendar_entry_id provided, update status to 'completed'
    if (validated.calendar_entry_id) {
      const { error: updateError } = await this.supabase
        .from('calendar_entries')
        .update({ status: 'completed' })
        .eq('id', validated.calendar_entry_id);

      if (updateError) {
        console.error('Failed to update calendar entry status:', updateError);
        // Non-fatal: cooking event was created successfully
      }
    }

    // 8. Return created cooking event (convert date string to Date)
    return BaseService.hydrateDates(cookingEvent, ['cooked_at']) as unknown as CookingEvent;
  }

  /**
   * Get a cooking event by ID
   *
   * @param id - Cooking event ID
   * @returns Cooking event
   * @throws {NotFoundError} If cooking event does not exist
   * @throws {AppError} If database operation fails
   */
  async getById(id: CookingEventId): Promise<CookingEvent> {
    const { data, error } = await this.supabase
      .from('cooking_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'CookingEventService.getById', { id });
    }
    if (!data) throw new NotFoundError('CookingEvent', id);

    return BaseService.hydrateDates(data, ['cooked_at']) as unknown as CookingEvent;
  }

  /**
   * Get all cooking events for a recipe (cooking history)
   *
   * @param recipeId - Recipe ID
   * @returns Array of cooking events sorted by cooked_at DESC (newest first)
   * @throws {AppError} If database operation fails
   */
  async getByRecipeId(recipeId: RecipeId): Promise<CookingEvent[]> {
    const { data, error } = await this.supabase
      .from('cooking_events')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('cooked_at', { ascending: false });

    if (error) {
      BaseService.handleSupabaseError(error, 'CookingEventService.getByRecipeId', { recipeId });
    }

    return BaseService.hydrateDatesArray(data ?? [], ['cooked_at']) as unknown as CookingEvent[];
  }

  /**
   * Get all cooking events for a household (recent meal log)
   *
   * @param householdId - Household ID
   * @param limit - Maximum results (default 50)
   * @param offset - Pagination offset (default 0)
   * @returns Array of cooking events sorted by cooked_at DESC (newest first)
   * @throws {AppError} If database operation fails
   */
  async getByHouseholdId(
    householdId: HouseholdId,
    limit: number = 50,
    offset: number = 0,
  ): Promise<CookingEventWithRecipeAndProfile[]> {
    const { data, error } = await this.supabase
      .from('cooking_events')
      .select(
        `
        *,
        recipes!inner(title)
      `,
      )
      .eq('household_id', householdId)
      .order('cooked_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      BaseService.handleSupabaseError(error, 'CookingEventService.getByHouseholdId', {
        householdId,
      });
    }

    // Fetch profile information separately since there's no FK relationship
    const profileIds = [...new Set((data ?? []).map((e) => e.cooked_by))];
    const { data: profilesData } = await this.supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', profileIds);

    const profilesMap = new Map((profilesData ?? []).map((p) => [p.id, p.display_name]));

    return (data ?? []).map((event) => ({
      id: event.id,
      recipe_id: event.recipe_id,
      recipe_version_id: event.recipe_version_id,
      household_id: event.household_id,
      cooked_at: new Date(event.cooked_at),
      servings_made: event.servings_made,
      rating: event.rating,
      notes: event.notes,
      cooked_by: event.cooked_by,
      recipe_title: event.recipes?.title ?? 'Unknown recipe',
      cooked_by_name: profilesMap.get(event.cooked_by) ?? 'Unknown member',
    })) as unknown as CookingEventWithRecipeAndProfile[];
  }

  /**
   * Update a cooking event (edit rating/notes)
   *
   * Typically used to add a rating after cooking or update notes.
   * Updating rating triggers recalculation of recipes.rolling_score.
   *
   * @param id - Cooking event ID
   * @param input - Update input
   * @returns Updated cooking event
   * @throws {ValidationError} If input validation fails
   * @throws {NotFoundError} If cooking event does not exist
   * @throws {AppError} If database operation fails
   */
  async update(id: CookingEventId, input: UpdateCookingEventInput): Promise<CookingEvent> {
    const validated = BaseService.validateInput(
      UpdateCookingEventSchema,
      input,
      'Invalid cooking event update data',
    );

    // Check if cooking event exists first
    await this.getById(id);

    const updateData: Record<string, unknown> = {};
    if (validated.rating !== undefined) updateData.rating = validated.rating;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.servings_made !== undefined) updateData.servings_made = validated.servings_made;

    if (Object.keys(updateData).length === 0) {
      // No updates provided, return existing event
      return await this.getById(id);
    }

    const { data, error } = await this.supabase
      .from('cooking_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'CookingEventService.update', { id });
    }

    return BaseService.hydrateDates(data, ['cooked_at']) as unknown as CookingEvent;
  }

  /**
   * Delete a cooking event
   *
   * Note: Deleting a cooking event will trigger recalculation of recipes.rolling_score
   * via database trigger (or manual RPC call).
   *
   * @param id - Cooking event ID
   * @throws {NotFoundError} If cooking event does not exist
   * @throws {AppError} If database operation fails
   */
  async delete(id: CookingEventId): Promise<void> {
    // Check if cooking event exists first (throws NotFoundError if not found)
    await this.getById(id);

    const { error } = await this.supabase.from('cooking_events').delete().eq('id', id);

    if (error) {
      BaseService.handleSupabaseError(error, 'CookingEventService.delete', { id });
    }

    // Database triggers handle rolling_score and last_cooked_at automatically
    // No manual recalculation needed
  }

  /**
   * Get all cooking events for a household in a specific month
   * Used for historical calendar view showing past cooking events
   *
   * @param householdId - Household ID
   * @param year - Year (e.g., 2026)
   * @param month - Month (1-12, where 1 = January)
   * @returns Array of cooking events sorted by cooked_at ASC (oldest first)
   * @throws {AppError} If database operation fails
   */
  async getEventsForMonth(
    householdId: HouseholdId,
    year: number,
    month: number,
  ): Promise<CookingEvent[]> {
    // Calculate start and end of month in UTC
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 1));

    const { data, error } = await this.supabase
      .from('cooking_events')
      .select('*')
      .eq('household_id', householdId)
      .gte('cooked_at', startOfMonth.toISOString())
      .lt('cooked_at', endOfMonth.toISOString())
      .order('cooked_at', { ascending: true });

    if (error) {
      BaseService.handleSupabaseError(error, 'CookingEventService.getEventsForMonth', {
        householdId,
        year,
        month,
      });
    }

    return BaseService.hydrateDatesArray(data ?? [], ['cooked_at']) as unknown as CookingEvent[];
  }

  /**
   * Get all cooking events for a household on a specific date
   * Used for calendar day detail dialog showing all recipes cooked that day
   *
   * @param householdId - Household ID
   * @param date - Target date
   * @returns Array of cooking events sorted by cooked_at ASC (oldest first)
   * @throws {AppError} If database operation fails
   */
  async getEventsForDate(householdId: HouseholdId, date: Date): Promise<CookingEvent[]> {
    // Calculate start and end of day in UTC
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    const startOfDay = new Date(Date.UTC(year, month, day));
    const endOfDay = new Date(Date.UTC(year, month, day + 1));

    const { data, error } = await this.supabase
      .from('cooking_events')
      .select('*')
      .eq('household_id', householdId)
      .gte('cooked_at', startOfDay.toISOString())
      .lt('cooked_at', endOfDay.toISOString())
      .order('cooked_at', { ascending: true });

    if (error) {
      BaseService.handleSupabaseError(error, 'CookingEventService.getEventsForDate', {
        householdId,
        date,
      });
    }

    return BaseService.hydrateDatesArray(data ?? [], ['cooked_at']) as unknown as CookingEvent[];
  }
}
