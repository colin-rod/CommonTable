import { z } from 'zod';

// =============================================================================
// Calendar Entry Comment Schemas
// =============================================================================

/**
 * Create calendar entry comment input schema
 * Used when creating a new comment on a planned meal
 */
export const CreateCalendarEntryCommentSchema = z.object({
  calendar_entry_id: z.string().uuid('Invalid calendar entry ID'),
  comment_text: z.string().trim().min(1, 'Comment cannot be empty'),
});

export type CreateCalendarEntryCommentInput = z.infer<typeof CreateCalendarEntryCommentSchema>;

/**
 * Calendar entry comment ID schema
 */
export const CalendarEntryCommentIdSchema = z.string().uuid('Invalid comment ID');
