import {
  CreateTagInputSchema,
  UpdateTagInputSchema,
  AddTagToVersionInputSchema,
  RemoveTagFromVersionInputSchema,
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
    const validated = BaseService.validateInput(CreateTagInputSchema, input, 'Invalid tag data');

    const { data, error } = await this.supabase
      .from('tags')
      .insert({
        household_id: await this.getCurrentHouseholdId(),
        name: validated.name, // Already normalized by schema
        created_by: await this.getCurrentUserId(),
      })
      .select()
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'TagService.create', { input });
    }
    if (!data) throw new AppError('Failed to create tag', 'CREATE_ERROR', 500);

    return data as unknown as Tag;
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
    const { data, error } = await this.supabase.from('tags').select('*').eq('id', id).single();

    if (error) {
      BaseService.handleSupabaseError(error, 'TagService.getById', { id });
    }
    if (!data) throw new NotFoundError('Tag', id);

    return data as unknown as Tag;
  }

  /**
   * Get all tags for a household
   *
   * @param householdId - Household ID
   * @returns Array of tags
   * @throws {AppError} If database operation fails
   */
  async getByHousehold(householdId: HouseholdId): Promise<Tag[]> {
    const { data, error } = await this.supabase
      .from('tags')
      .select('*')
      .eq('household_id', householdId)
      .order('name', { ascending: true });

    if (error) {
      BaseService.handleSupabaseError(error, 'TagService.getByHousehold', { householdId });
    }

    return (data as unknown as Tag[]) || [];
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
    const validated = BaseService.validateInput(UpdateTagInputSchema, input, 'Invalid tag update');

    const { data, error } = await this.supabase
      .from('tags')
      .update({ name: validated.name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'TagService.update', { id, input });
    }
    if (!data) throw new NotFoundError('Tag', id);

    return data as unknown as Tag;
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
    // Check if tag is used
    const { count } = await this.supabase
      .from('recipe_version_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', id);

    if (count && count > 0) {
      throw new ConflictError(`Cannot delete tag: used by ${count} recipe(s)`, { id, count });
    }

    const { error } = await this.supabase.from('tags').delete().eq('id', id);

    if (error) {
      BaseService.handleSupabaseError(error, 'TagService.delete', { id });
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
    const validated = BaseService.validateInput(CreateTagInputSchema, { name }, 'Invalid tag name');

    const { data: tagId, error } = await this.supabase.rpc('get_or_create_tag', {
      p_household_id: householdId,
      p_tag_name: validated.name,
      p_created_by: userId,
    });

    if (error) {
      BaseService.handleSupabaseError(error, 'TagService.getOrCreateTag', { name });
    }
    if (!tagId) throw new AppError('Failed to get or create tag', 'CREATE_ERROR', 500);

    return this.getById(tagId as TagId);
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
    const validated = BaseService.validateInput(
      AddTagToVersionInputSchema,
      input,
      'Invalid tag association',
    );

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
      BaseService.handleSupabaseError(error, 'TagService.addTagToVersion', { input });
    }

    if (!data) throw new AppError('Failed to add tag to version', 'CREATE_ERROR', 500);

    return data as unknown as RecipeVersionTag;
  }

  /**
   * Remove tag from recipe version
   *
   * @param input - Remove input
   * @throws {ValidationError} If input validation fails
   * @throws {AppError} If database operation fails
   */
  async removeTagFromVersion(input: RemoveTagFromVersionInput): Promise<void> {
    const validated = BaseService.validateInput(
      RemoveTagFromVersionInputSchema,
      input,
      'Invalid tag removal',
    );

    const { error } = await this.supabase
      .from('recipe_version_tags')
      .delete()
      .eq('recipe_version_id', validated.recipe_version_id)
      .eq('tag_id', validated.tag_id);

    if (error) {
      BaseService.handleSupabaseError(error, 'TagService.removeTagFromVersion', { input });
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
    const { data, error } = await this.supabase
      .from('recipe_version_tags')
      .select('tag_id, tags(*)')
      .eq('recipe_version_id', versionId);

    if (error) {
      BaseService.handleSupabaseError(error, 'TagService.getVersionTags', { versionId });
    }

    const tags = (data || [])
      .map((row) => row.tags)
      .filter((tag) => tag !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    return tags as unknown as Tag[];
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
    const { data, error } = await this.supabase.rpc('get_household_tags', {
      p_household_id: householdId,
    });

    if (error) {
      BaseService.handleSupabaseError(error, 'TagService.getHouseholdTags', { householdId });
    }

    return (data as TagWithUsageCount[]) || [];
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
    const { data, error } = await this.supabase
      .from('tags')
      .select('*')
      .eq('household_id', householdId)
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true });

    if (error) {
      BaseService.handleSupabaseError(error, 'TagService.searchTags', { query, householdId });
    }

    return (data as unknown as Tag[]) || [];
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
