import type {
  AiTagSuggestion,
  AiTagSuggestionId,
  AiTagSuggestionWithTag,
  RecipeVersionId,
  Database,
  TagId,
  HouseholdId,
  UserId,
  RecipeWithPendingSuggestions,
  RecipeId,
} from '@commontable/types';
import { NotFoundError } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { BaseService } from './BaseService';

/**
 * Service for managing AI tag suggestions
 *
 * Handles accepting/rejecting AI-generated tag suggestions for recipes.
 * Suggestions are created by the batch processing system and presented to users for review.
 */
export class AiTagSuggestionService extends BaseService {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase);
  }

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
    const { data, error } = await this.supabase
      .from('ai_tag_suggestions')
      .select('*, tag:tags(*)')
      .eq('recipe_version_id', versionId)
      .is('user_accepted', null);

    if (error) {
      BaseService.handleSupabaseError(error, 'AiTagSuggestionService.getPendingByRecipeVersion', {
        versionId,
      });
    }

    if (!data) return [];

    // Transform database response to branded types
    return data.map((item) => ({
      ...item,
      id: item.id as AiTagSuggestionId,
      recipe_version_id: item.recipe_version_id as RecipeVersionId,
      tag_id: item.tag_id as unknown as TagId,
      created_at: new Date(item.created_at),
      accepted_at: item.accepted_at ? new Date(item.accepted_at) : null,
      tag: {
        ...item.tag,
        id: item.tag.id as unknown as TagId,
        household_id: item.tag.household_id as unknown as HouseholdId,
        created_by: item.tag.created_by as unknown as UserId,
        created_at: new Date(item.tag.created_at),
        updated_at: new Date(item.tag.updated_at),
      },
    }));
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
    const { data, error } = await this.supabase
      .from('ai_tag_suggestions')
      .update({
        user_accepted: true,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', suggestionId)
      .select()
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'AiTagSuggestionService.accept', {
        suggestionId,
      });
    }
    if (!data) throw new NotFoundError('AI tag suggestion', suggestionId);

    return {
      ...data,
      id: data.id as AiTagSuggestionId,
      recipe_version_id: data.recipe_version_id as RecipeVersionId,
      tag_id: data.tag_id as unknown as TagId,
      created_at: new Date(data.created_at),
      accepted_at: data.accepted_at ? new Date(data.accepted_at) : null,
    };
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

    if (error) {
      BaseService.handleSupabaseError(error, 'AiTagSuggestionService.reject', { suggestionId });
    }
    if (!data) throw new NotFoundError('AI tag suggestion', suggestionId);

    const suggestion: AiTagSuggestion = {
      ...data,
      id: data.id as AiTagSuggestionId,
      recipe_version_id: data.recipe_version_id as RecipeVersionId,
      tag_id: data.tag_id as unknown as TagId,
      created_at: new Date(data.created_at),
      accepted_at: data.accepted_at ? new Date(data.accepted_at) : null,
    };

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
    const { error } = await this.supabase
      .from('ai_tag_suggestions')
      .update({
        user_accepted: true,
        accepted_at: new Date().toISOString(),
      })
      .eq('recipe_version_id', versionId)
      .is('user_accepted', null);

    if (error) {
      BaseService.handleSupabaseError(error, 'AiTagSuggestionService.acceptAllForRecipeVersion', {
        versionId,
      });
    }
  }

  /**
   * Get all pending suggestions for a household, grouped by recipe
   *
   * Returns recipes with pending AI tag suggestions, joined with:
   * - Tag details (name, id)
   * - Recipe version info
   * - Recipe title
   *
   * @param householdId - Household ID
   * @returns Array of recipes with their pending suggestions
   * @throws {AppError} If database query fails
   */
  async getPendingByHousehold(householdId: HouseholdId): Promise<RecipeWithPendingSuggestions[]> {
    const { data, error } = await this.supabase
      .from('ai_tag_suggestions')
      .select(
        `
        *,
        tag:tags(*),
        recipe_version:recipe_versions!inner(
          id,
          recipe_id,
          version_number,
          recipe:recipes!inner(
            id,
            title,
            household_id
          )
        )
      `,
      )
      .eq('recipe_version.recipe.household_id', householdId)
      .is('user_accepted', null)
      .order('created_at', { ascending: false });

    if (error) {
      BaseService.handleSupabaseError(error, 'AiTagSuggestionService.getPendingByHousehold', {
        householdId,
      });
    }

    // Group suggestions by recipe_id
    const groupedMap = new Map<RecipeId, RecipeWithPendingSuggestions>();

    (data || []).forEach((item: unknown) => {
      // Type guard: ensure item has expected structure
      if (
        !item ||
        typeof item !== 'object' ||
        !('recipe_version' in item) ||
        !item.recipe_version ||
        typeof item.recipe_version !== 'object' ||
        !('recipe' in item.recipe_version) ||
        !('id' in item) ||
        !('recipe_version_id' in item) ||
        !('tag_id' in item) ||
        !('tag' in item)
      ) {
        return;
      }

      const recipeData = item.recipe_version as {
        id: string;
        recipe: { id: string; title: string };
      };
      const recipeId = recipeData.recipe.id as RecipeId;

      if (!groupedMap.has(recipeId)) {
        groupedMap.set(recipeId, {
          recipe_id: recipeId,
          recipe_title: recipeData.recipe.title,
          recipe_version_id: recipeData.id as RecipeVersionId,
          suggestions: [],
        });
      }

      const entry = groupedMap.get(recipeId);
      if (!entry) return;

      const itemData = item as unknown as {
        id: string;
        recipe_version_id: string;
        tag_id: string;
        confidence_score: number;
        user_accepted: boolean | null;
        accepted_at: string | null;
        model_version: string;
        created_at: string;
        tag: {
          id: string;
          household_id: string;
          name: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
      };

      entry.suggestions.push({
        id: itemData.id as AiTagSuggestionId,
        recipe_version_id: itemData.recipe_version_id as RecipeVersionId,
        tag_id: itemData.tag_id as TagId,
        confidence_score: itemData.confidence_score,
        user_accepted: itemData.user_accepted,
        accepted_at: itemData.accepted_at ? new Date(itemData.accepted_at) : null,
        model_version: itemData.model_version,
        created_at: new Date(itemData.created_at),
        tag: {
          id: itemData.tag.id as TagId,
          household_id: itemData.tag.household_id as HouseholdId,
          name: itemData.tag.name,
          created_by: itemData.tag.created_by as UserId,
          created_at: new Date(itemData.tag.created_at),
          updated_at: new Date(itemData.tag.updated_at),
        },
      });
    });

    return Array.from(groupedMap.values());
  }
}
