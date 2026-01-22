'use server';

import {
  CalendarEntryCommentService,
  type CreateCalendarEntryCommentInput,
} from '@commontable/api-client';
import type { CalendarEntryComment, CalendarEntryId } from '@commontable/types';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { formatError, type ActionResult } from '@/lib/utils/server-actions';

/**
 * Create a new calendar entry comment
 *
 * @param input - Comment data (calendar_entry_id and comment_text)
 * @returns ActionResult with created comment or error
 */
export async function createCalendarEntryComment(
  input: CreateCalendarEntryCommentInput,
): Promise<ActionResult<CalendarEntryComment>> {
  try {
    const supabase = await createClient();
    const service = new CalendarEntryCommentService(supabase);

    const comment = await service.create(input);

    // Revalidate calendar entry detail page
    revalidatePath(`/calendar/entries/${input.calendar_entry_id}`);
    // Also revalidate calendar overview in case comments count is shown
    revalidatePath('/calendar');

    return { success: true, data: comment };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get comments for a calendar entry
 *
 * @param calendarEntryId - Calendar entry ID
 * @returns ActionResult with comment list or error
 */
export async function getCalendarEntryComments(
  calendarEntryId: CalendarEntryId,
): Promise<ActionResult<CalendarEntryComment[]>> {
  try {
    const supabase = await createClient();
    const service = new CalendarEntryCommentService(supabase);

    const comments = await service.getByCalendarEntryId(calendarEntryId);

    return { success: true, data: comments };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}
