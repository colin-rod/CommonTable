import type { Recipe, RecipeId, RecipeWithVersion } from '@commontable/api-client';
import { AppError } from '@commontable/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createRecipe,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  toggleRecipeFavorite,
  forkRecipe,
  getRecipeWithVersion,
} from './recipe';

const { mockSupabaseClient, mockRecipeService, mockAuth, mockProfilesTable, recipeServiceClients } =
  vi.hoisted(() => ({
    mockSupabaseClient: {},
    mockRecipeService: {
      create: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      toggleFavorite: vi.fn(),
      fork: vi.fn(),
      getWithVersion: vi.fn(),
    },
    mockAuth: {
      getUser: vi.fn(),
    },
    mockProfilesTable: {
      select: vi.fn(() => mockProfilesTable),
      eq: vi.fn(() => mockProfilesTable),
      single: vi.fn(),
    },
    recipeServiceClients: [] as unknown[],
  }));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    ...mockSupabaseClient,
    auth: mockAuth,
    from: (table: string) => {
      if (table === 'profiles') return mockProfilesTable;
      return {};
    },
  })),
}));

vi.mock('@commontable/api-client', () => ({
  RecipeService: vi.fn((client: unknown) => {
    recipeServiceClients.push(client);
    return mockRecipeService;
  }),
  AppError: vi.fn((message: string, code: string) => ({
    message,
    code,
    name: 'AppError',
  })),
}));

describe('recipe server actions', () => {
  const mockRecipe: Recipe = {
    id: 'recipe-1' as RecipeId,
    household_id: 'household-1' as any,
    title: 'Pasta Carbonara',
    description: 'Classic Italian pasta',
    current_version_id: 'version-1' as any,
    rolling_score: 4.5,
    tags: ['pasta', 'italian'],
    is_favorite: false,
    last_cooked_at: null,
    created_by: 'user-1' as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUser = { id: 'auth-user-1', email: 'test@example.com' };
  const mockProfile = { id: 'profile-1', auth_user_id: 'auth-user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    recipeServiceClients.length = 0;
  });

  describe('createRecipe', () => {
    it('should create a recipe and return success', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockRecipeService.create.mockResolvedValue(mockRecipe);

      const input = {
        household_id: 'household-1' as any,
        title: 'Pasta Carbonara',
        description: 'Classic Italian pasta',
        tags: ['pasta', 'italian'],
      };

      const result = await createRecipe(input);

      expect(result).toEqual({ success: true, data: mockRecipe });
      expect(mockRecipeService.create).toHaveBeenCalledWith({
        ...input,
        user_id: mockProfile.id,
      });
      expect(recipeServiceClients.length).toBeGreaterThan(0);
    });

    it('should return error when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const input = {
        household_id: 'household-1' as any,
        title: 'Pasta Carbonara',
      };

      const result = await createRecipe(input);

      expect(result).toEqual({
        success: false,
        error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
      });
      expect(mockRecipeService.create).not.toHaveBeenCalled();
    });

    it('should return error when profile is not found', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const input = {
        household_id: 'household-1' as any,
        title: 'Pasta Carbonara',
      };

      const result = await createRecipe(input);

      expect(result).toEqual({
        success: false,
        error: { message: 'Profile not found', code: 'PROFILE_NOT_FOUND' },
      });
      expect(mockRecipeService.create).not.toHaveBeenCalled();
    });

    it('should handle AppError from service', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const appError = new AppError('Validation failed', 'VALIDATION_ERROR');
      mockRecipeService.create.mockRejectedValue(appError);

      const input = {
        household_id: 'household-1' as any,
        title: 'Pasta Carbonara',
      };

      const result = await createRecipe(input);

      expect(result).toEqual({
        success: false,
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR' },
      });
    });

    it('should handle unknown errors', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockRecipeService.create.mockRejectedValue(new Error('Database error'));

      const input = {
        household_id: 'household-1' as any,
        title: 'Pasta Carbonara',
      };

      const result = await createRecipe(input);

      expect(result).toEqual({
        success: false,
        error: { message: 'An unexpected error occurred' },
      });
    });
  });

  describe('getRecipe', () => {
    it('should get a recipe by ID and return success', async () => {
      mockRecipeService.getById.mockResolvedValue(mockRecipe);

      const result = await getRecipe('recipe-1' as RecipeId);

      expect(result).toEqual({ success: true, data: mockRecipe });
      expect(mockRecipeService.getById).toHaveBeenCalledWith('recipe-1');
    });

    it('should handle errors from service', async () => {
      const appError = new AppError('Recipe not found', 'NOT_FOUND');
      mockRecipeService.getById.mockRejectedValue(appError);

      const result = await getRecipe('recipe-999' as RecipeId);

      expect(result).toEqual({
        success: false,
        error: { message: 'Recipe not found', code: 'NOT_FOUND' },
      });
    });
  });

  describe('updateRecipe', () => {
    it('should update a recipe and return success', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const updatedRecipe = { ...mockRecipe, title: 'Updated Pasta' };
      mockRecipeService.update.mockResolvedValue(updatedRecipe);

      const input = {
        title: 'Updated Pasta',
      };

      const result = await updateRecipe('recipe-1' as RecipeId, input);

      expect(result).toEqual({ success: true, data: updatedRecipe });
      expect(mockRecipeService.update).toHaveBeenCalledWith('recipe-1', {
        ...input,
        user_id: mockProfile.id,
      });
    });

    it('should return error when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const input = {
        title: 'Updated Pasta',
      };

      const result = await updateRecipe('recipe-1' as RecipeId, input);

      expect(result).toEqual({
        success: false,
        error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
      });
      expect(mockRecipeService.update).not.toHaveBeenCalled();
    });

    it('should return error when profile is not found', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const input = {
        title: 'Updated Pasta',
      };

      const result = await updateRecipe('recipe-1' as RecipeId, input);

      expect(result).toEqual({
        success: false,
        error: { message: 'Profile not found', code: 'PROFILE_NOT_FOUND' },
      });
      expect(mockRecipeService.update).not.toHaveBeenCalled();
    });

    it('should handle errors from service', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const appError = new AppError('Update failed', 'UPDATE_ERROR');
      mockRecipeService.update.mockRejectedValue(appError);

      const input = {
        title: 'Updated Pasta',
      };

      const result = await updateRecipe('recipe-1' as RecipeId, input);

      expect(result).toEqual({
        success: false,
        error: { message: 'Update failed', code: 'UPDATE_ERROR' },
      });
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe and return success', async () => {
      mockRecipeService.delete.mockResolvedValue(undefined);

      const result = await deleteRecipe('recipe-1' as RecipeId);

      expect(result).toEqual({ success: true, data: null });
      expect(mockRecipeService.delete).toHaveBeenCalledWith('recipe-1');
    });

    it('should handle errors from service', async () => {
      const appError = new AppError('Delete failed', 'DELETE_ERROR');
      mockRecipeService.delete.mockRejectedValue(appError);

      const result = await deleteRecipe('recipe-1' as RecipeId);

      expect(result).toEqual({
        success: false,
        error: { message: 'Delete failed', code: 'DELETE_ERROR' },
      });
    });
  });

  describe('toggleRecipeFavorite', () => {
    it('should toggle favorite status and return success', async () => {
      const favoritedRecipe = { ...mockRecipe, is_favorite: true };
      mockRecipeService.toggleFavorite.mockResolvedValue(favoritedRecipe);

      const result = await toggleRecipeFavorite('recipe-1' as RecipeId);

      expect(result).toEqual({ success: true, data: favoritedRecipe });
      expect(mockRecipeService.toggleFavorite).toHaveBeenCalledWith('recipe-1');
    });

    it('should handle errors from service', async () => {
      const appError = new AppError('Toggle failed', 'TOGGLE_ERROR');
      mockRecipeService.toggleFavorite.mockRejectedValue(appError);

      const result = await toggleRecipeFavorite('recipe-1' as RecipeId);

      expect(result).toEqual({
        success: false,
        error: { message: 'Toggle failed', code: 'TOGGLE_ERROR' },
      });
    });
  });

  describe('forkRecipe', () => {
    it('should fork a recipe and return success', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const forkedRecipe: RecipeWithVersion = {
        ...mockRecipe,
        id: 'recipe-2' as RecipeId,
        title: 'Forked Pasta',
        version: {
          id: 'version-2',
          recipe_id: 'recipe-2',
          version_number: 1,
          ingredients_json: [],
          steps_json: [],
          servings: 4,
          prep_time_minutes: null,
          cook_time_minutes: null,
          notes: null,
          created_by: 'profile-1' as any,
          created_at: new Date(),
        },
      };

      mockRecipeService.fork.mockResolvedValue(forkedRecipe);

      const input = {
        parentRecipeId: 'recipe-1' as RecipeId,
        newTitle: 'Forked Pasta',
      };

      const result = await forkRecipe(input);

      expect(result).toEqual({ success: true, data: forkedRecipe });
      expect(mockRecipeService.fork).toHaveBeenCalledWith(input, mockProfile.id);
    });

    it('should return error when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const input = {
        parentRecipeId: 'recipe-1' as RecipeId,
        newTitle: 'Forked Pasta',
      };

      const result = await forkRecipe(input);

      expect(result).toEqual({
        success: false,
        error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
      });
      expect(mockRecipeService.fork).not.toHaveBeenCalled();
    });

    it('should handle errors from service', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const appError = new AppError('Fork failed', 'FORK_ERROR');
      mockRecipeService.fork.mockRejectedValue(appError);

      const input = {
        parentRecipeId: 'recipe-1' as RecipeId,
        newTitle: 'Forked Pasta',
      };

      const result = await forkRecipe(input);

      expect(result).toEqual({
        success: false,
        error: { message: 'Fork failed', code: 'FORK_ERROR' },
      });
    });
  });

  describe('getRecipeWithVersion', () => {
    it('should get recipe with version and return success', async () => {
      const recipeWithVersion: RecipeWithVersion = {
        ...mockRecipe,
        version: {
          id: 'version-1',
          recipe_id: 'recipe-1',
          version_number: 1,
          ingredients_json: [{ name: 'pasta', quantity: 400, unit: 'g' }],
          steps_json: [{ position: 1, text: 'Boil pasta' }],
          servings: 4,
          prep_time_minutes: 10,
          cook_time_minutes: 15,
          notes: 'Classic recipe',
          created_by: 'user-1' as any,
          created_at: new Date(),
        },
      };

      mockRecipeService.getWithVersion.mockResolvedValue(recipeWithVersion);

      const result = await getRecipeWithVersion('recipe-1' as RecipeId);

      expect(result).toEqual({ success: true, data: recipeWithVersion });
      expect(mockRecipeService.getWithVersion).toHaveBeenCalledWith('recipe-1');
    });

    it('should handle errors from service', async () => {
      const appError = new AppError('Recipe not found', 'NOT_FOUND');
      mockRecipeService.getWithVersion.mockRejectedValue(appError);

      const result = await getRecipeWithVersion('recipe-999' as RecipeId);

      expect(result).toEqual({
        success: false,
        error: { message: 'Recipe not found', code: 'NOT_FOUND' },
      });
    });
  });
});
