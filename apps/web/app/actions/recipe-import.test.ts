import { describe, it, expect, vi, beforeEach } from 'vitest';

import { fetchRecipePreview } from './recipe-import';

const { mockAuth, mockFunctions } = vi.hoisted(() => ({
  mockAuth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  mockFunctions: {
    invoke: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: mockAuth,
    functions: mockFunctions,
  })),
}));

describe('recipe-import server actions', () => {
  const mockUser = { id: 'auth-user-1', email: 'test@example.com' };
  const recipeUrl = 'https://www.allrecipes.com/recipe/24074/alysias-basic-meat-lasagna/';

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

    mockAuth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockAuth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-access-token' } },
      error: null,
    });
  });

  it('returns success data when recipe-import function invocation succeeds', async () => {
    mockFunctions.invoke.mockResolvedValue({
      data: { data: mockPreview },
      error: null,
    });

    const result = await fetchRecipePreview(recipeUrl);

    expect(result).toEqual({ success: true, data: mockPreview });
    expect(mockFunctions.invoke).toHaveBeenCalledWith('recipe-import', {
      body: { url: recipeUrl },
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
});
