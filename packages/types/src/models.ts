// Domain models

// Branded ID types
export type RecipeId = string & { __brand: 'RecipeId' };
export type RecipeImageId = string & { __brand: 'RecipeImageId' };
export type RecipeVersionId = string & { __brand: 'RecipeVersionId' };
export type UserId = string & { __brand: 'UserId' };
export type HouseholdId = string & { __brand: 'HouseholdId' };
export type ProfileId = string & { __brand: 'ProfileId' };
export type AuthUserId = string & { __brand: 'AuthUserId' };
export type InvitationId = string & { __brand: 'InvitationId' };

// Recipe domain models
export interface Recipe {
  id: RecipeId;
  household_id: HouseholdId;
  title: string;
  description: string | null;
  current_version_id: RecipeVersionId | null;
  rolling_score: number | null;
  tags: string[];
  last_cooked_at: Date | null;
  created_by: UserId;
  created_at: Date;
  updated_at: Date;
}

export interface RecipeImage {
  id: RecipeImageId;
  recipe_id: RecipeId;
  storage_path: string;
  display_order: number;
  is_primary: boolean;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  created_by: UserId;
  created_at: Date;
}

export interface RecipeVersion {
  id: RecipeVersionId;
  recipe_id: RecipeId;
  version_number: number;
  ingredients_json: IngredientInput[];
  steps_json: StepInput[];
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  notes: string | null;
  created_by: UserId;
  created_at: Date;
}

// Supporting types for recipe creation
export interface IngredientInput {
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
}

export interface StepInput {
  position: number;
  text: string;
}

// Search result type (extends Recipe with relevance rank)
export interface RecipeSearchResult extends Recipe {
  rank: number;
}
