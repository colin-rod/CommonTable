import { z } from 'zod';

/**
 * Create cooking event input schema
 * Used when logging a meal (manual or from calendar entry completion)
 */
export const CreateCookingEventSchema = z.object({
  recipe_id: z.string().uuid('Invalid recipe ID'),
  recipe_version_id: z.string().uuid('Invalid recipe version ID'),
  cooked_at: z.date().optional(), // Defaults to NOW in service
  servings_made: z.number().int().positive().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  calendar_entry_id: z.string().uuid().optional(), // For linking to calendar entry
});

export type CreateCookingEventInput = z.infer<typeof CreateCookingEventSchema>;

/**
 * Update cooking event schema (for editing rating/notes after logging)
 */
export const UpdateCookingEventSchema = z.object({
  rating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  servings_made: z.number().int().positive().optional().nullable(),
});

export type UpdateCookingEventInput = z.infer<typeof UpdateCookingEventSchema>;

/**
 * Cooking event ID schema
 */
export const CookingEventIdSchema = z.string().uuid('Invalid cooking event ID');
