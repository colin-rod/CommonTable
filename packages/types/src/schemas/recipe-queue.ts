import { z } from 'zod';

// =============================================================================
// Recipe Queue Enums
// =============================================================================

/**
 * Queue status enum (3 states)
 * Maps to database queue_status enum
 */
export const QueueStatusSchema = z.enum(['queued', 'cooking', 'cooked']);

export type QueueStatus = z.infer<typeof QueueStatusSchema>;

/**
 * Lane type enum (5 types for organizing queue)
 */
export const LaneTypeSchema = z.enum([
  'meal_type',
  'cuisine',
  'cooking_method',
  'dietary',
  'dish_category',
]);

export type LaneType = z.infer<typeof LaneTypeSchema>;

// =============================================================================
// Recipe Queue Entry Schemas
// =============================================================================

/**
 * Create queue entry input schema
 * Used when adding a recipe to the queue from shortlist
 */
export const CreateQueueEntrySchema = z.object({
  recipe_id: z.string().uuid('Invalid recipe ID'),
  household_id: z.string().uuid('Invalid household ID'),
  added_by: z.string().uuid('Invalid user ID'),
  position: z.number().int().nonnegative().default(0),
  status: QueueStatusSchema.default('queued'),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').trim().optional(),
});

export type CreateQueueEntryInput = z.infer<typeof CreateQueueEntrySchema>;

/**
 * Update queue entry schema
 * Used for reordering (position) or changing status
 */
export const UpdateQueueEntrySchema = z.object({
  position: z.number().int().nonnegative().optional(),
  status: QueueStatusSchema.optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').trim().nullable().optional(),
});

export type UpdateQueueEntryInput = z.infer<typeof UpdateQueueEntrySchema>;

/**
 * Update queue position schema
 * Used specifically for drag-and-drop reordering
 */
export const UpdateQueuePositionSchema = z.object({
  position: z.number().int().nonnegative(),
});

export type UpdateQueuePositionInput = z.infer<typeof UpdateQueuePositionSchema>;

/**
 * Update queue status schema
 * Used for marking as cooking or cooked
 */
export const UpdateQueueStatusSchema = z.object({
  status: QueueStatusSchema,
});

export type UpdateQueueStatusInput = z.infer<typeof UpdateQueueStatusSchema>;

/**
 * Queue entry ID schema
 */
export const QueueEntryIdSchema = z.string().uuid('Invalid queue entry ID');

/**
 * Queue filter schema
 * Used for filtering queue entries by status
 */
export const QueueFilterSchema = z.object({
  status: QueueStatusSchema.optional(),
  household_id: z.string().uuid('Invalid household ID'),
});

export type QueueFilter = z.infer<typeof QueueFilterSchema>;

// =============================================================================
// Lane Configuration
// =============================================================================

/**
 * Lane configuration schema
 * Defines metadata for each lane type
 */
export const LaneConfigSchema = z.object({
  type: LaneTypeSchema,
  label: z.string().min(1),
  description: z.string().min(1),
});

export type LaneConfig = z.infer<typeof LaneConfigSchema>;

/**
 * Lane types constant with metadata
 * Used for dropdown selection and display
 */
export const LANE_TYPES: Record<LaneType, LaneConfig> = {
  meal_type: {
    type: 'meal_type',
    label: 'Meal Type',
    description: 'Group by breakfast, main dish, side dish, etc.',
  },
  cuisine: {
    type: 'cuisine',
    label: 'Cuisine',
    description: 'Group by Italian, Mexican, Asian, etc.',
  },
  cooking_method: {
    type: 'cooking_method',
    label: 'Cooking Method',
    description: 'Group by quick, slow cook, bake, grill, etc.',
  },
  dietary: {
    type: 'dietary',
    label: 'Dietary',
    description: 'Group by vegetarian, vegan, gluten-free, etc.',
  },
  dish_category: {
    type: 'dish_category',
    label: 'Main/Side',
    description: 'Group by main, side, appetizer, soup, etc.',
  },
};

// =============================================================================
// Mark as Cooked Schema
// =============================================================================

/**
 * Mark as cooked input schema
 * Used when marking a queue entry as cooked and creating cooking event
 */
export const MarkAsCookedSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  servings_made: z.number().int().positive().optional(),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').trim().optional(),
});

export type MarkAsCookedInput = z.infer<typeof MarkAsCookedSchema>;
