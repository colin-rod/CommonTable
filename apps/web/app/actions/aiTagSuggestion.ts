'use server';

import { AiTagSuggestionService } from '@commontable/api-client';
import type {
  AiTagSuggestion,
  AiTagSuggestionId,
  AiTagSuggestionWithTag,
  RecipeVersionId,
  RecipeWithPendingSuggestions,
  HouseholdId,
} from '@commontable/types';
import { AppError } from '@commontable/types';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

/**
 * Action result type for consistent error handling
 */
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Format error for client consumption
 */
function formatError(error: unknown): { message: string; code?: string } {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code };
  }
  console.error('Unexpected error in AI tag suggestion action:', error);
  return { message: 'An unexpected error occurred' };
}

/**
 * Accept a single AI tag suggestion
 *
 * Marks the suggestion as accepted (user_accepted = true)
 * Tag remains in recipe_version_tags (already applied by batch system)
 *
 * @param suggestionId - AI tag suggestion ID
 * @returns Updated suggestion or error
 */
export async function acceptAiTagSuggestion(
  suggestionId: AiTagSuggestionId,
): Promise<ActionResult<AiTagSuggestion>> {
  try {
    const supabase = await createClient();
    const service = new AiTagSuggestionService(supabase);

    const suggestion = await service.accept(suggestionId);

    // Revalidate recipe pages and review page
    // Note: We don't have the recipe ID here, so we revalidate the recipes list
    // Individual recipe pages will be revalidated when they load
    revalidatePath('/recipes');
    revalidatePath('/(dashboard)/tags/review');

    return { success: true, data: suggestion };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Reject a single AI tag suggestion
 *
 * Marks the suggestion as rejected (user_accepted = false)
 * Also removes the tag from recipe_version_tags
 *
 * @param suggestionId - AI tag suggestion ID
 * @returns Updated suggestion or error
 */
export async function rejectAiTagSuggestion(
  suggestionId: AiTagSuggestionId,
): Promise<ActionResult<AiTagSuggestion>> {
  try {
    const supabase = await createClient();
    const service = new AiTagSuggestionService(supabase);

    const suggestion = await service.reject(suggestionId);

    // Revalidate recipe pages and review page
    revalidatePath('/recipes');
    revalidatePath('/(dashboard)/tags/review');

    return { success: true, data: suggestion };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Accept all pending suggestions for a recipe version
 *
 * Bulk operation to mark all pending suggestions as accepted
 * Tags remain in recipe_version_tags (already applied by batch system)
 *
 * @param versionId - Recipe version ID
 * @returns Success or error
 */
export async function acceptAllAiTagSuggestions(
  versionId: RecipeVersionId,
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const service = new AiTagSuggestionService(supabase);

    await service.acceptAllForRecipeVersion(versionId);

    // Revalidate recipe pages and review page
    revalidatePath('/recipes');
    revalidatePath('/(dashboard)/tags/review');

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get pending suggestions for a recipe version
 *
 * Used by recipe detail and edit pages to display pending suggestions
 *
 * @param versionId - Recipe version ID
 * @returns Pending suggestions or error
 */
export async function getPendingAiTagSuggestions(
  versionId: RecipeVersionId,
): Promise<ActionResult<AiTagSuggestionWithTag[]>> {
  try {
    const supabase = await createClient();
    const service = new AiTagSuggestionService(supabase);

    const suggestions = await service.getPendingByRecipeVersion(versionId);

    return { success: true, data: suggestions };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get all pending AI tag suggestions for the household, grouped by recipe
 *
 * Used by the AI Tag Review page to display all recipes with pending suggestions
 *
 * @returns Array of recipes with pending suggestions or error
 */
export async function getPendingTagSuggestionsForReview(): Promise<
  ActionResult<RecipeWithPendingSuggestions[]>
> {
  try {
    const supabase = await createClient();
    const service = new AiTagSuggestionService(supabase);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
      };
    }

    // Get household_id from household_members
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return {
        success: false,
        error: { message: 'No household found', code: 'NOT_FOUND' },
      };
    }

    const recipesWithSuggestions = await service.getPendingByHousehold(
      member.household_id as HouseholdId,
    );

    return { success: true, data: recipesWithSuggestions };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Accept all AI tag suggestions for a recipe version
 *
 * Alias for acceptAllAiTagSuggestions with a more descriptive name for use in review page
 *
 * @param versionId - Recipe version ID
 * @returns Success or error
 */
export async function acceptAllAiTagSuggestionsForRecipe(
  versionId: RecipeVersionId,
): Promise<ActionResult<void>> {
  return acceptAllAiTagSuggestions(versionId);
}
