import type { Database } from '@commontable/types';
import { createBrowserClient } from '@supabase/ssr';

// Browser-safe Supabase client
// Uses NEXT_PUBLIC_* variables only (anon key, RLS enforced)
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      return new Proxy(
        {},
        {
          get() {
            throw new Error('Missing public Supabase environment variables');
          },
        },
      ) as ReturnType<typeof createBrowserClient<Database>>;
    }

    throw new Error('Missing public Supabase environment variables');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
