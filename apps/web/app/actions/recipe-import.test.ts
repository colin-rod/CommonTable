import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchRecipePreview, createImportedRecipe } from './recipe-import';

const { mockAuth, mockFunctions, mockFrom } = vi.hoisted(() => ({
  mockAuth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  mockFunctions: {
    invoke: vi.fn(),
  },
  mockFrom: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: mockAuth,
    functions: mockFunctions,
    from: mockFrom,
  })),
}));

vi.mock('@commontable/api-client', async () => {
  const actual = await vi.importActual('@commontable/api-client');
  return {
    ...actual,
    RecipeService: vi.fn().mockImplementation(() => ({
      create: vi.fn(),
    })),
  };
});

describe('recipe-import server actions', () => {
  const mockUser = { id: 'auth-user-1', email: 'test@example.com' };
  const recipeUrl = 'https://www.allrecipes.com/recipe/24074/alysias-basic-meat-lasagna/';
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalPublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const mockPreview = {
    preview: {
      title: 'Test Recipe',
      ingredients: [{ name: 'Flour' }],
      steps: [{ position: 1, text: 'Mix ingredients' }],
      tags: [],
    },
    validation_errors: [],
    source: {
      url: recipeUrl,
      parsed_via: 'jsonld' as const,
      fetched_at: '2026-02-05T08:35:50.000Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';

    mockAuth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockAuth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-access-token' } },
      error: null,
    });
  });

  afterEach(() => {
    if (originalAnonKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
    }

    if (originalPublishableKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalPublishableKey;
    }
  });

  it('returns success data when recipe-import function invocation succeeds', async () => {
    mockFunctions.invoke.mockResolvedValue({
      data: { data: mockPreview },
      error: null,
    });

    const result = await fetchRecipePreview(recipeUrl);

    expect(result).toEqual({ success: true, data: mockPreview });
    // Should always use publishable key (new Supabase key system)
    expect(mockFunctions.invoke).toHaveBeenCalledWith('recipe-import', {
      body: { url: recipeUrl },
      headers: {
        Authorization: 'Bearer test-access-token',
        apikey: 'test-publishable-key',
      },
    });
  });

  it('always uses publishable key regardless of anon key presence', async () => {
    // Even with anon key set, should still use publishable key
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    mockFunctions.invoke.mockResolvedValue({
      data: { data: mockPreview },
      error: null,
    });

    const result = await fetchRecipePreview(recipeUrl);

    expect(result).toEqual({ success: true, data: mockPreview });
    // Should use publishable key, NOT anon key
    expect(mockFunctions.invoke).toHaveBeenCalledWith('recipe-import', {
      body: { url: recipeUrl },
      headers: {
        Authorization: 'Bearer test-access-token',
        apikey: 'test-publishable-key',
      },
    });
  });

  it('maps gateway unauthorized message errors to UNAUTHORIZED code', async () => {
    mockFunctions.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          status: 401,
          json: vi.fn().mockResolvedValue({ message: 'Unauthorized' }),
        },
      },
    });

    const result = await fetchRecipePreview(recipeUrl);

    expect(result).toEqual({
      success: false,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    });
  });

  it('surfaces edge-function unauthorized payload with original message', async () => {
    mockFunctions.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          status: 401,
          json: vi.fn().mockResolvedValue({
            error: 'Invalid or expired token',
            code: 'UNAUTHORIZED',
          }),
        },
      },
    });

    const result = await fetchRecipePreview(recipeUrl);

    expect(result).toEqual({
      success: false,
      error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' },
    });
  });

  describe('createImportedRecipe', () => {
    it('should use auth.users.id as user_id when creating recipe', async () => {
      // Setup: Mock authenticated user with different profile.id
      const authUserId = 'auth-user-123';
      const profileId = 'profile-456'; // Different UUID to simulate new user

      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null,
      });

      // Mock profile query (this is the buggy code path we're testing)
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: profileId }, // Returns profile.id (wrong UUID)
          error: null,
        }),
      });

      // Mock RecipeService.create
      const apiClient = await import('@commontable/api-client');
      const { RecipeService } = apiClient;
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'recipe-123',
        household_id: 'household-123',
        title: 'Test Recipe',
        created_by: authUserId, // Database should receive auth.users.id
      });
      (RecipeService as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        create: mockCreate,
      }));

      // Act: Create imported recipe
      await createImportedRecipe({
        household_id: 'household-123' as string,
        title: 'Test Recipe',
        ingredients_json: [],
        steps_json: [],
        tags: [],
        status: 'suggested',
        key_ingredients: [],
      });

      // Assert: Service should be called with auth.users.id, NOT profiles.id
      // CRITICAL: This test should FAIL with current code (passes profileId)
      // After fix: This test should PASS (passes authUserId)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: authUserId, // Must be auth.users.id
        }),
      );
    });
  });
});
