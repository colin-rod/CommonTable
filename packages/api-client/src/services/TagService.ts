import {
  CreateTagInputSchema,
  UpdateTagInputSchema,
  AddTagToVersionInputSchema,
  RemoveTagFromVersionInputSchema,
  ValidationError,
  NotFoundError,
  ConflictError,
  AppError,
} from '@commontable/types';
import type {
  CreateTagInput,
  UpdateTagInput,
  AddTagToVersionInput,
  RemoveTagFromVersionInput,
  TagId,
  RecipeVersionId,
  HouseholdId,
  UserId,
  Tag,
  RecipeVersionTag,
} from '@commontable/types';

// Temporary: Define TagWithUsageCount locally until types package exports correctly
interface TagWithUsageCount {
  tag_name: string;
  usage_count: number;
}

import { BaseService } from './BaseService';

/**
 * Service for managing normalized tags
 *
 * Handles all tag operations including:
 * - CRUD operations on tags table
 * - Tag associations with recipe versions
 * - Household tag queries with usage counts
 * - Atomic tag creation via database functions
 */
export class TagService extends BaseService {
  /**
   * Create a new tag
   *
   * @param input - Tag creation input (name will be normalized)
   * @returns Created tag
   * @throws {ValidationError} If input validation fails
   * @throws {AppError} If database operation fails
   */
  async create(input: CreateTagInput): Promise<Tag> {
    try {
      const validated = CreateTagInputSchema.parse(input);

      const { data, error } = await this.supabase
        .from('tags')
        .insert({
          household_id: await this.getCurrentHouseholdId(),
          name: validated.name, // Already normalized by schema
          created_by: await this.getCurrentUserId(),
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new AppError('Failed to create tag', 'CREATE_ERROR', 500);

      return data as unknown as Tag;
    } catch (error) {
      // Zod validation errors should be wrapped in ValidationError
      if (error && typeof error === 'object' && 'issues' in error) {
        const issues = error as { issues: Array<{ message: string }> };
        throw new ValidationError(issues.issues[0]?.message || 'Validation failed', { error });
      }

      if (error instanceof AppError) throw error;

      console.error('TagService.create failed:', error);
      throw new AppError('Failed to create tag', 'CREATE_ERROR', 500, { input });
    }
  }

  /**
   * Get tag by ID
   *
   * @param id - Tag ID
   * @returns Tag
   * @throws {NotFoundError} If tag does not exist
   * @throws {AppError} If database operation fails
   */
  async getById(id: TagId): Promise<Tag> {
    try {
      const { data, error } = await this.supabase.from('tags').select('*').eq('id', id).single();

      if (error) throw error;
      if (!data) throw new NotFoundError('Tag', id);

      return data as unknown as Tag;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('TagService.getById failed:', error);
      throw new AppError('Failed to fetch tag', 'FETCH_ERROR', 500, { id });
    }
  }

  /**
   * Get all tags for a household
   *
   * @param householdId - Household ID
   * @returns Array of tags
   * @throws {AppError} If database operation fails
   */
  async getByHousehold(householdId: HouseholdId): Promise<Tag[]> {
    try {
      const { data, error } = await this.supabase
        .from('tags')
        .select('*')
        .eq('household_id', householdId)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data as unknown as Tag[]) || [];
    } catch (error) {
      console.error('TagService.getByHousehold failed:', error);
      throw new AppError('Failed to fetch household tags', 'FETCH_ERROR', 500, { householdId });
    }
  }

  /**
   * Update a tag
   *
   * @param id - Tag ID
   * @param input - Update input
   * @returns Updated tag
   * @throws {NotFoundError} If tag does not exist
   * @throws {ValidationError} If input validation fails
   * @throws {AppError} If database operation fails
   */
  async update(id: TagId, input: UpdateTagInput): Promise<Tag> {
    try {
      const validated = UpdateTagInputSchema.parse(input);

      const { data, error } = await this.supabase
        .from('tags')
        .update({ name: validated.name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('Tag', id);

      return data as unknown as Tag;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof ValidationError) throw error;

      console.error('TagService.update failed:', error);
      throw new AppError('Failed to update tag', 'UPDATE_ERROR', 500, { id, input });
    }
  }

  /**
   * Delete a tag
   *
   * @param id - Tag ID
   * @throws {ConflictError} If tag is used by recipes
   * @throws {NotFoundError} If tag does not exist
   * @throws {AppError} If database operation fails
   */
  async delete(id: TagId): Promise<void> {
    try {
      // Check if tag is used
      const { count } = await this.supabase
        .from('recipe_version_tags')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', id);

      if (count && count > 0) {
        throw new ConflictError(`Cannot delete tag: used by ${count} recipe(s)`, { id, count });
      }

      const { error } = await this.supabase.from('tags').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('TagService.delete failed:', error);
      throw new AppError('Failed to delete tag', 'DELETE_ERROR', 500, { id });
    }
  }

  /**
   * Get or create tag atomically
   * Uses database function for thread-safe upsert
   *
   * @param name - Tag name (will be normalized)
   * @param householdId - Household ID
   * @param userId - User ID
   * @returns Tag (existing or newly created)
   * @throws {ValidationError} If name validation fails
   * @throws {AppError} If database operation fails
   */
  async getOrCreateTag(name: string, householdId: HouseholdId, userId: UserId): Promise<Tag> {
    try {
      const validated = CreateTagInputSchema.parse({ name });

      const { data: tagId, error } = await this.supabase.rpc('get_or_create_tag', {
        p_household_id: householdId,
        p_tag_name: validated.name,
        p_created_by: userId,
      });

      if (error) throw error;
      if (!tagId) throw new AppError('Failed to get or create tag', 'CREATE_ERROR', 500);

      return this.getById(tagId as TagId);
    } catch (error) {
      // Zod validation errors should be wrapped in ValidationError
      if (error && typeof error === 'object' && 'issues' in error) {
        const issues = error as { issues: Array<{ message: string }> };
        throw new ValidationError(issues.issues[0]?.message || 'Validation failed', { error });
      }

      if (error instanceof AppError) throw error;

      console.error('TagService.getOrCreateTag failed:', error);
      throw new AppError('Failed to get or create tag', 'CREATE_ERROR', 500, { name });
    }
  }

  /**
   * Associate tag with recipe version
   *
   * @param input - Association input
   * @returns Created association
   * @throws {ValidationError} If input validation fails
   * @throws {AppError} If database operation fails
   */
  async addTagToVersion(input: AddTagToVersionInput): Promise<RecipeVersionTag> {
    try {
      const validated = AddTagToVersionInputSchema.parse(input);

      // Get or create tag
      const tag = await this.getOrCreateTag(
        validated.tag_name,
        await this.getCurrentHouseholdId(),
        await this.getCurrentUserId(),
      );

      // Create association
      const { data, error } = await this.supabase
        .from('recipe_version_tags')
        .insert({
          recipe_version_id: validated.recipe_version_id,
          tag_id: tag.id,
          created_by: await this.getCurrentUserId(),
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate constraint
        if (error.code === '23505') {
          throw new ConflictError('Tag already associated with this version', {
            recipe_version_id: validated.recipe_version_id,
            tag_id: tag.id,
          });
        }
        throw error;
      }

      if (!data) throw new AppError('Failed to add tag to version', 'CREATE_ERROR', 500);

      return data as unknown as RecipeVersionTag;
    } catch (error) {
      // Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const issues = error as { issues: Array<{ message: string }> };
        throw new ValidationError(issues.issues[0]?.message || 'Validation failed', { error });
      }

      // Already wrapped errors - re-throw as-is
      if (error instanceof AppError) throw error;

      console.error('TagService.addTagToVersion failed:', error);
      throw new AppError('Failed to add tag to version', 'CREATE_ERROR', 500, { input });
    }
  }

  /**
   * Remove tag from recipe version
   *
   * @param input - Remove input
   * @throws {ValidationError} If input validation fails
   * @throws {AppError} If database operation fails
   */
  async removeTagFromVersion(input: RemoveTagFromVersionInput): Promise<void> {
    try {
      const validated = RemoveTagFromVersionInputSchema.parse(input);

      const { error } = await this.supabase
        .from('recipe_version_tags')
        .delete()
        .eq('recipe_version_id', validated.recipe_version_id)
        .eq('tag_id', validated.tag_id);

      if (error) throw error;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof ValidationError) throw error;

      console.error('TagService.removeTagFromVersion failed:', error);
      throw new AppError('Failed to remove tag from version', 'DELETE_ERROR', 500, { input });
    }
  }

  /**
   * Get all tags for a recipe version
   *
   * @param versionId - Recipe version ID
   * @returns Array of tags (sorted alphabetically)
   * @throws {AppError} If database operation fails
   */
  async getVersionTags(versionId: RecipeVersionId): Promise<Tag[]> {
    try {
      const { data, error } = await this.supabase
        .from('recipe_version_tags')
        .select('tag_id, tags(*)')
        .eq('recipe_version_id', versionId);

      if (error) throw error;

      const tags = (data || [])
        .map((row) => row.tags)
        .filter((tag) => tag !== null)
        .sort((a, b) => a.name.localeCompare(b.name));

      return tags as unknown as Tag[];
    } catch (error) {
      console.error('TagService.getVersionTags failed:', error);
      throw new AppError('Failed to fetch version tags', 'FETCH_ERROR', 500, { versionId });
    }
  }

  /**
   * Get household tags with usage counts
   * Uses database function for efficient aggregation
   *
   * @param householdId - Household ID
   * @returns Array of tags with usage counts
   * @throws {AppError} If database operation fails
   */
  async getHouseholdTags(householdId: HouseholdId): Promise<TagWithUsageCount[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_household_tags', {
        p_household_id: householdId,
      });

      if (error) throw error;

      return (data as TagWithUsageCount[]) || [];
    } catch (error) {
      console.error('TagService.getHouseholdTags failed:', error);
      throw new AppError('Failed to fetch household tags', 'FETCH_ERROR', 500, { householdId });
    }
  }

  /**
   * Search tags by name (case-insensitive)
   *
   * @param query - Search query
   * @param householdId - Household ID
   * @returns Array of matching tags
   * @throws {AppError} If database operation fails
   */
  async searchTags(query: string, householdId: HouseholdId): Promise<Tag[]> {
    try {
      const { data, error } = await this.supabase
        .from('tags')
        .select('*')
        .eq('household_id', householdId)
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data as unknown as Tag[]) || [];
    } catch (error) {
      console.error('TagService.searchTags failed:', error);
      throw new AppError('Failed to search tags', 'FETCH_ERROR', 500, { query, householdId });
    }
  }

  /**
   * Helper: Get current household ID from context
   * TODO: Replace with actual auth context
   */
  private async getCurrentHouseholdId(): Promise<HouseholdId> {
    // Placeholder - will be replaced with actual auth context
    return 'household-placeholder' as HouseholdId;
  }

  /**
   * Helper: Get current user ID from context
   * TODO: Replace with actual auth context
   */
  private async getCurrentUserId(): Promise<UserId> {
    // Placeholder - will be replaced with actual auth context
    return 'user-placeholder' as UserId;
  }
}
