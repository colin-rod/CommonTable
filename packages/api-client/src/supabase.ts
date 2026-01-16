import type { Database } from '@commontable/types';
import { createClient } from '@supabase/supabase-js';

import { getEnv } from './env';

// Client-side Supabase client (browser-safe)
// Uses publishable key with RLS enforcement
export function createSupabaseClient() {
  const env = getEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

// Server-side admin client (secret key)
// ONLY use in server contexts (API routes, server actions, Edge Functions)
// Bypasses RLS - use with caution
export function createSupabaseAdminClient() {
  const env = getEnv();

  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_SECRET_KEY is required for admin operations');
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
