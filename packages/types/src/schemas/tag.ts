import { z } from 'zod';

export const TagNameSchema = z
  .string()
  .min(1, 'Tag name cannot be empty')
  .max(20, 'Tag name must be 20 characters or less')
  .transform((val) => val.toLowerCase().trim());

export const CreateTagInputSchema = z.object({
  name: TagNameSchema,
});

export const UpdateTagInputSchema = z.object({
  name: TagNameSchema,
});

export const AddTagToVersionInputSchema = z.object({
  recipe_version_id: z.string().uuid(),
  tag_name: TagNameSchema, // Will be normalized to tag_id via get_or_create_tag
});

export const RemoveTagFromVersionInputSchema = z.object({
  recipe_version_id: z.string().uuid(),
  tag_id: z.string().uuid(),
});

export const UpdateAiSuggestionInputSchema = z.object({
  suggestion_id: z.string().uuid(),
  user_accepted: z.boolean(),
});

export const CreateAiSuggestionInputSchema = z.object({
  recipe_version_id: z.string().uuid(),
  tag_id: z.string().uuid(),
  confidence_score: z.number().min(0).max(1),
  model_version: z.string().min(1),
});

export type CreateTagInput = z.infer<typeof CreateTagInputSchema>;
export type UpdateTagInput = z.infer<typeof UpdateTagInputSchema>;
export type AddTagToVersionInput = z.infer<typeof AddTagToVersionInputSchema>;
export type RemoveTagFromVersionInput = z.infer<typeof RemoveTagFromVersionInputSchema>;
export type UpdateAiSuggestionInput = z.infer<typeof UpdateAiSuggestionInputSchema>;
export type CreateAiSuggestionInput = z.infer<typeof CreateAiSuggestionInputSchema>;
