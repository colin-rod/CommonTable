import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@commontable/types';

// Base service class for all data access services
// Provides common functionality and patterns

export abstract class BaseService {
  constructor(protected supabase: SupabaseClient<Database>) {}
}
