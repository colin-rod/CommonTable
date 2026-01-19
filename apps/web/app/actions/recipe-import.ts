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
 * Create a recipe from imported data with optional image download
 *
 * @param input - Recipe creation input (without user_id)
 * @param imageUrl - Optional image URL to download and upload
 * @returns Created recipe or error
 */
export async function createImportedRecipe(
  input: Omit<CreateRecipeInput, 'user_id'>,
  imageUrl?: string,
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

    // If image URL provided, try to download and upload (non-critical)
    if (imageUrl) {
      try {
        await downloadAndUploadRecipeImage(recipe.id, imageUrl, supabase);
      } catch (imageError) {
        // Log but don't fail recipe creation
        console.error('Image upload failed (non-critical):', imageError);
      }
    }

    revalidatePath('/recipes');

    return { success: true, data: recipe };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Download image from URL and upload to recipe storage
 *
 * @param recipeId - Recipe ID
 * @param imageUrl - Image URL to download from
 * @param supabase - Supabase client
 */
async function downloadAndUploadRecipeImage(
  recipeId: string,
  imageUrl: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  // Fetch image from URL with 10-second timeout
  const controller = new AbortController();
  // eslint-disable-next-line no-undef
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // eslint-disable-next-line no-undef
    const response = await fetch(imageUrl, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: HTTP ${response.status}`);
    }

    // Get image blob
    const blob = await response.blob();

    // Validate content type
    const contentType = response.headers.get('content-type') || blob.type;
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!validImageTypes.some((type) => contentType.includes(type))) {
      throw new Error(`Invalid image type: ${contentType}`);
    }

    // Generate filename from content type
    const extension = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    const filename = `imported-recipe.${extension}`;

    // Convert blob to File
    const file = new File([blob], filename, { type: contentType });

    // Get user ID for upload
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get recipe to get household_id
    const { data: recipe } = await supabase
      .from('recipes')
      .select('household_id')
      .eq('id', recipeId)
      .single();

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    // Upload to storage
    // eslint-disable-next-line no-undef
    const storagePath = `${recipe.household_id}/${recipeId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Create image metadata record
    const { error: dbError } = await supabase.from('recipe_images').insert({
      recipe_id: recipeId,
      storage_path: storagePath,
      created_by: profile.id,
      is_primary: true, // First image is primary
      alt_text: 'Imported recipe image',
    });

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from('recipe-images').remove([storagePath]);
      throw dbError;
    }
  } finally {
    // eslint-disable-next-line no-undef
    clearTimeout(timeoutId);
  }
}
