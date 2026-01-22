'use server';

import { CalendarService } from '@commontable/api-client';
import type {
  CalendarEntry,
  CalendarEntryId,
  CreateCalendarEntryInput,
  UpdateCalendarEntryInput,
} from '@commontable/api-client';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

/**
 * Action result type for server actions
 */
export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Format error for client consumption
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Create a new calendar entry
 *
 * @param input - Calendar entry data
 * @returns ActionResult with created entry or error
 */
export async function createCalendarEntry(
  input: CreateCalendarEntryInput,
): Promise<ActionResult<CalendarEntry>> {
  try {
    const supabase = await createClient();
    const service = new CalendarService(supabase);

    const entry = await service.create(input);

    // Revalidate calendar page
    revalidatePath('/calendar');

    return { success: true, data: entry };
  } catch (error) {
    console.error('createCalendarEntry failed:', error);
    return { success: false, error: formatError(error) };
  }
}

/**
 * Update an existing calendar entry
 *
 * @param id - Calendar entry ID
 * @param input - Updated calendar entry data
 * @returns ActionResult with updated entry or error
 */
export async function updateCalendarEntry(
  id: CalendarEntryId,
  input: UpdateCalendarEntryInput,
): Promise<ActionResult<CalendarEntry>> {
  try {
    const supabase = await createClient();
    const service = new CalendarService(supabase);

    const entry = await service.update(id, input);

    // Revalidate calendar page and entry detail if it exists
    revalidatePath('/calendar');
    revalidatePath(`/calendar/${id}`);

    return { success: true, data: entry };
  } catch (error) {
    console.error('updateCalendarEntry failed:', error);
    return { success: false, error: formatError(error) };
  }
}

/**
 * Delete a calendar entry
 *
 * @param id - Calendar entry ID
 * @returns ActionResult with void or error
 */
export async function deleteCalendarEntry(id: CalendarEntryId): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const service = new CalendarService(supabase);

    await service.delete(id);

    // Revalidate calendar page
    revalidatePath('/calendar');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('deleteCalendarEntry failed:', error);
    return { success: false, error: formatError(error) };
  }
}

/**
 * Mark a calendar entry as completed
 *
 * @param id - Calendar entry ID
 * @returns ActionResult with updated entry or error
 */
export async function markCalendarEntryCompleted(
  id: CalendarEntryId,
): Promise<ActionResult<CalendarEntry>> {
  try {
    const supabase = await createClient();
    const service = new CalendarService(supabase);

    const entry = await service.updateStatus(id, 'completed');

    // Revalidate calendar page
    revalidatePath('/calendar');

    return { success: true, data: entry };
  } catch (error) {
    console.error('markCalendarEntryCompleted failed:', error);
    return { success: false, error: formatError(error) };
  }
}
