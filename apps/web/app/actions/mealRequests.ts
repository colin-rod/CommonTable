'use server';

import { MealRequestService, type CreateMealRequestInput } from '@commontable/api-client';
import type {
  MealRequest,
  MealRequestId,
  MealRequestStatus,
  CalendarEntry,
} from '@commontable/types';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { formatError, type ActionResult } from '@/lib/utils/server-actions';

/**
 * Create a new meal request
 *
 * @param input - Meal request data (recipe_id OR notes required)
 * @returns ActionResult with created meal request or error
 */
export async function createMealRequest(
  input: CreateMealRequestInput,
): Promise<ActionResult<MealRequest>> {
  try {
    const supabase = await createClient();
    const service = new MealRequestService(supabase);

    const request = await service.create(input);

    revalidatePath('/requests');

    return { success: true, data: request };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Update meal request status
 *
 * @param id - Meal request ID
 * @param status - New status (open, planned, dismissed)
 * @returns ActionResult with updated meal request or error
 */
export async function updateMealRequestStatus(
  id: MealRequestId,
  status: MealRequestStatus,
): Promise<ActionResult<MealRequest>> {
  try {
    const supabase = await createClient();
    const service = new MealRequestService(supabase);

    const request = await service.updateStatus(id, status);

    revalidatePath('/requests');

    return { success: true, data: request };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Update meal request priority
 *
 * @param id - Meal request ID
 * @param priority - New priority value
 * @returns ActionResult with updated meal request or error
 */
export async function updateMealRequestPriority(
  id: MealRequestId,
  priority: number,
): Promise<ActionResult<MealRequest>> {
  try {
    const supabase = await createClient();
    const service = new MealRequestService(supabase);

    const request = await service.updatePriority(id, priority);

    revalidatePath('/requests');

    return { success: true, data: request };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Add meal request to calendar
 * Creates a calendar entry and updates request status to 'planned'
 *
 * @param id - Meal request ID
 * @returns ActionResult with request and calendar entry, or error
 */
export async function addMealRequestToCalendar(
  id: MealRequestId,
): Promise<ActionResult<{ request: MealRequest; calendarEntry: CalendarEntry }>> {
  try {
    const supabase = await createClient();
    const service = new MealRequestService(supabase);

    const result = await service.addToCalendar(id);

    revalidatePath('/requests');
    revalidatePath('/calendar');

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Delete a meal request
 *
 * @param id - Meal request ID
 * @returns ActionResult with void or error
 */
export async function deleteMealRequest(id: MealRequestId): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('meal_requests').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/requests');

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}
