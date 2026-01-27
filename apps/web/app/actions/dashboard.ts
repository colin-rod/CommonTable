'use server';

import type {
  CalendarEntry,
  CalendarEntryId,
  HouseholdId,
  RecipeId,
  UserId,
} from '@commontable/types';

import { createClient } from '@/lib/supabase/server';
import { formatError, type ActionResult } from '@/lib/utils/server-actions';

/**
 * Extended CalendarEntry type with recipe title
 */
export interface CalendarEntryWithRecipe extends CalendarEntry {
  recipe_title: string | null;
}

/**
 * Get upcoming calendar entries for the next 7 days with recipe titles
 *
 * @returns ActionResult with calendar entries or error
 */
export async function getUpcomingCalendarEntries(): Promise<
  ActionResult<CalendarEntryWithRecipe[]>
> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's household ID
    const { data: householdMember } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single();

    if (!householdMember) {
      throw new Error('User not in a household');
    }

    // Calculate date range: today to +7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Fetch calendar entries with recipe titles
    const { data, error } = await supabase
      .from('calendar_entries')
      .select('*, recipes(title)')
      .gte('planned_date', today.toISOString())
      .lte('planned_date', sevenDaysFromNow.toISOString())
      .neq('status', 'cancelled')
      .order('planned_date', { ascending: true })
      .order('meal_slot', { ascending: true });

    if (error) throw error;

    // Map response to flatten recipe_title field
    const entries: CalendarEntryWithRecipe[] = (data || []).map((entry) => ({
      id: entry.id as CalendarEntryId,
      household_id: entry.household_id as HouseholdId,
      recipe_id: entry.recipe_id as RecipeId | null,
      planned_date: new Date(entry.planned_date),
      meal_slot: entry.meal_slot,
      status: entry.status,
      notes: entry.notes,
      created_by: entry.created_by as UserId,
      created_at: new Date(entry.created_at),
      updated_at: new Date(entry.updated_at),
      recipe_title: entry.recipes?.title || null,
    }));

    return { success: true, data: entries };
  } catch (error) {
    console.error('getUpcomingCalendarEntries failed:', error);
    return { success: false, error: formatError(error) };
  }
}
