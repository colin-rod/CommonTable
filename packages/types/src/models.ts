// Domain models

// Import recipe metadata enum types from schemas to avoid duplication
import type { MealSlot } from './schemas/calendar';
import type { CuisineType, MealType, RecipeStatus } from './schemas/recipe';

// Re-export to maintain backward compatibility
export type { CuisineType, MealType, RecipeStatus, MealSlot };

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
export type CalendarEntryCommentId = string & { __brand: 'CalendarEntryCommentId' };
export type MealRequestId = string & { __brand: 'MealRequestId' };
export type CookingEventId = string & { __brand: 'CookingEventId' };
export type QueueEntryId = string & { __brand: 'QueueEntryId' };

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
  // Metadata fields
  cuisine: CuisineType | null;
  meal_type: MealType | null;
  key_ingredients: string[];
  priority: number | null;
  status: RecipeStatus;
  // Import source (null for manually created recipes)
  source_url: string | null;
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

// Tag with usage count (from get_household_tags function)
export interface TagWithUsageCount {
  tag_name: string;
  usage_count: number;
}

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

// Calendar entry comment domain model (append-only)
export interface CalendarEntryComment {
  readonly id: CalendarEntryCommentId;
  readonly calendar_entry_id: CalendarEntryId;
  readonly household_id: HouseholdId;
  readonly comment_text: string;
  readonly created_by: UserId;
  readonly created_at: Date;
}

// Cooking event domain model (tracks when recipes are cooked + ratings)
export interface CookingEvent {
  readonly id: CookingEventId;
  readonly recipe_id: RecipeId;
  readonly recipe_version_id: RecipeVersionId;
  readonly household_id: HouseholdId;
  readonly cooked_at: Date;
  readonly servings_made: number | null;
  readonly rating: number | null; // 1-5 scale, nullable
  readonly notes: string | null;
  readonly cooked_by: UserId;
}

// Extended model with joined recipe data (for display in lists)
export interface CookingEventWithRecipe extends CookingEvent {
  recipe: Recipe;
}

// Extended model with recipe title and cooked_by member name (for household feed)
export interface CookingEventWithRecipeAndProfile extends CookingEvent {
  recipe_title: string;
  cooked_by_name: string;
}

// Recipe suggestion types (for AI Assist - Issue 8.3)

// Badge types for suggested recipes
export type SuggestionBadge = 'Favorite' | 'Top Rated' | 'New Recipe' | 'Try Again' | 'Classic';

// Context for generating recipe suggestions
export interface SuggestionContext {
  mealSlot?: MealSlot; // Optional meal slot context (breakfast, lunch, dinner, snack)
  plannedDate?: Date; // Optional planned date (for future seasonal tag matching)
}

// Weights for suggestion scoring algorithm
export interface SuggestionWeights {
  favoriteWeight: number; // Weight for is_favorite flag (default: 0.25)
  recencyWeight: number; // Weight for last_cooked_at recency (default: 0.15)
  ratingWeight: number; // Weight for rolling_score (default: 0.20)
  varietyWeight: number; // Weight for variety/rotation (default: 0.15)
  tagMatchWeight: number; // Weight for contextual tag matching (default: 0.25)
}

// Recipe suggestion result
export interface RecipeSuggestion {
  recipe: Recipe; // Full recipe object
  score: number; // Computed suggestion score (0.0 to 1.0+)
  badge: SuggestionBadge; // Badge to display ('Favorite', 'Top Rated', etc.)
  matchingTags: string[]; // Tags that matched the suggestion context
}
