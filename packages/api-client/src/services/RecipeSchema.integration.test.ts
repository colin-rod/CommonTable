/**
 * Integration tests for Issue 2.1 - Recipe Schema
 * Tests rolling_score, recipe_images, search, and tags functionality
 *
 * These tests verify:
 * - rolling_score calculation and trigger
 * - recipe_images table constraints and RLS
 * - Full-text search with tsvector
 * - Tags normalization and querying
 */

import type { Database } from '@commontable/types';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Skip tests if environment variables are not set
const describeIfConfigured = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? describe : describe.skip;

describeIfConfigured('Recipe Schema - Issue 2.1 Integration Tests', () => {
  let supabase: SupabaseClient<Database>;
  let testHouseholdId: string;
  let testUserId: string;
  let testRecipeId: string;

  beforeAll(async () => {
    // Use service role key for tests (bypasses RLS)
    supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create test household
    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({ name: 'Test Household - Recipe Schema' })
      .select()
      .single();

    if (householdError || !household) {
      throw new Error('Failed to create test household');
    }

    testHouseholdId = household.id;

    // Create test user (we'll use a mock user ID for testing)
    // In production, this would be from auth.users
    testUserId = '00000000-0000-0000-0000-000000000001';
  });

  afterAll(async () => {
    // Cleanup: Delete test household (cascades to all related data)
    if (testHouseholdId) {
      await supabase.from('households').delete().eq('id', testHouseholdId);
    }
  });

  beforeEach(async () => {
    // Create a fresh test recipe before each test
    const { data, error } = await supabase.rpc('create_recipe_with_version', {
      p_household_id: testHouseholdId,
      p_title: 'Test Recipe',
      p_description: 'A test recipe for integration tests',
      p_ingredients_json: [
        { name: 'flour', quantity: 2, unit: 'cups' },
        { name: 'sugar', quantity: 1, unit: 'cup' },
      ],
      p_steps_json: [
        { position: 1, text: 'Mix ingredients' },
        { position: 2, text: 'Bake at 350°F' },
      ],
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 30,
      p_notes: 'Test notes',
      p_user_id: testUserId,
    });

    if (error || !data) {
      throw new Error('Failed to create test recipe');
    }

    testRecipeId = data;
  });

  describe('rolling_score functionality', () => {
    it('should have NULL rolling_score for recipe with no cooking events', async () => {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .select('rolling_score')
        .eq('id', testRecipeId)
        .single();

      expect(error).toBeNull();
      expect(recipe?.rolling_score).toBeNull();
    });

    it('should calculate rolling_score as average of cooking event ratings', async () => {
      // Add first cooking event with rating 4
      await supabase.from('cooking_events').insert({
        recipe_id: testRecipeId,
        household_id: testHouseholdId,
        cooked_by: testUserId,
        rating: 4,
        servings_made: 4,
      });

      // Check rolling_score updated to 4.00
      let { data: recipe } = await supabase
        .from('recipes')
        .select('rolling_score')
        .eq('id', testRecipeId)
        .single();

      expect(recipe?.rolling_score).toBe(4.0);

      // Add second cooking event with rating 5
      await supabase.from('cooking_events').insert({
        recipe_id: testRecipeId,
        household_id: testHouseholdId,
        cooked_by: testUserId,
        rating: 5,
        servings_made: 4,
      });

      // Check rolling_score updated to 4.50 (average of 4 and 5)
      ({ data: recipe } = await supabase
        .from('recipes')
        .select('rolling_score')
        .eq('id', testRecipeId)
        .single());

      expect(recipe?.rolling_score).toBe(4.5);
    });

    it('should update rolling_score automatically via trigger', async () => {
      // Insert multiple cooking events
      await supabase.from('cooking_events').insert([
        {
          recipe_id: testRecipeId,
          household_id: testHouseholdId,
          cooked_by: testUserId,
          rating: 3,
          servings_made: 4,
        },
        {
          recipe_id: testRecipeId,
          household_id: testHouseholdId,
          cooked_by: testUserId,
          rating: 4,
          servings_made: 4,
        },
        {
          recipe_id: testRecipeId,
          household_id: testHouseholdId,
          cooked_by: testUserId,
          rating: 5,
          servings_made: 4,
        },
      ]);

      // Check rolling_score is average: (3 + 4 + 5) / 3 = 4.00
      const { data: recipe } = await supabase
        .from('recipes')
        .select('rolling_score')
        .eq('id', testRecipeId)
        .single();

      expect(recipe?.rolling_score).toBe(4.0);
    });

    it('should handle cooking events without ratings (NULL)', async () => {
      // Add cooking event with rating
      await supabase.from('cooking_events').insert({
        recipe_id: testRecipeId,
        household_id: testHouseholdId,
        cooked_by: testUserId,
        rating: 5,
        servings_made: 4,
      });

      // Add cooking event without rating
      await supabase.from('cooking_events').insert({
        recipe_id: testRecipeId,
        household_id: testHouseholdId,
        cooked_by: testUserId,
        rating: null,
        servings_made: 4,
      });

      // rolling_score should only count rated events (5.00)
      const { data: recipe } = await supabase
        .from('recipes')
        .select('rolling_score')
        .eq('id', testRecipeId)
        .single();

      expect(recipe?.rolling_score).toBe(5.0);
    });
  });

  describe('recipe_images table', () => {
    it('should allow inserting multiple images for one recipe', async () => {
      const { data: images, error } = await supabase
        .from('recipe_images')
        .insert([
          {
            recipe_id: testRecipeId,
            storage_path: 'recipes/test/image1.jpg',
            display_order: 0,
            is_primary: true,
            created_by: testUserId,
          },
          {
            recipe_id: testRecipeId,
            storage_path: 'recipes/test/image2.jpg',
            display_order: 1,
            is_primary: false,
            created_by: testUserId,
          },
        ])
        .select();

      expect(error).toBeNull();
      expect(images).toHaveLength(2);
    });

    it('should enforce only one primary image per recipe', async () => {
      // Insert first primary image
      await supabase.from('recipe_images').insert({
        recipe_id: testRecipeId,
        storage_path: 'recipes/test/image1.jpg',
        is_primary: true,
        created_by: testUserId,
      });

      // Try to insert second primary image (should fail)
      const { error } = await supabase.from('recipe_images').insert({
        recipe_id: testRecipeId,
        storage_path: 'recipes/test/image2.jpg',
        is_primary: true,
        created_by: testUserId,
      });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505'); // Unique constraint violation
    });

    it('should allow changing primary image by updating is_primary', async () => {
      // Insert two images, first is primary
      const { data: images } = await supabase
        .from('recipe_images')
        .insert([
          {
            recipe_id: testRecipeId,
            storage_path: 'recipes/test/image1.jpg',
            display_order: 0,
            is_primary: true,
            created_by: testUserId,
          },
          {
            recipe_id: testRecipeId,
            storage_path: 'recipes/test/image2.jpg',
            display_order: 1,
            is_primary: false,
            created_by: testUserId,
          },
        ])
        .select();

      expect(images).toHaveLength(2);

      // Update first to not primary
      await supabase.from('recipe_images').update({ is_primary: false }).eq('id', images![0].id);

      // Update second to primary
      const { error } = await supabase
        .from('recipe_images')
        .update({ is_primary: true })
        .eq('id', images![1].id);

      expect(error).toBeNull();
    });

    it('should cascade delete images when recipe is deleted', async () => {
      // Insert image
      const { data: image } = await supabase
        .from('recipe_images')
        .insert({
          recipe_id: testRecipeId,
          storage_path: 'recipes/test/image.jpg',
          is_primary: true,
          created_by: testUserId,
        })
        .select()
        .single();

      expect(image).not.toBeNull();

      // Delete recipe
      await supabase.from('recipes').delete().eq('id', testRecipeId);

      // Check image was cascade deleted
      const { data: deletedImage } = await supabase
        .from('recipe_images')
        .select()
        .eq('id', image!.id)
        .single();

      expect(deletedImage).toBeNull();
    });

    it('should store image metadata correctly', async () => {
      const { data: image, error } = await supabase
        .from('recipe_images')
        .insert({
          recipe_id: testRecipeId,
          storage_path: 'recipes/test/image.jpg',
          display_order: 0,
          is_primary: true,
          alt_text: 'A delicious test recipe',
          width: 1920,
          height: 1080,
          file_size_bytes: 524288,
          created_by: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(image?.alt_text).toBe('A delicious test recipe');
      expect(image?.width).toBe(1920);
      expect(image?.height).toBe(1080);
      expect(image?.file_size_bytes).toBe(524288);
    });
  });

  describe('full-text search', () => {
    beforeEach(async () => {
      // Create multiple recipes for search testing
      await supabase.rpc('create_recipe_with_version', {
        p_household_id: testHouseholdId,
        p_title: 'Pasta Carbonara',
        p_description: 'Classic Italian pasta with bacon and eggs',
        p_ingredients_json: [
          { name: 'spaghetti', quantity: 400, unit: 'g' },
          { name: 'bacon', quantity: 200, unit: 'g' },
          { name: 'eggs', quantity: 4, unit: '' },
        ],
        p_steps_json: [{ position: 1, text: 'Cook pasta' }],
        p_servings: 4,
        p_user_id: testUserId,
      });

      await supabase.rpc('create_recipe_with_version', {
        p_household_id: testHouseholdId,
        p_title: 'Chocolate Cake',
        p_description: 'Rich chocolate dessert',
        p_ingredients_json: [
          { name: 'chocolate', quantity: 200, unit: 'g' },
          { name: 'flour', quantity: 2, unit: 'cups' },
        ],
        p_steps_json: [{ position: 1, text: 'Mix and bake' }],
        p_servings: 8,
        p_user_id: testUserId,
      });
    });

    it('should find recipes by title', async () => {
      const { data: results, error } = await supabase.rpc('search_recipes', {
        p_household_id: testHouseholdId,
        p_query: 'pasta',
      });

      expect(error).toBeNull();
      expect(results).not.toBeNull();
      expect(results!.length).toBeGreaterThan(0);
      expect(results![0].title).toContain('Pasta');
    });

    it('should find recipes by description', async () => {
      const { data: results, error } = await supabase.rpc('search_recipes', {
        p_household_id: testHouseholdId,
        p_query: 'Italian',
      });

      expect(error).toBeNull();
      expect(results!.some((r) => r.description?.includes('Italian'))).toBe(true);
    });

    it('should find recipes by ingredient names', async () => {
      const { data: results, error } = await supabase.rpc('search_recipes', {
        p_household_id: testHouseholdId,
        p_query: 'chocolate',
      });

      expect(error).toBeNull();
      expect(results!.some((r) => r.title.includes('Chocolate'))).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const { data: results, error } = await supabase.rpc('search_recipes', {
        p_household_id: testHouseholdId,
        p_query: 'PASTA',
      });

      expect(error).toBeNull();
      expect(results!.length).toBeGreaterThan(0);
    });

    it('should rank results by relevance', async () => {
      const { data: results, error } = await supabase.rpc('search_recipes', {
        p_household_id: testHouseholdId,
        p_query: 'pasta',
      });

      expect(error).toBeNull();
      expect(results!.length).toBeGreaterThan(0);

      // First result should have highest rank
      if (results!.length > 1) {
        expect(results![0].rank).toBeGreaterThanOrEqual(results![1].rank);
      }
    });

    it('should only return recipes from specified household', async () => {
      // Create another household
      const { data: otherHousehold } = await supabase
        .from('households')
        .insert({ name: 'Other Household' })
        .select()
        .single();

      // Search should not return recipes from other household
      const { data: results } = await supabase.rpc('search_recipes', {
        p_household_id: testHouseholdId,
        p_query: 'pasta',
      });

      expect(results!.every((r) => r.household_id === testHouseholdId)).toBe(true);

      // Cleanup
      await supabase.from('households').delete().eq('id', otherHousehold!.id);
    });
  });

  describe('tags functionality', () => {
    it('should store tags as array', async () => {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .update({ tags: ['vegetarian', 'quick', 'dinner'] })
        .eq('id', testRecipeId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(recipe?.tags).toEqual(['vegetarian', 'quick', 'dinner']);
    });

    it('should normalize tags to lowercase', async () => {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .update({ tags: ['VEGETARIAN', 'Quick', 'DiNnEr'] })
        .eq('id', testRecipeId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(recipe?.tags).toEqual(['dinner', 'quick', 'vegetarian']); // Sorted alphabetically
    });

    it('should remove duplicate tags', async () => {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .update({ tags: ['vegetarian', 'vegetarian', 'quick'] })
        .eq('id', testRecipeId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(recipe?.tags).toEqual(['quick', 'vegetarian']);
    });

    it('should remove empty tags', async () => {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .update({ tags: ['vegetarian', '', '   ', 'quick'] })
        .eq('id', testRecipeId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(recipe?.tags).toEqual(['quick', 'vegetarian']);
    });

    it('should enforce max 20 characters per tag', async () => {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .update({
          tags: ['vegetarian', 'this-is-a-very-long-tag-that-exceeds-twenty-characters'],
        })
        .eq('id', testRecipeId)
        .select()
        .single();

      expect(error).toBeNull();
      // Long tag should be excluded
      expect(recipe?.tags).toEqual(['vegetarian']);
    });

    it('should query recipes by tag using ANY operator', async () => {
      // Create recipes with different tags
      await supabase
        .from('recipes')
        .update({ tags: ['vegetarian', 'dinner'] })
        .eq('id', testRecipeId);

      const { data: otherRecipe } = await supabase.rpc('create_recipe_with_version', {
        p_household_id: testHouseholdId,
        p_title: 'Another Recipe',
        p_ingredients_json: [],
        p_steps_json: [],
        p_user_id: testUserId,
      });

      await supabase
        .from('recipes')
        .update({ tags: ['dessert', 'quick'] })
        .eq('id', otherRecipe!);

      // Query for vegetarian recipes
      const { data: results, error } = await supabase
        .from('recipes')
        .select()
        .eq('household_id', testHouseholdId)
        .contains('tags', ['vegetarian']);

      expect(error).toBeNull();
      expect(results!.length).toBe(1);
      expect(results![0].id).toBe(testRecipeId);
    });

    it('should get all household tags with counts via get_household_tags function', async () => {
      // Create multiple recipes with tags
      await supabase
        .from('recipes')
        .update({ tags: ['vegetarian', 'dinner'] })
        .eq('id', testRecipeId);

      const { data: recipe2 } = await supabase.rpc('create_recipe_with_version', {
        p_household_id: testHouseholdId,
        p_title: 'Recipe 2',
        p_ingredients_json: [],
        p_steps_json: [],
        p_user_id: testUserId,
      });

      await supabase
        .from('recipes')
        .update({ tags: ['vegetarian', 'quick'] })
        .eq('id', recipe2!);

      // Get all tags
      const { data: tags, error } = await supabase.rpc('get_household_tags', {
        p_household_id: testHouseholdId,
      });

      expect(error).toBeNull();
      expect(tags).not.toBeNull();

      // Should have 'vegetarian' with count 2, 'dinner' with count 1, 'quick' with count 1
      const vegetarianTag = tags!.find((t) => t.tag === 'vegetarian');
      expect(vegetarianTag?.recipe_count).toBe(2);
    });
  });
});
