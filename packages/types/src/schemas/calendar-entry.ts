import { z } from 'zod';

import { MealSlotSchema } from './calendar';

// =============================================================================
// Calendar Entry Schemas
// =============================================================================

/**
 * Input schema for creating a calendar entry
 *
 * Used when scheduling a meal on a specific date and meal slot.
 * Either a recipe can be assigned (recipe_id), or the slot can be left open for planning.
 *
 * @example
 * ```typescript
 * const input: CreateCalendarEntryInput = {
 *   recipe_id: 'abc-123',
 *   planned_date: new Date('2024-03-15'),
 *   meal_slot: 'dinner',
 *   notes: 'Try the new pasta recipe'
 * };
 * ```
 */
export const CreateCalendarEntrySchema = z.object({
  recipe_id: z.string().nullable(),
  planned_date: z.date(),
  meal_slot: MealSlotSchema,
  notes: z.string().nullable().optional(),
});

export type CreateCalendarEntryInput = z.infer<typeof CreateCalendarEntrySchema>;

/**
 * Input schema for updating a calendar entry
 *
 * Used to modify an existing calendar entry's recipe, date, meal slot, or notes.
 * All fields are optional - only provide the fields you want to update.
 *
 * @example
 * ```typescript
 * const input: UpdateCalendarEntryInput = {
 *   recipe_id: 'xyz-456', // Change to different recipe
 *   notes: 'Updated notes'
 * };
 * ```
 */
export const UpdateCalendarEntrySchema = z.object({
  recipe_id: z.string().nullable().optional(),
  planned_date: z.date().optional(),
  meal_slot: MealSlotSchema.optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateCalendarEntryInput = z.infer<typeof UpdateCalendarEntrySchema>;
