import {
  AppError,
  type HouseholdId,
  type Recipe,
  type RecipeId,
  type RecipeSuggestion,
  type SuggestionBadge,
  type SuggestionContext,
  type SuggestionWeights,
  type MealSlot,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Default weights for suggestion scoring algorithm
 */
const DEFAULT_WEIGHTS: SuggestionWeights = {
  favoriteWeight: 0.25,
  recencyWeight: 0.15,
  ratingWeight: 0.2,
  varietyWeight: 0.15,
  tagMatchWeight: 0.25,
};

/**
 * Contextual tags mapped to meal slots
 */
const MEAL_SLOT_TAGS: Record<MealSlot, string[]> = {
  breakfast: ['breakfast', 'quick', 'morning'],
  lunch: ['lunch', 'quick', 'midday'],
  dinner: ['dinner', 'main', 'evening'],
  snack: ['snack', 'quick', 'light'],
};

/**
 * Factor scores for a single recipe (used for badge assignment)
 */
interface FactorScores {
  isFavoriteScore: number;
  ratingScore: number;
  recencyScore: number;
  varietyScore: number;
  tagMatchScore: number;
}

/**
 * Service for generating recipe suggestions based on context
 */
export class RecipeSuggestionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get top N recipe suggestions for a household based on context
   *
   * @param householdId - Household ID
   * @param context - Suggestion context (meal slot, date)
   * @param weights - Optional custom weights (defaults to DEFAULT_WEIGHTS)
   * @param limit - Number of suggestions to return (default 5)
   * @returns Sorted list of recipe suggestions
   */
  async getSuggestions(
    householdId: HouseholdId,
    context: SuggestionContext,
    weights?: Partial<SuggestionWeights>,
    limit: number = 5,
  ): Promise<RecipeSuggestion[]> {
    try {
      // Merge custom weights with defaults
      const effectiveWeights: SuggestionWeights = {
        ...DEFAULT_WEIGHTS,
        ...weights,
      };

      // Fetch all household recipes
      const { data: recipes, error } = await this.supabase
        .from('recipes')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!recipes || recipes.length === 0) return [];

      // Convert database recipes to typed Recipe objects
      const typedRecipes: Recipe[] = recipes.map((recipe) => ({
        ...recipe,
        id: recipe.id as RecipeId,
        household_id: recipe.household_id as HouseholdId,
        current_version_id: recipe.current_version_id,
        rolling_score: recipe.rolling_score,
        tags: recipe.tags || [],
        is_favorite: recipe.is_favorite,
        last_cooked_at: recipe.last_cooked_at ? new Date(recipe.last_cooked_at) : null,
        created_by: recipe.created_by,
        created_at: new Date(recipe.created_at),
        updated_at: new Date(recipe.updated_at),
        description: recipe.description,
        title: recipe.title,
      }));

      // Calculate max recency for normalization
      const maxRecency = this.calculateMaxRecency(typedRecipes);

      // Score each recipe
      const scoredSuggestions: RecipeSuggestion[] = typedRecipes.map((recipe) => {
        const factorScores = this.calculateFactorScores(recipe, context, maxRecency);
        const totalScore = this.calculateTotalScore(factorScores, effectiveWeights);
        const badge = this.assignBadge(recipe, factorScores);
        const matchingTags = this.findMatchingTags(recipe, context);

        return {
          recipe,
          score: totalScore,
          badge,
          matchingTags,
        };
      });

      // Sort by score descending and limit
      return scoredSuggestions.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      console.error('RecipeSuggestionService.getSuggestions failed:', error);
      throw new AppError('Failed to get recipe suggestions', 'SUGGESTION_ERROR', 500, {
        householdId,
      });
    }
  }

  /**
   * Calculate individual factor scores for a recipe
   */
  private calculateFactorScores(
    recipe: Recipe,
    context: SuggestionContext,
    maxRecency: number,
  ): FactorScores {
    // Favorite score: 1.0 if favorite, 0.0 otherwise
    const isFavoriteScore = recipe.is_favorite ? 1.0 : 0.0;

    // Rating score: Normalize rolling_score (0-5) to 0.0-1.0
    const ratingScore = recipe.rolling_score ? recipe.rolling_score / 5.0 : 0.0;

    // Recency/Variety score: Days since last cooked, normalized by max recency
    let recencyScore = 0.0;
    if (recipe.last_cooked_at) {
      const daysSinceCooked = this.getDaysSince(recipe.last_cooked_at);
      recencyScore = maxRecency > 0 ? daysSinceCooked / maxRecency : 0.0;
    } else {
      // Never cooked = maximum variety score
      recencyScore = 1.0;
    }

    const varietyScore = recencyScore; // Same as recency for now

    // Tag match score: Percentage of contextual tags that match recipe tags
    const tagMatchScore = this.calculateTagMatchScore(recipe, context);

    return {
      isFavoriteScore,
      ratingScore,
      recencyScore,
      varietyScore,
      tagMatchScore,
    };
  }

  /**
   * Calculate total weighted score
   */
  private calculateTotalScore(factorScores: FactorScores, weights: SuggestionWeights): number {
    return (
      weights.favoriteWeight * factorScores.isFavoriteScore +
      weights.recencyWeight * factorScores.recencyScore +
      weights.ratingWeight * factorScores.ratingScore +
      weights.varietyWeight * factorScores.varietyScore +
      weights.tagMatchWeight * factorScores.tagMatchScore
    );
  }

  /**
   * Assign a badge to a recipe based on its factor scores
   */
  private assignBadge(recipe: Recipe, scores: FactorScores): SuggestionBadge {
    if (recipe.is_favorite) return 'Favorite';
    if (recipe.rolling_score && recipe.rolling_score >= 4.0) return 'Top Rated';
    if (!recipe.last_cooked_at) return 'New Recipe';
    if (scores.varietyScore > 0.7) return 'Try Again'; // Not cooked in a while
    return 'Classic'; // Default
  }

  /**
   * Find tags that match the suggestion context
   */
  private findMatchingTags(recipe: Recipe, context: SuggestionContext): string[] {
    if (!context.mealSlot) return [];

    const contextualTags = MEAL_SLOT_TAGS[context.mealSlot];
    return recipe.tags.filter((tag) => contextualTags.includes(tag.toLowerCase()));
  }

  /**
   * Calculate tag match score (percentage of contextual tags that match)
   */
  private calculateTagMatchScore(recipe: Recipe, context: SuggestionContext): number {
    if (!context.mealSlot) return 0.0;

    const contextualTags = MEAL_SLOT_TAGS[context.mealSlot];
    const recipeTags = recipe.tags.map((tag) => tag.toLowerCase());

    const matchingCount = contextualTags.filter((tag) => recipeTags.includes(tag)).length;

    return contextualTags.length > 0 ? matchingCount / contextualTags.length : 0.0;
  }

  /**
   * Calculate the maximum recency (days since last cooked) across all recipes
   */
  private calculateMaxRecency(recipes: Recipe[]): number {
    const recencies = recipes
      .map((r) => (r.last_cooked_at ? this.getDaysSince(r.last_cooked_at) : 0))
      .filter((days) => days > 0);

    return recencies.length > 0 ? Math.max(...recencies) : 0;
  }

  /**
   * Get days since a given date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return diffMs / (1000 * 60 * 60 * 24);
  }
}
