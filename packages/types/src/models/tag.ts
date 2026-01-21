import type { Database } from '../database.types';

// Tag model types from database
export type Tag = Database['public']['Tables']['tags']['Row'];
export type TagInsert = Database['public']['Tables']['tags']['Insert'];
export type TagUpdate = Database['public']['Tables']['tags']['Update'];

// Recipe version tag association
export type RecipeVersionTag = Database['public']['Tables']['recipe_version_tags']['Row'];
export type RecipeVersionTagInsert = Database['public']['Tables']['recipe_version_tags']['Insert'];
export type RecipeVersionTagUpdate = Database['public']['Tables']['recipe_version_tags']['Update'];

// Tag with usage count (from get_household_tags function)
export type TagWithUsageCount =
  Database['public']['Functions']['get_household_tags']['Returns'][number];

// Brand types for IDs
export type TagId = string & { __brand: 'TagId' };
export type RecipeVersionId = string & { __brand: 'RecipeVersionId' };
export type HouseholdId = string & { __brand: 'HouseholdId' };
export type UserId = string & { __brand: 'UserId' };
