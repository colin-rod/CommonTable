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
export type TagId = string & { __brand: 'TagId' };
export type RecipeVersionTagId = string & { __brand: 'RecipeVersionTagId' };
export type AiTagSuggestionId = string & { __brand: 'AiTagSuggestionId' };
export type CalendarEntryId = string & { __brand: 'CalendarEntryId' };
export type MealRequestId = string & { __brand: 'MealRequestId' };

// Recipe domain models
export interface Recipe {
  id: RecipeId;
  household_id: HouseholdId;
  title: string;
  description: string | null;
  current_version_id: RecipeVersionId | null;
  rolling_score: number | null;
  tags: string[];
  is_favorite: boolean;
  last_cooked_at: Date | null;
  created_by: UserId;
  created_at: Date;
  updated_at: Date;
}

// Recipe with its current version data (for detail view)
export interface RecipeWithVersion extends Recipe {
  current_version: RecipeVersion | null;
}

export interface RecipeImage {
  id: RecipeImageId;
  recipe_id: RecipeId;
  storage_path: string;
  display_order: number;
  is_primary: boolean;
  is_public: boolean;
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

  // Optional joined data
  tags?: RecipeVersionTagWithName[];
  ai_tag_suggestions?: AiTagSuggestionWithTag[];
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

// Sort options for recipe list
export type SortOption = 'last-cooked' | 'recent' | 'alphabetical' | 'favorites' | 'rating';

// Version history entry returned by get_recipe_version_history database function
export interface VersionHistoryEntry {
  readonly version_id: RecipeVersionId;
  readonly version_number: number;
  readonly created_by: UserId;
  readonly created_by_name: string | null;
  readonly created_at: Date;
  readonly is_current: boolean;
}

// Tag domain models
export interface Tag {
  id: TagId;
  household_id: HouseholdId;
  name: string;
  created_by: UserId;
  created_at: Date;
  updated_at: Date;
}

export interface RecipeVersionTag {
  id: RecipeVersionTagId;
  recipe_version_id: RecipeVersionId;
  tag_id: TagId;
  created_by: UserId;
  created_at: Date;
}

export interface AiTagSuggestion {
  id: AiTagSuggestionId;
  recipe_version_id: RecipeVersionId;
  tag_id: TagId;
  confidence_score: number; // 0.00 to 1.00
  user_accepted: boolean | null; // null = pending, true = accepted, false = rejected
  accepted_at: Date | null;
  model_version: string;
  created_at: Date;
}

// Joined type for querying version tags with tag names
export interface RecipeVersionTagWithName extends RecipeVersionTag {
  tag: Tag;
}

// Type for AI suggestion with tag details
export interface AiTagSuggestionWithTag extends AiTagSuggestion {
  tag: Tag;
}

// Meal slot type (shared by calendar_entries and meal_requests)
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Calendar entry status lifecycle
export type CalendarEntryStatus = 'planned' | 'confirmed' | 'completed' | 'cancelled';

// Calendar entry domain model
export interface CalendarEntry {
  id: CalendarEntryId;
  household_id: HouseholdId;
  recipe_id: RecipeId | null;
  planned_date: Date;
  meal_slot: MealSlot;
  status: CalendarEntryStatus;
  notes: string | null;
  created_by: UserId;
  created_at: Date;
  updated_at: Date;
}

// Meal request status lifecycle
export type MealRequestStatus = 'open' | 'planned' | 'dismissed';

// Meal request domain model
export interface MealRequest {
  id: MealRequestId;
  household_id: HouseholdId;
  recipe_id: RecipeId | null;
  requested_by: UserId;
  requested_date: Date;
  requested_meal_slot: MealSlot;
  notes: string | null;
  status: MealRequestStatus;
  priority: number;
  created_at: Date;
  updated_at: Date;
}
