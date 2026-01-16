import {
  type RecipeId,
  type HouseholdId,
  type Recipe,
  type RecipeVersion,
  type RecipeWithVersion,
  type RecipeImage,
  type RecipeSearchResult,
  type CreateRecipeInput,
  type UpdateRecipeInput,
  CreateRecipeInputSchema,
  UpdateRecipeInputSchema,
  RecipeSearchSchema,
  ValidationError,
  NotFoundError,
  AppError,
} from '@commontable/types';
import { z } from 'zod';

import { BaseService } from './BaseService';

/**
 * Version history entry returned by get_recipe_version_history database function
 */
interface VersionHistoryEntry {
  version_id: string;
  version_number: number;
  created_by: string;
  created_at: string;
  is_current: boolean;
}

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
  /**
   * Create a new recipe with its initial version
   *
   * Uses database function create_recipe_with_version for atomic transaction:
   * 1. Creates recipe record
   * 2. Creates initial version (version 1)
   * 3. Sets recipe.current_version_id to the new version
   *
   * @param input - Recipe creation input
   * @returns Created recipe
   * @throws {ValidationError} If input validation fails
   * @throws {AppError} If database operation fails
   */
  async create(input: CreateRecipeInput): Promise<Recipe> {
    try {
      const validated = CreateRecipeInputSchema.parse(input);

      // Call database function for atomic recipe + version creation
      // Note: Database function handles null values, but generated types are strict
      // Using type assertion to allow null values that the DB function accepts
      const { data: recipeId, error: rpcError } = await this.supabase.rpc(
        'create_recipe_with_version',
        {
          p_household_id: validated.household_id,
          p_title: validated.title,
          p_description: validated.description ?? '',
          p_ingredients_json: validated.ingredients_json,
          p_steps_json: validated.steps_json,
          p_servings: validated.servings ?? 0,
          p_prep_time_minutes: validated.prep_time_minutes ?? 0,
          p_cook_time_minutes: validated.cook_time_minutes ?? 0,
          p_notes: validated.notes ?? '',
          p_user_id: validated.user_id,
        },
      );

      if (rpcError) throw rpcError;
      if (!recipeId) {
        throw new AppError('Failed to create recipe - no ID returned', 'CREATE_ERROR');
      }

      // Fetch and return the created recipe
      return await this.getById(recipeId as RecipeId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid recipe data', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('RecipeService.create failed:', error);
      throw new AppError('Failed to create recipe', 'CREATE_ERROR', 500);
    }
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
    try {
      const { data, error } = await this.supabase.from('recipes').select('*').eq('id', id).single();

      if (error) throw error;
      if (!data) throw new NotFoundError('Recipe', id);

      return data as unknown as Recipe;
    } catch (error) {
      if (error instanceof AppError) throw error;

      // Check if it's a "not found" error from Supabase
      if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
        throw new NotFoundError('Recipe', id);
      }

      console.error('RecipeService.getById failed:', error);
      throw new AppError('Failed to fetch recipe', 'FETCH_ERROR', 500, { id });
    }
  }

  /**
   * Get all recipes for a household
   *
   * @param householdId - Household ID
   * @returns Array of recipes
   * @throws {AppError} If database operation fails
   */
  async getByHousehold(householdId: HouseholdId): Promise<Recipe[]> {
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .select('*')
        .eq('household_id', householdId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as unknown as Recipe[];
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('RecipeService.getByHousehold failed:', error);
      throw new AppError('Failed to fetch recipes', 'FETCH_ERROR', 500, { householdId });
    }
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
    try {
      const validated = UpdateRecipeInputSchema.parse(input);

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

        if (rpcError) throw rpcError;
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

          if (updateError) throw updateError;
        }
      }

      // Return updated recipe
      return await this.getById(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid update data', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('RecipeService.update failed:', error);
      throw new AppError('Failed to update recipe', 'UPDATE_ERROR', 500, { id });
    }
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
    try {
      // Check if recipe exists first
      await this.getById(id);

      const { error } = await this.supabase.from('recipes').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('RecipeService.delete failed:', error);
      throw new AppError('Failed to delete recipe', 'DELETE_ERROR', 500, { id });
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
    try {
      const validated = RecipeSearchSchema.parse({
        query,
        household_id: householdId,
        limit,
      });

      const { data, error } = await this.supabase.rpc('search_recipes', {
        p_query: validated.query,
        p_household_id: validated.household_id,
        p_limit: validated.limit,
      });

      if (error) throw error;

      return (data ?? []) as unknown as RecipeSearchResult[];
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid search parameters', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('RecipeService.search failed:', error);
      throw new AppError('Failed to search recipes', 'SEARCH_ERROR', 500);
    }
  }

  /**
   * Get version history for a recipe
   *
   * @param recipeId - Recipe ID
   * @returns Array of version history entries (newest first)
   * @throws {AppError} If database operation fails
   */
  async getVersionHistory(recipeId: RecipeId): Promise<VersionHistoryEntry[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_recipe_version_history', {
        p_recipe_id: recipeId,
      });

      if (error) throw error;

      return (data ?? []) as unknown as VersionHistoryEntry[];
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('RecipeService.getVersionHistory failed:', error);
      throw new AppError('Failed to fetch version history', 'FETCH_ERROR', 500, { recipeId });
    }
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
    try {
      const { data, error } = await this.supabase
        .from('recipe_versions')
        .select('*')
        .eq('recipe_id', recipeId)
        .eq('version_number', versionNumber)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('RecipeVersion', `${recipeId}:v${versionNumber}`);

      return data as unknown as RecipeVersion;
    } catch (error) {
      if (error instanceof AppError) throw error;

      // Check if it's a "not found" error from Supabase
      if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
        throw new NotFoundError('RecipeVersion', `${recipeId}:v${versionNumber}`);
      }

      console.error('RecipeService.getVersion failed:', error);
      throw new AppError('Failed to fetch recipe version', 'FETCH_ERROR', 500, {
        recipeId,
        versionNumber,
      });
    }
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
    try {
      // Get current recipe to check is_favorite status
      const existing = await this.getById(id);

      // Toggle the favorite status
      const { error: updateError } = await this.supabase
        .from('recipes')
        .update({ is_favorite: !existing.is_favorite })
        .eq('id', id);

      if (updateError) throw updateError;

      // Return updated recipe
      return await this.getById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('RecipeService.toggleFavorite failed:', error);
      throw new AppError('Failed to toggle favorite', 'UPDATE_ERROR', 500, { id });
    }
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
}
