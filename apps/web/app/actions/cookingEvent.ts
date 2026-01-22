'use server';

import {
  CookingEventService,
  type CreateCookingEventInput,
  type UpdateCookingEventInput,
} from '@commontable/api-client';
import type { CookingEvent, CookingEventId, RecipeId, HouseholdId } from '@commontable/types';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { formatError, type ActionResult } from '@/lib/utils/server-actions';

/**
 * Create a new cooking event (log a meal)
 *
 * @param input - Cooking event data
 * @returns ActionResult with created cooking event or error
 */
export async function createCookingEvent(
  input: CreateCookingEventInput,
): Promise<ActionResult<CookingEvent>> {
  try {
    const supabase = await createClient();
    const service = new CookingEventService(supabase);

    const cookingEvent = await service.create(input);

    // Revalidate recipe detail page (rolling_score and last_cooked_at updated)
    revalidatePath(`/recipes/${input.recipe_id}`);
    // Revalidate recipes list page (sorting by rating/last-cooked affected)
    revalidatePath('/recipes');
    // Revalidate calendar page (if created from calendar entry)
    if (input.calendar_entry_id) {
      revalidatePath('/calendar');
    }

    return { success: true, data: cookingEvent };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Update a cooking event (edit rating/notes)
 *
 * @param id - Cooking event ID
 * @param input - Update data
 * @returns ActionResult with updated cooking event or error
 */
export async function updateCookingEvent(
  id: CookingEventId,
  input: UpdateCookingEventInput,
): Promise<ActionResult<CookingEvent>> {
  try {
    const supabase = await createClient();
    const service = new CookingEventService(supabase);

    const cookingEvent = await service.update(id, input);

    // Revalidate recipe detail page (rolling_score may have changed)
    revalidatePath(`/recipes/${cookingEvent.recipe_id}`);
    revalidatePath('/recipes');

    return { success: true, data: cookingEvent };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Delete a cooking event
 *
 * @param id - Cooking event ID
 * @returns ActionResult with success or error
 */
export async function deleteCookingEvent(id: CookingEventId): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const service = new CookingEventService(supabase);

    // Get cooking event first to know which recipe to revalidate
    const existingEvent = await service.getById(id);

    await service.delete(id);

    // Revalidate recipe pages
    revalidatePath(`/recipes/${existingEvent.recipe_id}`);
    revalidatePath('/recipes');

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get cooking events for a recipe (cooking history)
 *
 * @param recipeId - Recipe ID
 * @returns ActionResult with cooking events or error
 */
export async function getCookingEventsByRecipe(
  recipeId: RecipeId,
): Promise<ActionResult<CookingEvent[]>> {
  try {
    const supabase = await createClient();
    const service = new CookingEventService(supabase);

    const events = await service.getByRecipeId(recipeId);

    return { success: true, data: events };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get cooking events for the current user's household
 *
 * @param limit - Maximum results
 * @param offset - Pagination offset
 * @returns ActionResult with cooking events or error
 */
export async function getCookingEventsByHousehold(
  limit: number = 50,
  offset: number = 0,
): Promise<ActionResult<CookingEvent[]>> {
  try {
    const supabase = await createClient();
    const service = new CookingEventService(supabase);

    // Get current user's household ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: householdMember } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single();

    if (!householdMember) {
      throw new Error('User not in a household');
    }

    const events = await service.getByHouseholdId(
      householdMember.household_id as HouseholdId,
      limit,
      offset,
    );

    return { success: true, data: events };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}
