import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, Session } from '@supabase/supabase-js';

/**
 * Database test helper utilities
 *
 * Provides utilities for integration tests that need to interact with
 * a local Supabase instance.
 */

let testClient: SupabaseClient | null = null;

/**
 * Get or create test Supabase client
 * Uses local Supabase instance (supabase start)
 */
export function getTestClient(): SupabaseClient {
  if (!testClient) {
    const supabaseUrl = process.env.SUPABASE_TEST_URL || 'http://127.0.0.1:54321';
    const supabaseAnonKey =
      process.env.SUPABASE_TEST_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

    testClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return testClient;
}

/**
 * Reset database to clean state
 * Truncates all tables and resets sequences
 */
export async function resetDatabase(): Promise<void> {
  const client = getTestClient();

  // List of tables to truncate (in order to respect foreign key constraints)
  const tables = [
    'cooking_events',
    'calendar_entries',
    'recipe_versions',
    'recipes',
    'household_members',
    'households',
    'profiles',
  ];

  for (const table of tables) {
    const { error } = await client
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.warn(`Failed to truncate table ${table}:`, error);
      throw error;
    }
  }
}

/**
 * Seed database with test data
 */
export async function seedDatabase(data: {
  users?: unknown[];
  households?: unknown[];
  recipes?: unknown[];
}): Promise<void> {
  const client = getTestClient();

  // Seed households
  if (data.households && data.households.length > 0) {
    const { error } = await client.from('households').insert(data.households);
    if (error) throw error;
  }

  // Seed profiles (users)
  if (data.users && data.users.length > 0) {
    const { error } = await client.from('profiles').insert(data.users);
    if (error) throw error;
  }

  // Seed recipes
  if (data.recipes && data.recipes.length > 0) {
    const { error } = await client.from('recipes').insert(data.recipes);
    if (error) throw error;
  }
}

/**
 * Create test user with authentication
 * Returns user ID and auth session
 */
export async function createTestUser(credentials: {
  email: string;
  password: string;
  display_name: string;
}): Promise<{ userId: string; session: Session }> {
  const client = getTestClient();

  const { data, error } = await client.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        display_name: credentials.display_name,
      },
    },
  });

  if (error) throw error;
  if (!data.user || !data.session) {
    throw new Error('Failed to create test user');
  }

  return {
    userId: data.user.id,
    session: data.session,
  };
}

/**
 * Sign in as test user
 */
export async function signInTestUser(credentials: {
  email: string;
  password: string;
}): Promise<{ userId: string; session: Session }> {
  const client = getTestClient();

  const { data, error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
  if (!data.user || !data.session) {
    throw new Error('Failed to sign in test user');
  }

  return {
    userId: data.user.id,
    session: data.session,
  };
}

/**
 * Sign out current user
 */
export async function signOutTestUser(): Promise<void> {
  const client = getTestClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/**
 * Get authenticated client for a specific user session
 */
export function getAuthenticatedClient(accessToken: string): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_TEST_URL || 'http://127.0.0.1:54321';
  const supabaseAnonKey =
    process.env.SUPABASE_TEST_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  return client;
}

/**
 * Wait for async database operations to complete
 */
export async function waitForDatabase(ms = 100): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

/**
 * Check if local Supabase is running
 */
export async function isSupabaseRunning(): Promise<boolean> {
  try {
    const client = getTestClient();
    const { error } = await client.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Cleanup helper - call in afterAll hooks
 */
export async function cleanup(): Promise<void> {
  await signOutTestUser();
  testClient = null;
}
