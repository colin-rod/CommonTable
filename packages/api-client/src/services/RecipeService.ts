import {
  type RecipeId,
  type HouseholdId,
  type UserId,
  type Recipe,
  type RecipeVersion,
  type RecipeWithVersion,
  type RecipeImage,
  type RecipeImageId,
  type RecipeSearchResult,
  type VersionHistoryEntry,
  type CreateRecipeInput,
  type UpdateRecipeInput,
  type ForkRecipeInput,
  type UpdateRecipeStatusInput,
  type Database,
  CreateRecipeInputSchema,
  UpdateRecipeInputSchema,
  RecipeSearchSchema,
  ForkRecipeInputSchema,
  UpdateRecipeStatusSchema,
  ValidationError,
  NotFoundError,
  AppError,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { BaseService } from './BaseService';
import { TagService } from './TagService';

/**
 * RecipeService - Manages recipe CRUD operations
 *
 * Provides methods for:
 * - Creating recipes with initial versions (atomic transaction)
 * - Reading recipes by ID or household
 * - Updating recipes (creates new versions for content changes)
 * - Deleting recipes (cascade deletes versions)
 * - Searching recipes via full-text search
 * - Retrieving version history
 */
export class RecipeService extends BaseService {
  private tagService: TagService;

  constructor(supabase: SupabaseClient<Database>) {
    super(supabase);
    this.tagService = new TagService(supabase);
  }

  /**
   * Normalize recipe data to ensure array fields are never null
   * Database may return null for array columns, but our types expect arrays
   */
  private normalizeRecipe<T extends Record<string, unknown>>(data: T): T {
    return {
      ...data,
      tags: (data.tags as string[] | null) ?? [],
      key_ingredients: (data.key_ingredients as string[] | null) ?? [],
    };
  }

  /**
   * Create a new recipe with its initial version
   *
   * Uses database function create_recipe_with_version for atomic transaction:
   * 1. Creates recipe record
   * 2. Creates initial version (version 1)
   * 3. Sets recipe.current_version_id to the new version
   * 4. Associates tags with the version (if provided)
   *
   * @param input - Recipe creation input
   * @returns Created recipe
   * @throws {ValidationError} If input validation fails
   * @throws {AppError} If database operation fails
   */
  async create(input: CreateRecipeInput): Promise<Recipe> {
    const validated = BaseService.validateInput(
      CreateRecipeInputSchema,
      input,
      'Invalid recipe data',
    );

    // Call database function for atomic recipe + version creation
    // Note: Database function handles null values, but generated types are strict
    // Provide default empty arrays for JSON fields to satisfy type constraints
    const { data: recipeId, error: rpcError } = await this.supabase.rpc(
      'create_recipe_with_version',
      {
        p_household_id: validated.household_id,
        p_title: validated.title,
        p_description: validated.description ?? '',
        p_ingredients_json: validated.ingredients_json ?? [],
        p_steps_json: validated.steps_json ?? [],
        p_servings: validated.servings ?? 0,
        p_prep_time_minutes: validated.prep_time_minutes ?? 0,
        p_cook_time_minutes: validated.cook_time_minutes ?? 0,
        p_notes: validated.notes ?? '',
        p_user_id: validated.user_id,
        // Existing metadata fields
        p_cuisine: validated.cuisine ?? undefined,
        p_meal_type: validated.meal_type ?? undefined,
        p_key_ingredients: validated.key_ingredients ?? undefined,
        p_priority: validated.priority ?? undefined,
        p_status: validated.status ?? 'suggested',
        // Source URL for imported recipes
        p_source_url: validated.source_url ?? undefined,
      },
    );

    if (rpcError) {
      BaseService.handleSupabaseError(rpcError, 'RecipeService.create');
    }
    if (!recipeId) {
      throw new AppError('Failed to create recipe - no ID returned', 'CREATE_ERROR');
    }

    // Fetch the created recipe to get current_version_id
    const recipe = await this.getById(recipeId as RecipeId);

    // Associate tags with the recipe version (if provided)
    if (validated.tags && validated.tags.length > 0 && recipe.current_version_id) {
      const versionId = recipe.current_version_id;
      await Promise.all(
        validated.tags.map((tagName) =>
          this.tagService.addTagToVersion(
            {
              recipe_version_id: versionId,
              tag_name: tagName,
            },
            validated.user_id as UserId,
          ),
        ),
      );
    }

    // Return the recipe (tags will be loaded on subsequent reads)
    return recipe;
  }

  /**
   * Get a recipe by ID
   *
   * @param id - Recipe ID
   * @returns Recipe
   * @throws {NotFoundError} If recipe does not exist
   * @throws {AppError} If database operation fails
   */
  async getById(id: RecipeId): Promise<Recipe> {
    const { data, error } = await this.supabase.from('recipes').select('*').eq('id', id).single();

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeService.getById', { id });
    }
    if (!data) throw new NotFoundError('Recipe', id);

    return this.normalizeRecipe(data) as unknown as Recipe;
  }

  /**
   * Get all recipes for a household
   *
   * @param householdId - Household ID
   * @returns Array of recipes
   * @throws {AppError} If database operation fails
   */
  async getByHousehold(householdId: HouseholdId): Promise<Recipe[]> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('household_id', householdId)
      .order('updated_at', { ascending: false });

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeService.getByHousehold', { householdId });
    }

    return (data ?? []).map((recipe) => this.normalizeRecipe(recipe)) as unknown as Recipe[];
  }

  /**
   * Update a recipe
   *
   * If version-related fields (ingredients, steps, servings, times, notes) are provided,
   * creates a new version using update_recipe_create_version database function.
   *
   * If only metadata fields (title, description, tags) are provided,
   * updates the recipe directly without creating a new version.
   *
   * @param id - Recipe ID
   * @param input - Update input
   * @returns Updated recipe
   * @throws {ValidationError} If input validation fails
   * @throws {NotFoundError} If recipe does not exist
   * @throws {AppError} If database operation fails
   */
  async update(id: RecipeId, input: UpdateRecipeInput): Promise<Recipe> {
    const validated = BaseService.validateInput(
      UpdateRecipeInputSchema,
      input,
      'Invalid update data',
    );

    // Check if recipe exists first
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Recipe', id);
    }

    // Determine if we need to create a new version
    const hasVersionFields =
      validated.ingredients_json !== undefined ||
      validated.steps_json !== undefined ||
      validated.servings !== undefined ||
      validated.prep_time_minutes !== undefined ||
      validated.cook_time_minutes !== undefined ||
      validated.notes !== undefined;

    if (hasVersionFields) {
      // Create new version via database function
      // Note: Database function handles null values, but generated types are strict
      const { error: rpcError } = await this.supabase.rpc('update_recipe_create_version', {
        p_recipe_id: id,
        p_title: validated.title ?? existing.title,
        p_description: validated.description ?? existing.description ?? '',
        p_ingredients_json: validated.ingredients_json ?? [],
        p_steps_json: validated.steps_json ?? [],
        p_servings: validated.servings ?? 0,
        p_prep_time_minutes: validated.prep_time_minutes ?? 0,
        p_cook_time_minutes: validated.cook_time_minutes ?? 0,
        p_notes: validated.notes ?? '',
        p_user_id: validated.user_id,
      });

      if (rpcError) {
        BaseService.handleSupabaseError(rpcError, 'RecipeService.update', { id });
      }
    } else {
      // Update metadata only (no new version)
      const updateData: Record<string, unknown> = {};
      if (validated.title !== undefined) updateData.title = validated.title;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.tags !== undefined) updateData.tags = validated.tags;
      if (validated.is_favorite !== undefined) updateData.is_favorite = validated.is_favorite;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await this.supabase
          .from('recipes')
          .update(updateData)
          .eq('id', id);

        if (updateError) {
          BaseService.handleSupabaseError(updateError, 'RecipeService.update', { id });
        }
      }
    }

    // Return updated recipe
    return await this.getById(id);
  }

  /**
   * Delete a recipe
   *
   * Recipe versions are cascade-deleted by the database.
   *
   * @param id - Recipe ID
   * @throws {NotFoundError} If recipe does not exist
   * @throws {AppError} If database operation fails
   */
  async delete(id: RecipeId): Promise<void> {
    // Check if recipe exists first
    await this.getById(id);

    const { error } = await this.supabase.from('recipes').delete().eq('id', id);

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeService.delete', { id });
    }
  }

  /**
   * Search recipes using full-text search
   *
   * @param query - Search query
   * @param householdId - Household ID to scope search
   * @param limit - Maximum results (default 20)
   * @returns Array of matching recipes with relevance rank
   * @throws {ValidationError} If query is invalid
   * @throws {AppError} If database operation fails
   */
  async search(
    query: string,
    householdId: HouseholdId,
    limit: number = 20,
  ): Promise<RecipeSearchResult[]> {
    const validated = BaseService.validateInput(
      RecipeSearchSchema,
      {
        query,
        household_id: householdId,
        limit,
      },
      'Invalid search parameters',
    );

    const { data, error } = await this.supabase.rpc('search_recipes', {
      p_query: validated.query,
      p_household_id: validated.household_id,
      p_limit: validated.limit,
    });

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeService.search');
    }

    return (data ?? []).map((recipe) =>
      this.normalizeRecipe(recipe),
    ) as unknown as RecipeSearchResult[];
  }

  /**
   * Get version history for a recipe
   *
   * @param recipeId - Recipe ID
   * @returns Array of version history entries (newest first)
   * @throws {AppError} If database operation fails
   */
  async getVersionHistory(recipeId: RecipeId): Promise<VersionHistoryEntry[]> {
    const { data, error } = await this.supabase.rpc('get_recipe_version_history', {
      p_recipe_id: recipeId,
    });

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeService.getVersionHistory', { recipeId });
    }

    return (data ?? []) as unknown as VersionHistoryEntry[];
  }

  /**
   * Get a specific version of a recipe
   *
   * @param recipeId - Recipe ID
   * @param versionNumber - Version number to fetch
   * @returns Recipe version
   * @throws {NotFoundError} If version does not exist
   * @throws {AppError} If database operation fails
   */
  async getVersion(recipeId: RecipeId, versionNumber: number): Promise<RecipeVersion> {
    const { data, error } = await this.supabase
      .from('recipe_versions')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('version_number', versionNumber)
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeService.getVersion', {
        recipeId,
        versionNumber,
      });
    }
    if (!data) throw new NotFoundError('RecipeVersion', `${recipeId}:v${versionNumber}`);

    return data as unknown as RecipeVersion;
  }

  /**
   * Toggle the favorite status of a recipe
   *
   * @param id - Recipe ID
   * @returns Updated recipe with toggled favorite status
   * @throws {NotFoundError} If recipe does not exist
   * @throws {AppError} If database operation fails
   */
  async toggleFavorite(id: RecipeId): Promise<Recipe> {
    // Get current recipe to check is_favorite status
    const existing = await this.getById(id);

    // Toggle the favorite status
    const { error: updateError } = await this.supabase
      .from('recipes')
      .update({ is_favorite: !existing.is_favorite })
      .eq('id', id);

    if (updateError) {
      BaseService.handleSupabaseError(updateError, 'RecipeService.toggleFavorite', { id });
    }

    // Return updated recipe
    return await this.getById(id);
  }

  /**
   * Update recipe status
   *
   * Allows updating recipe lifecycle status:
   * - suggested (default/new)
   * - to_buy (considering for planning)
   * - to_cook (ready to schedule)
   * - cooked (has been prepared - typically auto-set by cooking event)
   *
   * @param id - Recipe ID
   * @param input - Status update input
   * @returns Updated recipe with new status
   * @throws {ValidationError} If input validation fails
   * @throws {NotFoundError} If recipe does not exist
   * @throws {AppError} If database operation fails
   */
  async updateStatus(id: RecipeId, input: UpdateRecipeStatusInput): Promise<Recipe> {
    const validated = BaseService.validateInput(
      UpdateRecipeStatusSchema,
      input,
      'Invalid status input',
    );

    // Check if recipe exists first
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Recipe', id);
    }

    // Update the status
    const { error: updateError } = await this.supabase
      .from('recipes')
      .update({ status: validated.status })
      .eq('id', id);

    if (updateError) {
      BaseService.handleSupabaseError(updateError, 'RecipeService.updateStatus', { id });
    }

    // Return updated recipe
    return await this.getById(id);
  }

  /**
   * Get a recipe with its current version data
   *
   * @param id - Recipe ID
   * @returns Recipe with current version data
   * @throws {NotFoundError} If recipe does not exist
   * @throws {AppError} If database operation fails
   */
  async getWithVersion(id: RecipeId): Promise<RecipeWithVersion> {
    try {
      const recipe = await this.getById(id);

      // If no current version, return recipe with null version
      if (!recipe.current_version_id) {
        return {
          ...recipe,
          current_version: null,
        };
      }

      // Fetch the current version
      const { data: version, error: versionError } = await this.supabase
        .from('recipe_versions')
        .select('*')
        .eq('id', recipe.current_version_id)
        .single();

      if (versionError) throw versionError;

      return {
        ...recipe,
        current_version: version as unknown as RecipeVersion,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('RecipeService.getWithVersion failed:', error);
      throw new AppError('Failed to fetch recipe with version', 'FETCH_ERROR', 500, { id });
    }
  }

  /**
   * Revert a recipe to a previous version
   *
   * Creates a new version with the content from the target version.
   * This preserves the full version history - no data is lost.
   *
   * @param recipeId - Recipe ID
   * @param versionNumber - Version number to revert to
   * @param userId - User performing the revert
   * @returns Updated recipe with new current version
   * @throws {NotFoundError} If recipe or version does not exist
   * @throws {AppError} If database operation fails
   */
  async revertToVersion(
    recipeId: RecipeId,
    versionNumber: number,
    userId: UserId,
  ): Promise<Recipe> {
    try {
      // 1. Fetch the target version's content
      const targetVersion = await this.getVersion(recipeId, versionNumber);

      // 2. Get existing recipe for metadata
      const existing = await this.getById(recipeId);

      // 3. Create new version with old content via existing RPC

      const { error: rpcError } = await this.supabase.rpc('update_recipe_create_version', {
        p_recipe_id: recipeId,
        p_title: existing.title,
        p_description: existing.description ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p_ingredients_json: targetVersion.ingredients_json as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p_steps_json: targetVersion.steps_json as any,
        p_servings: targetVersion.servings ?? 0,
        p_prep_time_minutes: targetVersion.prep_time_minutes ?? 0,
        p_cook_time_minutes: targetVersion.cook_time_minutes ?? 0,
        p_notes: targetVersion.notes ?? '',
        p_user_id: userId,
      });

      if (rpcError) throw rpcError;

      // Return updated recipe
      return await this.getById(recipeId);
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('RecipeService.revertToVersion failed:', error);
      throw new AppError('Failed to revert to version', 'REVERT_ERROR', 500, {
        recipeId,
        versionNumber,
      });
    }
  }

  /**
   * Fork a recipe to create a copy with lineage tracking
   *
   * Uses database function fork_recipe which:
   * 1. Creates a new recipe with the same household
   * 2. Copies current version content (ingredients, steps, etc.)
   * 3. Records the fork relationship in recipe_forks table
   *
   * @param input - Fork input with parentRecipeId and newTitle
   * @param userId - User performing the fork
   * @returns Created forked recipe with its version
   * @throws {ValidationError} If input validation fails
   * @throws {NotFoundError} If parent recipe does not exist
   * @throws {AppError} If database operation fails
   */
  async fork(input: ForkRecipeInput, userId: UserId): Promise<RecipeWithVersion> {
    try {
      const validated = ForkRecipeInputSchema.parse(input);

      // Call database function for atomic fork operation
      const { data: forkedRecipeId, error: rpcError } = await this.supabase.rpc('fork_recipe', {
        p_parent_recipe_id: validated.parentRecipeId,
        p_new_title: validated.newTitle,
        p_user_id: userId,
      });

      if (rpcError) {
        // Check if it's a "not found" error from the database function
        if (rpcError.message?.includes('not found')) {
          throw new NotFoundError('Recipe', validated.parentRecipeId);
        }
        throw rpcError;
      }

      if (!forkedRecipeId) {
        throw new AppError('Failed to fork recipe - no ID returned', 'FORK_ERROR');
      }

      // Fetch and return the created recipe with its version
      return await this.getWithVersion(forkedRecipeId as RecipeId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid fork data', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('RecipeService.fork failed:', error);
      throw new AppError('Failed to fork recipe', 'FORK_ERROR', 500);
    }
  }

  /**
   * Get the primary image for a recipe
   *
   * @param recipeId - Recipe ID
   * @returns Primary image or null if none exists
   * @throws {AppError} If database operation fails
   */
  async getPrimaryImage(recipeId: RecipeId): Promise<RecipeImage | null> {
    try {
      const { data, error } = await this.supabase
        .from('recipe_images')
        .select('*')
        .eq('recipe_id', recipeId)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) throw error;

      return data as unknown as RecipeImage | null;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('RecipeService.getPrimaryImage failed:', error);
      throw new AppError('Failed to fetch primary image', 'FETCH_ERROR', 500, { recipeId });
    }
  }

  /**
   * Get primary images for multiple recipes in a single batch query
   *
   * Optimized for loading images for recipe lists/grids.
   * Uses a single database query with IN clause instead of N queries.
   *
   * @param recipeIds - Array of recipe IDs to fetch images for
   * @returns Map of recipe ID to primary RecipeImage (only recipes with images)
   * @throws {AppError} If database query fails
   */
  async getPrimaryImagesForRecipes(recipeIds: RecipeId[]): Promise<Map<RecipeId, RecipeImage>> {
    // Empty array optimization - no query needed
    if (recipeIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase
      .from('recipe_images')
      .select('*')
      .in('recipe_id', recipeIds)
      .eq('is_primary', true);

    if (error) {
      BaseService.handleSupabaseError(error, 'RecipeService.getPrimaryImagesForRecipes', {
        recipeIds,
      });
    }

    // Build Map for O(1) lookup by recipe ID
    const imageMap = new Map<RecipeId, RecipeImage>();
    (data || []).forEach((row) => {
      const image: RecipeImage = {
        id: row.id as RecipeImageId,
        recipe_id: row.recipe_id as RecipeId,
        storage_path: row.storage_path,
        alt_text: row.alt_text,
        display_order: row.display_order,
        is_primary: row.is_primary,
        is_public: row.is_public,
        width: row.width,
        height: row.height,
        file_size_bytes: row.file_size_bytes,
        created_by: row.created_by as UserId,
        created_at: new Date(row.created_at),
      };
      imageMap.set(image.recipe_id, image);
    });

    return imageMap;
  }

  /**
   * Get all unique tags from recipes in a household (Issue 4.3 - Tag Filter)
   * MIGRATED: Now uses normalized tags from TagService
   *
   * @param householdId - Household ID
   * @returns Array of unique tag names sorted alphabetically
   * @throws {AppError} If database operation fails
   */
  async getAllTags(householdId: HouseholdId): Promise<string[]> {
    try {
      const tags = await this.tagService.getHouseholdTags(householdId);
      return tags.map((t) => t.tag_name).sort();
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('RecipeService.getAllTags failed:', error);
      throw new AppError('Failed to fetch tags', 'FETCH_ERROR', 500, { householdId });
    }
  }

  /**
   * Get tags for the current version of a recipe
   *
   * @param recipeId - Recipe ID
   * @returns Array of tag names sorted alphabetically
   * @throws {NotFoundError} If recipe does not exist
   * @throws {AppError} If database operation fails
   */
  async getCurrentVersionTags(recipeId: RecipeId): Promise<string[]> {
    try {
      const recipe = await this.getById(recipeId);

      if (!recipe.current_version_id) {
        return [];
      }

      const tags = await this.tagService.getVersionTags(recipe.current_version_id);
      return tags.map((t) => t.name).sort();
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('RecipeService.getCurrentVersionTags failed:', error);
      throw new AppError('Failed to fetch recipe tags', 'FETCH_ERROR', 500, { recipeId });
    }
  }
}
