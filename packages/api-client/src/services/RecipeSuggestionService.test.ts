/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type RecipeId,
  type HouseholdId,
  type UserId,
  type Recipe,
  type RecipeSuggestion,
  type SuggestionContext,
  type SuggestionWeights,
  type MealSlot,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { RecipeSuggestionService } from './RecipeSuggestionService';

/**
 * Mock types for Supabase responses in tests
 */
interface MockRecipe {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  current_version_id: string | null;
  rolling_score: number | null;
  tags: string[];
  is_favorite: boolean;
  last_cooked_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
}

/**
 * Helper to create a mock query builder chain
 */
function createMockQueryBuilder<T>(resolvedValue?: {
  data: T | null;
  error: unknown;
}): MockQueryBuilder {
  const defaultValue = resolvedValue ?? { data: null, error: null };

  const builder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(defaultValue),
    limit: vi.fn().mockResolvedValue(defaultValue),
  };

  return builder;
}

/**
 * Create a mock Supabase client
 */
function createMockSupabaseClient(): SupabaseClient {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient;
}

// Mock Supabase client
const mockSupabase = createMockSupabaseClient();

// Helper to create mock recipes
function createMockRecipe(overrides: Partial<MockRecipe> = {}): MockRecipe {
  return {
    id: 'recipe-1',
    household_id: 'household-1',
    title: 'Test Recipe',
    description: null,
    current_version_id: 'version-1',
    rolling_score: null,
    tags: [],
    is_favorite: false,
    last_cooked_at: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('RecipeSuggestionService', () => {
  let service: RecipeSuggestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RecipeSuggestionService(mockSupabase);
  });

  describe('getSuggestions', () => {
    const householdId = 'household-1' as HouseholdId;

    it('should return top 5 suggestions by default', async () => {
      // Create 10 mock recipes
      const mockRecipes: MockRecipe[] = Array.from({ length: 10 }, (_, i) =>
        createMockRecipe({
          id: `recipe-${i + 1}`,
          title: `Recipe ${i + 1}`,
          rolling_score: 3.0,
        }),
      );

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = { mealSlot: 'dinner' };
      const suggestions = await service.getSuggestions(householdId, context);

      expect(suggestions).toHaveLength(5);
      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    });

    it('should boost favorite recipes in scoring', async () => {
      const mockRecipes: MockRecipe[] = [
        createMockRecipe({
          id: 'recipe-1',
          title: 'Non-Favorite',
          is_favorite: false,
          rolling_score: 5.0,
        }),
        createMockRecipe({
          id: 'recipe-2',
          title: 'Favorite',
          is_favorite: true,
          rolling_score: 3.0,
        }),
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const suggestions = await service.getSuggestions(householdId, context);

      // Favorite recipe should rank higher despite lower rating
      expect(suggestions[0]!.recipe.title).toBe('Favorite');
      expect(suggestions[0]!.badge).toBe('Favorite');
    });

    it('should boost highly-rated recipes', async () => {
      const mockRecipes: MockRecipe[] = [
        createMockRecipe({
          id: 'recipe-1',
          title: 'Low Rated',
          rolling_score: 2.0,
        }),
        createMockRecipe({
          id: 'recipe-2',
          title: 'Top Rated',
          rolling_score: 4.5,
        }),
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const suggestions = await service.getSuggestions(householdId, context);

      expect(suggestions[0]!.recipe.title).toBe('Top Rated');
      expect(suggestions[0]!.badge).toBe('Top Rated');
    });

    it('should boost recipes not cooked recently', async () => {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const mockRecipes: MockRecipe[] = [
        createMockRecipe({
          id: 'recipe-1',
          title: 'Recently Cooked',
          last_cooked_at: lastWeek.toISOString(),
          rolling_score: 3.0,
        }),
        createMockRecipe({
          id: 'recipe-2',
          title: 'Long Ago',
          last_cooked_at: lastMonth.toISOString(),
          rolling_score: 3.0,
        }),
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const suggestions = await service.getSuggestions(householdId, context);

      // Recipe cooked long ago should rank higher
      expect(suggestions[0]!.recipe.title).toBe('Long Ago');
    });

    it('should boost recipes matching contextual tags', async () => {
      const mockRecipes: MockRecipe[] = [
        createMockRecipe({
          id: 'recipe-1',
          title: 'Breakfast Recipe',
          tags: ['breakfast', 'quick'],
          rolling_score: 3.0,
        }),
        createMockRecipe({
          id: 'recipe-2',
          title: 'Dinner Recipe',
          tags: ['dinner', 'slow'],
          rolling_score: 3.0,
        }),
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = { mealSlot: 'dinner' };
      const suggestions = await service.getSuggestions(householdId, context);

      // Dinner recipe should rank higher for dinner meal slot
      expect(suggestions[0]!.recipe.title).toBe('Dinner Recipe');
      expect(suggestions[0]!.matchingTags).toContain('dinner');
    });

    it('should assign "New Recipe" badge to recipes never cooked', async () => {
      const mockRecipes: MockRecipe[] = [
        createMockRecipe({
          id: 'recipe-1',
          title: 'Never Cooked',
          last_cooked_at: null,
          rolling_score: null,
        }),
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const suggestions = await service.getSuggestions(householdId, context);

      expect(suggestions[0]!.badge).toBe('New Recipe');
    });

    it('should assign "Try Again" badge to recipes not cooked in a while', async () => {
      const longAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

      const mockRecipes: MockRecipe[] = [
        createMockRecipe({
          id: 'recipe-1',
          title: 'Old Recipe',
          last_cooked_at: longAgo.toISOString(),
          rolling_score: 3.0,
          is_favorite: false,
        }),
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const suggestions = await service.getSuggestions(householdId, context);

      expect(suggestions[0]!.badge).toBe('Try Again');
    });

    it('should assign "Classic" badge as default', async () => {
      const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days ago

      const mockRecipes: MockRecipe[] = [
        createMockRecipe({
          id: 'recipe-1',
          title: 'Regular Recipe',
          last_cooked_at: yesterday.toISOString(),
          rolling_score: 3.0,
          is_favorite: false,
        }),
        createMockRecipe({
          id: 'recipe-2',
          title: 'Old Recipe',
          last_cooked_at: twoWeeksAgo.toISOString(),
          rolling_score: 3.0,
          is_favorite: false,
        }),
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const suggestions = await service.getSuggestions(householdId, context);

      // The recently cooked recipe should have varietyScore < 0.7, so badge is "Classic"
      const regularRecipe = suggestions.find((s) => s.recipe.title === 'Regular Recipe');
      expect(regularRecipe?.badge).toBe('Classic');
    });

    it('should return empty array when no recipes exist', async () => {
      const mockBuilder = createMockQueryBuilder({ data: [], error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const suggestions = await service.getSuggestions(householdId, context);

      expect(suggestions).toEqual([]);
    });

    it('should handle recipes with no cooking history', async () => {
      const mockRecipes: MockRecipe[] = [
        createMockRecipe({
          id: 'recipe-1',
          title: 'No History',
          last_cooked_at: null,
          rolling_score: null,
        }),
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const suggestions = await service.getSuggestions(householdId, context);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]!.recipe.title).toBe('No History');
    });

    it('should respect custom weights', async () => {
      const mockRecipes: MockRecipe[] = [
        createMockRecipe({
          id: 'recipe-1',
          title: 'Favorite',
          is_favorite: true,
          rolling_score: 2.0,
        }),
        createMockRecipe({
          id: 'recipe-2',
          title: 'High Rated',
          is_favorite: false,
          rolling_score: 5.0,
        }),
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const customWeights: Partial<SuggestionWeights> = {
        ratingWeight: 0.8, // Heavily weight rating
        favoriteWeight: 0.1, // Minimize favorite weight
      };

      const suggestions = await service.getSuggestions(householdId, context, customWeights);

      // High rated recipe should rank higher with custom weights
      expect(suggestions[0]!.recipe.title).toBe('High Rated');
    });

    it('should sort suggestions by descending score', async () => {
      const mockRecipes: MockRecipe[] = [
        createMockRecipe({
          id: 'recipe-1',
          title: 'Low Score',
          rolling_score: 2.0,
        }),
        createMockRecipe({
          id: 'recipe-2',
          title: 'Medium Score',
          rolling_score: 3.0,
        }),
        createMockRecipe({
          id: 'recipe-3',
          title: 'High Score',
          rolling_score: 5.0,
        }),
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const suggestions = await service.getSuggestions(householdId, context);

      expect(suggestions[0]!.recipe.title).toBe('High Score');
      expect(suggestions[1]!.recipe.title).toBe('Medium Score');
      expect(suggestions[2]!.recipe.title).toBe('Low Score');
    });

    it('should respect custom limit parameter', async () => {
      const mockRecipes: MockRecipe[] = Array.from({ length: 10 }, (_, i) =>
        createMockRecipe({
          id: `recipe-${i + 1}`,
          title: `Recipe ${i + 1}`,
        }),
      );

      const mockBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const context: SuggestionContext = {};
      const suggestions = await service.getSuggestions(householdId, context, undefined, 3);

      expect(suggestions).toHaveLength(3);
    });
  });
});
