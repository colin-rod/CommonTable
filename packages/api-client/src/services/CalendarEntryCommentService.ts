import {
  type CalendarEntryCommentId,
  type CalendarEntryId,
  type HouseholdId,
  type UserId,
  type CalendarEntryComment,
  type CreateCalendarEntryCommentInput,
  type Database,
  CreateCalendarEntryCommentSchema,
  NotFoundError,
  AppError,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { BaseService } from './BaseService';

/**
 * CalendarEntryCommentService - Manages calendar entry comments (append-only)
 *
 * Provides methods for:
 * - Creating comments on planned meals
 * - Reading comments for a calendar entry
 * - Reading a single comment by ID
 *
 * Note: Comments are immutable (append-only) - no update/delete methods
 */
export class CalendarEntryCommentService extends BaseService {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase);
  }

  /**
   * Get all comments for a calendar entry in chronological order (oldest first)
   *
   * @param calendarEntryId - Calendar entry ID
   * @returns Array of comments (empty array if none exist)
   * @throws {AppError} If database operation fails
   */
  async getByCalendarEntryId(calendarEntryId: CalendarEntryId): Promise<CalendarEntryComment[]> {
    // order() returns a PromiseLike, must await it
    const query = this.supabase
      .from('calendar_entry_comments')
      .select('*')
      .eq('calendar_entry_id', calendarEntryId)
      .order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      BaseService.handleSupabaseError(error, 'CalendarEntryCommentService.getByCalendarEntryId', {
        calendarEntryId,
      });
    }

    return (data ?? []) as unknown as CalendarEntryComment[];
  }

  /**
   * Create a new comment on a calendar entry
   *
   * Steps:
   * 1. Validate input with Zod
   * 2. Get current user ID
   * 3. Verify calendar entry exists and get household ID
   * 4. Insert comment with denormalized household_id
   * 5. Return created comment
   *
   * @param input - Comment creation input
   * @returns Created comment
   * @throws {ValidationError} If input validation fails
   * @throws {NotFoundError} If calendar entry does not exist
   * @throws {AppError} If user not authenticated or database operation fails
   */
  async create(input: CreateCalendarEntryCommentInput): Promise<CalendarEntryComment> {
    // 1. Validate input
    const validated = BaseService.validateInput(
      CreateCalendarEntryCommentSchema,
      input,
      'Invalid comment data',
    );

    // 2. Get current user
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError) {
      BaseService.handleSupabaseError(authError, 'CalendarEntryCommentService.create.auth');
    }
    if (!user) {
      throw new AppError('User not authenticated', 'UNAUTHORIZED', 401);
    }

    const userId = user.id as UserId;

    // 3. Verify calendar entry exists and get household_id
    const { data: calendarEntry, error: entryError } = await this.supabase
      .from('calendar_entries')
      .select('household_id')
      .eq('id', validated.calendar_entry_id)
      .single();

    if (entryError) {
      BaseService.handleSupabaseError(entryError, 'CalendarEntryCommentService.create.fetchEntry', {
        calendar_entry_id: validated.calendar_entry_id,
      });
    }
    if (!calendarEntry) {
      throw new NotFoundError('Calendar entry', validated.calendar_entry_id);
    }

    const householdId = calendarEntry.household_id as HouseholdId;

    // 4. Insert comment (denormalize household_id for RLS efficiency)
    const { data: comment, error: insertError } = await this.supabase
      .from('calendar_entry_comments')
      .insert({
        calendar_entry_id: validated.calendar_entry_id,
        household_id: householdId,
        comment_text: validated.comment_text,
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      BaseService.handleSupabaseError(insertError, 'CalendarEntryCommentService.create.insert');
    }
    if (!comment) {
      throw new AppError('Failed to create comment - no data returned', 'CREATE_ERROR');
    }

    // 5. Return created comment
    return comment as unknown as CalendarEntryComment;
  }

  /**
   * Get a single comment by ID
   *
   * @param id - Comment ID
   * @returns Comment
   * @throws {NotFoundError} If comment does not exist
   * @throws {AppError} If database operation fails
   */
  async getById(id: CalendarEntryCommentId): Promise<CalendarEntryComment> {
    const { data, error } = await this.supabase
      .from('calendar_entry_comments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'CalendarEntryCommentService.getById', { id });
    }
    if (!data) throw new NotFoundError('Comment', id);

    return data as unknown as CalendarEntryComment;
  }
}
