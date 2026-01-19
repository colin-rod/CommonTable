'use server';

import { RecipeService, type Recipe, type CreateRecipeInput } from '@commontable/api-client';
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
 * Recipe import response from Edge Function
 */
export interface RecipeImportResponse {
  preview: {
    title?: string;
    description?: string;
    servings?: number;
    prep_time_minutes?: number;
    cook_time_minutes?: number;
    ingredients: Array<{
      name: string;
      quantity?: number;
      unit?: string;
      notes?: string;
    }>;
    steps: Array<{
      position: number;
      text: string;
    }>;
    image_url?: string;
    cover_image_storage_path?: string; // NEW: Path to downloaded image in temp storage
    tags: string[];
  };
  validation_errors: Array<{
    field: string;
    message: string;
  }>;
  source: {
    url: string;
    parsed_via: 'jsonld' | 'html-fallback';
    fetched_at: string;
  };
}

/**
 * Format error for client consumption
 */
function formatError(error: unknown): { message: string; code?: string } {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code };
  }
  console.error('Unexpected error in recipe-import action:', error);
  return { message: 'An unexpected error occurred' };
}

/**
 * Fetch recipe preview from URL using the recipe-import Edge Function
 *
 * @param url - Recipe URL to import from
 * @returns Recipe preview data or error
 */
export async function fetchRecipePreview(url: string): Promise<ActionResult<RecipeImportResponse>> {
  try {
    const supabase = await createClient();

    // Get current user for authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
      };
    }

    // Get auth session to extract JWT token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: { message: 'No active session', code: 'UNAUTHORIZED' },
      };
    }

    // Get Supabase project URL from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured');
    }

    // Call recipe-import Edge Function
    // eslint-disable-next-line no-undef
    const response = await fetch(`${supabaseUrl}/functions/v1/recipe-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;

      return {
        success: false,
        error: {
          message: errorMessage,
          code: response.status === 401 ? 'UNAUTHORIZED' : 'EDGE_FUNCTION_ERROR',
        },
      };
    }

    const result = await response.json();

    // Edge Function returns { data: RecipeImportResponse }
    if (!result.data) {
      return {
        success: false,
        error: { message: 'Invalid response from import service', code: 'INVALID_RESPONSE' },
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Create a recipe from imported data with optional image from temp storage
 *
 * @param input - Recipe creation input (without user_id)
 * @param coverImageStoragePath - Optional path to image in temp storage
 * @returns Created recipe or error
 */
export async function createImportedRecipe(
  input: Omit<CreateRecipeInput, 'user_id'>,
  coverImageStoragePath?: string,
): Promise<ActionResult<Recipe>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    // Get current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
      };
    }

    // Get user's profile ID (used as user_id in recipes)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return {
        success: false,
        error: { message: 'Profile not found', code: 'PROFILE_NOT_FOUND' },
      };
    }

    // Create recipe
    const recipe = await service.create({
      ...input,
      user_id: profile.id,
    });

    // If cover image provided, move from temp to permanent storage (non-critical)
    if (coverImageStoragePath) {
      try {
        await moveImageToPermanentStorage(
          coverImageStoragePath,
          recipe.id,
          recipe.household_id,
          profile.id,
          supabase,
        );
      } catch (imageError) {
        // Log but don't fail recipe creation
        console.error('Image move failed (non-critical):', imageError);
      }
    }

    revalidatePath('/recipes');

    return { success: true, data: recipe };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Move image from temporary storage to permanent recipe storage
 *
 * @param tempStoragePath - Path to image in temp storage (imports/{user_id}/...)
 * @param recipeId - Recipe ID
 * @param householdId - Household ID
 * @param userId - User profile ID (created_by)
 * @param supabase - Supabase client
 */
async function moveImageToPermanentStorage(
  tempStoragePath: string,
  recipeId: string,
  householdId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  // 1. Download from temp location
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('recipe-images')
    .download(tempStoragePath);

  if (downloadError) {
    throw new Error(`Failed to download temp image: ${downloadError.message}`);
  }

  // 2. Generate permanent path
  const extension = tempStoragePath.split('.').pop() || 'jpg';
  // eslint-disable-next-line no-undef
  const permanentPath = `${householdId}/${recipeId}/${crypto.randomUUID()}.${extension}`;

  // 3. Upload to permanent location
  const { error: uploadError } = await supabase.storage
    .from('recipe-images')
    .upload(permanentPath, fileData, {
      contentType: fileData.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload to permanent storage: ${uploadError.message}`);
  }

  // 4. Create recipe_images record
  const { error: dbError } = await supabase.from('recipe_images').insert({
    recipe_id: recipeId,
    storage_path: permanentPath,
    created_by: userId,
    is_primary: true,
    alt_text: 'Imported recipe cover image',
  });

  if (dbError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from('recipe-images').remove([permanentPath]);
    throw new Error(`Failed to create image metadata record: ${dbError.message}`);
  }

  // 5. Optionally delete temp file (leaving it for manual cleanup as per plan)
  // await supabase.storage.from('recipe-images').remove([tempStoragePath]);
}
