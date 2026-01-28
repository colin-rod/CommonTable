import type {
  CookingEvent,
  CookingEventId,
  RecipeId,
  CookingEventWithRecipeAndProfile,
} from '@commontable/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createCookingEvent,
  updateCookingEvent,
  deleteCookingEvent,
  getCookingEventsByRecipe,
  getCookingEventsByHousehold,
} from './cookingEvent';

const {
  mockSupabaseClient,
  mockCookingEventService,
  mockAuth,
  mockProfilesTable,
  mockHouseholdMembersTable,
  cookingEventServiceClients,
} = vi.hoisted(() => {
  const profilesTable = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };
  profilesTable.select.mockReturnValue(profilesTable);
  profilesTable.eq.mockReturnValue(profilesTable);

  const householdMembersTable = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };
  householdMembersTable.select.mockReturnValue(householdMembersTable);
  householdMembersTable.eq.mockReturnValue(householdMembersTable);

  return {
    mockSupabaseClient: {},
    mockCookingEventService: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(),
      getByRecipeId: vi.fn(),
      getByHouseholdId: vi.fn(),
    },
    mockAuth: {
      getUser: vi.fn(),
    },
    mockProfilesTable: profilesTable,
    mockHouseholdMembersTable: householdMembersTable,
    cookingEventServiceClients: [] as unknown[],
  };
});

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
      if (table === 'household_members') return mockHouseholdMembersTable;
      return {};
    },
  })),
}));

vi.mock('@commontable/api-client', () => ({
  CookingEventService: vi.fn((client: unknown) => {
    cookingEventServiceClients.push(client);
    return mockCookingEventService;
  }),
}));

vi.mock('@/lib/utils/server-actions', () => ({
  formatError: vi.fn((error) => {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }),
}));

describe('cookingEvent server actions', () => {
  const mockCookingEvent: CookingEvent = {
    id: 'event-1' as CookingEventId,
    recipe_id: 'recipe-1' as RecipeId,
    recipe_version_id: 'version-1' as any,
    household_id: 'household-1' as any,
    cooked_by: 'user-1' as any,
    cooked_at: new Date(),
    servings_made: 4,
    rating: 4,
    notes: 'Delicious!',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cookingEventServiceClients.length = 0;
  });

  describe('createCookingEvent', () => {
    it('should create a cooking event and return success', async () => {
      mockCookingEventService.create.mockResolvedValue(mockCookingEvent);

      const input = {
        recipe_id: 'recipe-1' as RecipeId,
        recipe_version_id: 'version-1' as any,
        household_id: 'household-1' as any,
        cooked_by: 'user-1' as any,
        rating: 4,
        notes: 'Delicious!',
      };

      const result = await createCookingEvent(input);

      expect(result).toEqual({ success: true, data: mockCookingEvent });
      expect(mockCookingEventService.create).toHaveBeenCalledWith(input);
      expect(cookingEventServiceClients.length).toBeGreaterThan(0);
    });

    it('should handle errors from service', async () => {
      const error = new Error('Create failed');
      mockCookingEventService.create.mockRejectedValue(error);

      const input = {
        recipe_id: 'recipe-1' as RecipeId,
        recipe_version_id: 'version-1' as any,
        household_id: 'household-1' as any,
        cooked_by: 'user-1' as any,
      };

      const result = await createCookingEvent(input);

      expect(result).toEqual({
        success: false,
        error: 'Create failed',
      });
    });
  });

  describe('updateCookingEvent', () => {
    it('should update a cooking event and return success', async () => {
      const updatedEvent = { ...mockCookingEvent, rating: 5 };
      mockCookingEventService.update.mockResolvedValue(updatedEvent);

      const input = {
        rating: 5,
      };

      const result = await updateCookingEvent('event-1' as CookingEventId, input);

      expect(result).toEqual({ success: true, data: updatedEvent });
      expect(mockCookingEventService.update).toHaveBeenCalledWith('event-1', input);
    });

    it('should handle errors from service', async () => {
      const error = new Error('Update failed');
      mockCookingEventService.update.mockRejectedValue(error);

      const input = {
        rating: 5,
      };

      const result = await updateCookingEvent('event-1' as CookingEventId, input);

      expect(result).toEqual({
        success: false,
        error: 'Update failed',
      });
    });
  });

  describe('deleteCookingEvent', () => {
    it('should delete a cooking event and return success', async () => {
      mockCookingEventService.getById.mockResolvedValue(mockCookingEvent);
      mockCookingEventService.delete.mockResolvedValue(undefined);

      const result = await deleteCookingEvent('event-1' as CookingEventId);

      expect(result).toEqual({ success: true, data: undefined });
      expect(mockCookingEventService.getById).toHaveBeenCalledWith('event-1');
      expect(mockCookingEventService.delete).toHaveBeenCalledWith('event-1');
    });

    it('should handle errors from service', async () => {
      const error = new Error('Delete failed');
      mockCookingEventService.getById.mockRejectedValue(error);

      const result = await deleteCookingEvent('event-1' as CookingEventId);

      expect(result).toEqual({
        success: false,
        error: 'Delete failed',
      });
    });
  });

  describe('getCookingEventsByRecipe', () => {
    it('should get cooking events by recipe ID and return success', async () => {
      const events = [mockCookingEvent];
      mockCookingEventService.getByRecipeId.mockResolvedValue(events);

      const result = await getCookingEventsByRecipe('recipe-1' as RecipeId);

      expect(result).toEqual({ success: true, data: events });
      expect(mockCookingEventService.getByRecipeId).toHaveBeenCalledWith('recipe-1');
    });

    it('should handle errors from service', async () => {
      const error = new Error('Fetch failed');
      mockCookingEventService.getByRecipeId.mockRejectedValue(error);

      const result = await getCookingEventsByRecipe('recipe-1' as RecipeId);

      expect(result).toEqual({
        success: false,
        error: 'Fetch failed',
      });
    });
  });

  describe('getCookingEventsByHousehold', () => {
    it('should get cooking events by household and return success', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: { id: 'profile-1' },
        error: null,
      });

      mockHouseholdMembersTable.single.mockResolvedValue({
        data: { household_id: 'household-1' },
        error: null,
      });

      const events: CookingEventWithRecipeAndProfile[] = [
        {
          ...mockCookingEvent,
          recipe_title: 'Pasta Carbonara',
          cooked_by_name: 'John Doe',
        },
      ];

      mockCookingEventService.getByHouseholdId.mockResolvedValue(events);

      const result = await getCookingEventsByHousehold(50, 0);

      expect(result).toEqual({ success: true, data: events });
      expect(mockCookingEventService.getByHouseholdId).toHaveBeenCalledWith('household-1', 50, 0);
    });

    it('should handle error when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getCookingEventsByHousehold();

      expect(result).toEqual({
        success: false,
        error: 'User not authenticated',
      });
      expect(mockCookingEventService.getByHouseholdId).not.toHaveBeenCalled();
    });

    it('should handle error when user is not in a household', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: { id: 'profile-1' },
        error: null,
      });

      mockHouseholdMembersTable.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getCookingEventsByHousehold();

      expect(result).toEqual({
        success: false,
        error: 'User not in a household',
      });
      expect(mockCookingEventService.getByHouseholdId).not.toHaveBeenCalled();
    });

    it('should use default limit and offset when not provided', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockProfilesTable.single.mockResolvedValue({
        data: { id: 'profile-1' },
        error: null,
      });

      mockHouseholdMembersTable.single.mockResolvedValue({
        data: { household_id: 'household-1' },
        error: null,
      });

      mockCookingEventService.getByHouseholdId.mockResolvedValue([]);

      await getCookingEventsByHousehold();

      expect(mockCookingEventService.getByHouseholdId).toHaveBeenCalledWith('household-1', 50, 0);
    });
  });
});
