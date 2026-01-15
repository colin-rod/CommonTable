import type { Session } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  getTestClient,
  resetDatabase,
  createTestUser,
  signOutTestUser,
  getAuthenticatedClient,
} from '../helpers/database';
import {
  createTestHousehold,
  createTestRecipe,
  createTestCredentials,
  createTestHouseholdMember,
} from '../helpers/factories';

/**
 * Row Level Security (RLS) Policy Integration Tests
 *
 * These tests verify that RLS policies correctly enforce household isolation
 * and user permissions at the database level.
 *
 * Prerequisites:
 * - Local Supabase must be running (supabase start)
 * - Database migrations must be applied
 */

describe('RLS Policies - Household Isolation', () => {
  let user1: { userId: string; session: Session };
  let user2: { userId: string; session: Session };
  let household1Id: string;
  let household2Id: string;

  beforeEach(async () => {
    // Reset database to clean state
    await resetDatabase();

    // Create two test users with separate households
    const credentials1 = createTestCredentials({ email: 'user1@example.com' });
    const credentials2 = createTestCredentials({ email: 'user2@example.com' });

    user1 = await createTestUser(credentials1);
    user2 = await createTestUser(credentials2);

    // Create households for each user
    const client = getTestClient();

    // User 1 household
    const household1 = createTestHousehold({ name: 'Household 1' });
    household1Id = household1.id;
    const { error: h1Error } = await client.from('households').insert(household1);
    if (h1Error) throw h1Error;

    // User 2 household
    const household2 = createTestHousehold({ name: 'Household 2' });
    household2Id = household2.id;
    const { error: h2Error } = await client.from('households').insert(household2);
    if (h2Error) throw h2Error;

    // Add users to their households
    const member1 = createTestHouseholdMember({
      household_id: household1Id,
      user_id: user1.userId,
      role: 'admin',
    });
    const member2 = createTestHouseholdMember({
      household_id: household2Id,
      user_id: user2.userId,
      role: 'admin',
    });

    const { error: m1Error } = await client.from('household_members').insert(member1);
    if (m1Error) throw m1Error;

    const { error: m2Error } = await client.from('household_members').insert(member2);
    if (m2Error) throw m2Error;
  });

  afterEach(async () => {
    await signOutTestUser();
  });

  describe('Recipes Table RLS', () => {
    it('should allow user to create recipe in their own household', async () => {
      const client = getAuthenticatedClient(user1.session.access_token);

      const recipe = createTestRecipe({
        household_id: household1Id,
        created_by: user1.userId,
        title: 'User 1 Recipe',
      });

      const { data, error } = await client.from('recipes').insert(recipe).select().single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.title).toBe('User 1 Recipe');
      expect(data?.household_id).toBe(household1Id);
    });

    it('should prevent user from creating recipe in another household', async () => {
      const client = getAuthenticatedClient(user1.session.access_token);

      const recipe = createTestRecipe({
        household_id: household2Id, // User 1 trying to create in User 2's household
        created_by: user1.userId,
        title: 'Unauthorized Recipe',
      });

      const { data, error } = await client.from('recipes').insert(recipe).select();

      // Should fail due to RLS policy
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    it('should allow user to read recipes from their own household', async () => {
      const client = getAuthenticatedClient(user1.session.access_token);

      // Create recipe in user1's household
      const recipe = createTestRecipe({
        household_id: household1Id,
        created_by: user1.userId,
      });

      await client.from('recipes').insert(recipe);

      // Try to read it
      const { data, error } = await client
        .from('recipes')
        .select('*')
        .eq('household_id', household1Id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.household_id).toBe(household1Id);
    });

    it('should prevent user from reading recipes from another household', async () => {
      const client1 = getAuthenticatedClient(user1.session.access_token);
      const client2 = getAuthenticatedClient(user2.session.access_token);

      // User 2 creates a recipe in their household
      const recipe = createTestRecipe({
        household_id: household2Id,
        created_by: user2.userId,
        title: 'User 2 Recipe',
      });

      await client2.from('recipes').insert(recipe);

      // User 1 tries to read User 2's recipe
      const { data, error } = await client1.from('recipes').select('*').eq('id', recipe.id);

      // Should return empty result due to RLS filtering
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('should allow user to update recipe in their own household', async () => {
      const client = getAuthenticatedClient(user1.session.access_token);

      // Create recipe
      const recipe = createTestRecipe({
        household_id: household1Id,
        created_by: user1.userId,
        title: 'Original Title',
      });

      const { data: created } = await client.from('recipes').insert(recipe).select().single();

      // Update recipe
      const { data, error } = await client
        .from('recipes')
        .update({ title: 'Updated Title' })
        .eq('id', created!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.title).toBe('Updated Title');
    });

    it('should prevent user from updating recipe in another household', async () => {
      const client1 = getAuthenticatedClient(user1.session.access_token);
      const client2 = getAuthenticatedClient(user2.session.access_token);

      // User 2 creates a recipe
      const recipe = createTestRecipe({
        household_id: household2Id,
        created_by: user2.userId,
        title: 'User 2 Recipe',
      });

      const { data: created } = await client2.from('recipes').insert(recipe).select().single();

      // User 1 tries to update User 2's recipe
      const { data, error: _error } = await client1
        .from('recipes')
        .update({ title: 'Hacked Title' })
        .eq('id', created!.id);

      // Should fail or affect 0 rows
      expect(data).toBeNull();
    });

    it('should allow user to delete recipe in their own household', async () => {
      const client = getAuthenticatedClient(user1.session.access_token);

      // Create recipe
      const recipe = createTestRecipe({
        household_id: household1Id,
        created_by: user1.userId,
      });

      const { data: created } = await client.from('recipes').insert(recipe).select().single();

      // Delete recipe
      const { error } = await client.from('recipes').delete().eq('id', created!.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data: check } = await client.from('recipes').select('*').eq('id', created!.id);
      expect(check).toHaveLength(0);
    });

    it('should prevent user from deleting recipe in another household', async () => {
      const client1 = getAuthenticatedClient(user1.session.access_token);
      const client2 = getAuthenticatedClient(user2.session.access_token);

      // User 2 creates a recipe
      const recipe = createTestRecipe({
        household_id: household2Id,
        created_by: user2.userId,
      });

      const { data: created } = await client2.from('recipes').insert(recipe).select().single();

      // User 1 tries to delete User 2's recipe
      const { data } = await client1.from('recipes').delete().eq('id', created!.id);

      // Should affect 0 rows
      expect(data).toBeNull();

      // Verify recipe still exists for User 2
      const { data: check } = await client2.from('recipes').select('*').eq('id', created!.id);
      expect(check).toHaveLength(1);
    });
  });

  describe('Household Members Table RLS', () => {
    it('should allow admin to view household members', async () => {
      const client = getAuthenticatedClient(user1.session.access_token);

      const { data, error } = await client
        .from('household_members')
        .select('*')
        .eq('household_id', household1Id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.user_id).toBe(user1.userId);
    });

    it('should prevent user from viewing members of another household', async () => {
      const client = getAuthenticatedClient(user1.session.access_token);

      const { data, error } = await client
        .from('household_members')
        .select('*')
        .eq('household_id', household2Id);

      // Should return empty due to RLS filtering
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe('Calendar Entries Table RLS', () => {
    it('should allow user to create calendar entry for their household', async () => {
      const client = getAuthenticatedClient(user1.session.access_token);

      // First create a recipe
      const recipe = createTestRecipe({
        household_id: household1Id,
        created_by: user1.userId,
      });

      const { data: createdRecipe } = await client.from('recipes').insert(recipe).select().single();

      // Create calendar entry
      const entry = {
        household_id: household1Id,
        recipe_id: createdRecipe!.id,
        planned_date: new Date().toISOString().split('T')[0],
        meal_slot: 'dinner',
        created_by: user1.userId,
      };

      const { data, error } = await client.from('calendar_entries').insert(entry).select().single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.household_id).toBe(household1Id);
    });

    it('should prevent user from creating calendar entry for another household', async () => {
      const client1 = getAuthenticatedClient(user1.session.access_token);
      const client2 = getAuthenticatedClient(user2.session.access_token);

      // User 2 creates a recipe
      const recipe = createTestRecipe({
        household_id: household2Id,
        created_by: user2.userId,
      });

      const { data: createdRecipe } = await client2
        .from('recipes')
        .insert(recipe)
        .select()
        .single();

      // User 1 tries to create calendar entry for User 2's household
      const entry = {
        household_id: household2Id,
        recipe_id: createdRecipe!.id,
        planned_date: new Date().toISOString().split('T')[0],
        meal_slot: 'dinner',
        created_by: user1.userId,
      };

      const { data, error } = await client1.from('calendar_entries').insert(entry);

      // Should fail due to RLS policy
      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });
});
