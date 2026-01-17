'use server';

import {
  RecipeService,
  type Recipe,
  type RecipeVersion,
  type RecipeWithVersion,
  type RecipeImage,
  type RecipeSearchResult,
  type CreateRecipeInput,
  type UpdateRecipeInput,
  type ForkRecipeInput,
  type RecipeId,
  type HouseholdId,
} from '@commontable/api-client';
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
  console.error('Unexpected error in recipe action:', error);
  return { message: 'An unexpected error occurred' };
}

/**
 * Create a new recipe with initial version
 *
 * @param input - Recipe creation input
 * @returns Created recipe or error
 */
export async function createRecipe(
  input: Omit<CreateRecipeInput, 'user_id'>,
): Promise<ActionResult<Recipe>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    // Get current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
    }

    // Get user's profile ID (used as user_id in recipes)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: { message: 'Profile not found', code: 'PROFILE_NOT_FOUND' } };
    }

    const recipe = await service.create({
      ...input,
      user_id: profile.id,
    });

    revalidatePath('/recipes');

    return { success: true, data: recipe };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get a recipe by ID
 *
 * @param id - Recipe ID
 * @returns Recipe or error
 */
export async function getRecipe(id: RecipeId): Promise<ActionResult<Recipe>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    const recipe = await service.getById(id);

    return { success: true, data: recipe };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get all recipes for a household
 *
 * @param householdId - Household ID
 * @returns Array of recipes or error
 */
export async function getRecipesByHousehold(
  householdId: HouseholdId,
): Promise<ActionResult<Recipe[]>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    const recipes = await service.getByHousehold(householdId);

    return { success: true, data: recipes };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Update a recipe
 *
 * If version-related fields are provided, creates a new version.
 * Otherwise, only updates metadata.
 *
 * @param id - Recipe ID
 * @param input - Update input
 * @returns Updated recipe or error
 */
export async function updateRecipe(
  id: RecipeId,
  input: Omit<UpdateRecipeInput, 'user_id'>,
): Promise<ActionResult<Recipe>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    // Get current user's profile ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: { message: 'Profile not found', code: 'PROFILE_NOT_FOUND' } };
    }

    const recipe = await service.update(id, {
      ...input,
      user_id: profile.id,
    });

    revalidatePath(`/recipes/${id}`);
    revalidatePath('/recipes');

    return { success: true, data: recipe };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Delete a recipe
 *
 * @param id - Recipe ID
 * @returns Success or error
 */
export async function deleteRecipe(id: RecipeId): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    await service.delete(id);

    revalidatePath('/recipes');

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Search recipes using full-text search
 *
 * @param query - Search query
 * @param householdId - Household ID to scope search
 * @param limit - Maximum results (default 20)
 * @returns Array of matching recipes or error
 */
export async function searchRecipes(
  query: string,
  householdId: HouseholdId,
  limit?: number,
): Promise<ActionResult<RecipeSearchResult[]>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    const results = await service.search(query, householdId, limit);

    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get version history for a recipe
 *
 * @param recipeId - Recipe ID
 * @returns Array of version history entries or error
 */
export async function getRecipeVersionHistory(recipeId: RecipeId): Promise<
  ActionResult<
    Array<{
      version_id: string;
      version_number: number;
      created_by: string;
      created_at: string;
      is_current: boolean;
    }>
  >
> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    const history = await service.getVersionHistory(recipeId);

    return { success: true, data: history };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get a specific version of a recipe
 *
 * @param recipeId - Recipe ID
 * @param versionNumber - Version number
 * @returns Recipe version or error
 */
export async function getRecipeVersion(
  recipeId: RecipeId,
  versionNumber: number,
): Promise<
  ActionResult<{
    id: string;
    recipe_id: string;
    version_number: number;
    ingredients_json: Array<{ name: string; quantity?: number; unit?: string; notes?: string }>;
    steps_json: Array<{ position: number; text: string }>;
    servings: number | null;
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
    notes: string | null;
    created_by: string;
    created_at: string;
  }>
> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    const version = await service.getVersion(recipeId, versionNumber);

    return { success: true, data: version as unknown as RecipeVersion };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Toggle the favorite status of a recipe
 *
 * @param id - Recipe ID
 * @returns Updated recipe or error
 */
export async function toggleRecipeFavorite(id: RecipeId): Promise<ActionResult<Recipe>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    const recipe = await service.toggleFavorite(id);

    revalidatePath(`/recipes/${id}`);
    revalidatePath('/recipes');

    return { success: true, data: recipe };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get a recipe with its current version data
 *
 * @param id - Recipe ID
 * @returns Recipe with version data or error
 */
export async function getRecipeWithVersion(id: RecipeId): Promise<ActionResult<RecipeWithVersion>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    const recipeWithVersion = await service.getWithVersion(id);

    return { success: true, data: recipeWithVersion };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Get the primary (cover) image for a recipe
 *
 * @param recipeId - Recipe ID
 * @returns Primary image or null if none exists
 */
export async function getRecipePrimaryImage(
  recipeId: RecipeId,
): Promise<ActionResult<RecipeImage | null>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    const image = await service.getPrimaryImage(recipeId);

    return { success: true, data: image };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Restore a recipe to a previous version
 *
 * Creates a new version with the content from the specified version.
 * This preserves the full version history - no data is lost.
 *
 * @param recipeId - Recipe ID
 * @param versionNumber - Version number to restore to
 * @returns Updated recipe or error
 */
export async function restoreRecipeVersion(
  recipeId: RecipeId,
  versionNumber: number,
): Promise<ActionResult<Recipe>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
    }

    // Get user's profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: { message: 'Profile not found', code: 'PROFILE_NOT_FOUND' } };
    }

    const recipe = await service.revertToVersion(recipeId, versionNumber, profile.id);

    // Revalidate recipe detail and version history pages
    revalidatePath(`/recipes/${recipeId}`);
    revalidatePath(`/recipes/${recipeId}/versions`);
    revalidatePath('/recipes');

    return { success: true, data: recipe };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Fork a recipe to create a copy with lineage tracking
 *
 * Creates a new recipe with the same content as the parent recipe.
 * Records the fork relationship for lineage tracking.
 *
 * @param input - Fork input with parentRecipeId and newTitle
 * @returns Forked recipe with version data or error
 */
export async function forkRecipe(input: ForkRecipeInput): Promise<ActionResult<RecipeWithVersion>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
    }

    // Get user's profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: { message: 'Profile not found', code: 'PROFILE_NOT_FOUND' } };
    }

    const forkedRecipe = await service.fork(input, profile.id);

    // Revalidate recipes list to include the new forked recipe
    revalidatePath('/recipes');

    return { success: true, data: forkedRecipe };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Log a cooking event for a recipe
 *
 * @param recipeId - Recipe ID
 * @returns Success or error
 */
export async function logCookingEvent(recipeId: RecipeId): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
    }

    // Get recipe to get household_id and current_version_id
    const service = new RecipeService(supabase);
    const recipe = await service.getById(recipeId);

    // Ensure recipe has a version before logging cooking event
    if (!recipe.current_version_id) {
      return {
        success: false,
        error: { message: 'Recipe has no version to cook', code: 'NO_VERSION' },
      };
    }

    // Create cooking event
    const { error } = await supabase.from('cooking_events').insert({
      recipe_id: recipeId as string,
      recipe_version_id: recipe.current_version_id as string,
      household_id: recipe.household_id as string,
      cooked_by: user.id,
    });

    if (error) throw error;

    // Revalidate paths to update last_cooked_at
    revalidatePath(`/recipes/${recipeId}`);
    revalidatePath('/recipes');

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}
