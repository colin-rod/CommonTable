import { z } from 'zod';

import { MealSlotSchema } from './calendar';

// =============================================================================
// Meal Request Schemas
// =============================================================================

/**
 * Input schema for creating a meal request
 *
 * Used when a household member requests a specific meal to be planned.
 * Either a recipe_id OR notes must be provided (or both).
 *
 * @example
 * ```typescript
 * // Request with specific recipe
 * const input: CreateMealRequestInput = {
 *   recipe_id: 'abc-123',
 *   requested_date: new Date('2024-03-20'),
 *   requested_meal_slot: 'dinner',
 *   notes: 'Would love to have this again!'
 * };
 *
 * // Request without recipe (idea)
 * const input: CreateMealRequestInput = {
 *   recipe_id: null,
 *   requested_date: new Date('2024-03-20'),
 *   requested_meal_slot: 'lunch',
 *   notes: 'Something light and healthy'
 * };
 * ```
 */
export const CreateMealRequestSchema = z
  .object({
    recipe_id: z.string().uuid().nullable(),
    requested_date: z.date(),
    requested_meal_slot: MealSlotSchema,
    notes: z.union([z.string().min(1).max(500), z.null()]),
  })
  .refine((data) => data.recipe_id !== null || data.notes !== null, {
    message: 'Must provide either a recipe or notes',
  });

export type CreateMealRequestInput = z.infer<typeof CreateMealRequestSchema>;

/**
 * Input schema for updating meal request status
 *
 * Used to change the status of a meal request.
 * Status flow: open → planned (when added to calendar) or dismissed
 *
 * @example
 * ```typescript
 * const input: UpdateMealRequestStatusInput = {
 *   status: 'planned'
 * };
 * ```
 */
export const UpdateStatusSchema = z.object({
  status: z.enum(['open', 'planned', 'dismissed']),
});

export type UpdateMealRequestStatusInput = z.infer<typeof UpdateStatusSchema>;

/**
 * Input schema for updating meal request priority
 *
 * Used to change the priority of a meal request.
 * Higher priority values indicate more urgent requests.
 *
 * @example
 * ```typescript
 * const input: UpdateMealRequestPriorityInput = {
 *   priority: 10
 * };
 * ```
 */
export const UpdatePrioritySchema = z.object({
  priority: z.number().int(),
});

export type UpdateMealRequestPriorityInput = z.infer<typeof UpdatePrioritySchema>;
