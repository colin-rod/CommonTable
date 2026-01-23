import type {
  AiTagSuggestion,
  AiTagSuggestionId,
  AiTagSuggestionWithTag,
  RecipeVersionId,
} from '@commontable/types';
import { AppError, NotFoundError } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Service for managing AI tag suggestions
 *
 * Handles accepting/rejecting AI-generated tag suggestions for recipes.
 * Suggestions are created by the batch processing system and presented to users for review.
 */
export class AiTagSuggestionService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Get pending suggestions for a recipe version
   *
   * Returns suggestions where user_accepted IS NULL (not yet reviewed by user)
   *
   * @param versionId - Recipe version ID
   * @returns Array of pending suggestions with tag details
   * @throws {AppError} If database query fails
   */
  async getPendingByRecipeVersion(versionId: RecipeVersionId): Promise<AiTagSuggestionWithTag[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_tag_suggestions')
        .select('*, tag:tags(*)')
        .eq('recipe_version_id', versionId)
        .is('user_accepted', null);

      if (error) throw error;

      return (data as AiTagSuggestionWithTag[]) ?? [];
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('AiTagSuggestionService.getPendingByRecipeVersion failed:', error);
      throw new AppError('Failed to fetch pending suggestions', 'FETCH_ERROR', 500, { versionId });
    }
  }

  /**
   * Mark suggestion as accepted
   *
   * Sets user_accepted = true and accepted_at = NOW()
   * Tag remains in recipe_version_tags (already applied by batch system)
   *
   * @param suggestionId - AI tag suggestion ID
   * @returns Updated suggestion
   * @throws {NotFoundError} If suggestion does not exist
   * @throws {AppError} If database update fails
   */
  async accept(suggestionId: AiTagSuggestionId): Promise<AiTagSuggestion> {
    try {
      const { data, error } = await this.supabase
        .from('ai_tag_suggestions')
        .update({
          user_accepted: true,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', suggestionId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('AI tag suggestion', suggestionId);

      return data as AiTagSuggestion;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('AiTagSuggestionService.accept failed:', error);
      throw new AppError('Failed to accept suggestion', 'UPDATE_ERROR', 500, {
        suggestionId,
      });
    }
  }

  /**
   * Mark suggestion as rejected
   *
   * Sets user_accepted = false and accepted_at = NOW()
   * Also removes the tag from recipe_version_tags (user doesn't want this tag)
   *
   * @param suggestionId - AI tag suggestion ID
   * @returns Updated suggestion
   * @throws {NotFoundError} If suggestion does not exist
   * @throws {AppError} If database update fails
   */
  async reject(suggestionId: AiTagSuggestionId): Promise<AiTagSuggestion> {
    try {
      // First, update the suggestion to mark as rejected
      const { data, error } = await this.supabase
        .from('ai_tag_suggestions')
        .update({
          user_accepted: false,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', suggestionId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('AI tag suggestion', suggestionId);

      const suggestion = data as AiTagSuggestion;

      // Remove the tag from recipe_version_tags
      const { error: deleteError } = await this.supabase
        .from('recipe_version_tags')
        .delete()
        .eq('recipe_version_id', suggestion.recipe_version_id)
        .eq('tag_id', suggestion.tag_id);

      if (deleteError) {
        console.error('Failed to remove tag from recipe:', deleteError);
        // Don't throw - suggestion was marked as rejected successfully
        // Tag removal is a best-effort operation
      }

      return suggestion;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('AiTagSuggestionService.reject failed:', error);
      throw new AppError('Failed to reject suggestion', 'UPDATE_ERROR', 500, {
        suggestionId,
      });
    }
  }

  /**
   * Mark all pending suggestions for a recipe as accepted
   *
   * Bulk operation to accept all suggestions at once
   * Tags remain in recipe_version_tags (already applied by batch system)
   *
   * @param versionId - Recipe version ID
   * @throws {AppError} If database update fails
   */
  async acceptAllForRecipeVersion(versionId: RecipeVersionId): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_tag_suggestions')
        .update({
          user_accepted: true,
          accepted_at: new Date().toISOString(),
        })
        .eq('recipe_version_id', versionId)
        .is('user_accepted', null);

      if (error) throw error;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('AiTagSuggestionService.acceptAllForRecipeVersion failed:', error);
      throw new AppError('Failed to accept all suggestions', 'UPDATE_ERROR', 500, {
        versionId,
      });
    }
  }
}
