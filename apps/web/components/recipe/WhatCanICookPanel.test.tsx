import type {
  Recipe,
  RecipeId,
  RecipeVersionId,
  HouseholdId,
  UserId,
  ProfileId,
  User,
} from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WhatCanICookPanel } from './WhatCanICookPanel';

// Mock hooks
const mockUseRecipes = vi.fn();
const mockUseRecipeFilters = vi.fn();
const mockUseShortlistStore = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: () => mockUseRecipes(),
}));

vi.mock('@/hooks/useRecipeFilters', () => ({
  useRecipeFilters: () => mockUseRecipeFilters(),
}));

vi.mock('@/stores/useShortlistStore', () => ({
  useShortlistStore: () => mockUseShortlistStore(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock recipe data
const createMockRecipe = (id: string, title: string, tags: string[]): Recipe => ({
  id: id as RecipeId,
  household_id: 'household-456' as HouseholdId,
  title,
  description: `Description for ${title}`,
  current_version_id: 'version-1' as RecipeVersionId,
  rolling_score: 4.5,
  tags,
  is_favorite: false,
  last_cooked_at: new Date('2026-01-20T10:00:00Z'),
  created_by: 'user-789' as UserId,
  created_at: new Date('2026-01-15T10:00:00Z'),
  updated_at: new Date('2026-01-15T10:00:00Z'),
  // Phase 3 metadata fields
  cuisine: null,
  meal_type: null,
  key_ingredients: [],
  priority: null,
  status: 'suggested',
  cooking_method: null,
  dietary_categories: null,
  dish_category: null,
});

const mockRecipes: Recipe[] = [
  createMockRecipe('recipe-1', 'Pasta Carbonara', ['pasta', 'italian']),
  createMockRecipe('recipe-2', 'Pizza Margherita', ['pizza', 'italian']),
  createMockRecipe('recipe-3', 'Chicken Curry', ['chicken', 'curry', 'indian']),
];

// Mock authenticated user
const mockAuthenticatedUser: User = {
  id: 'auth-123' as UserId,
  email: 'test@example.com',
  profile: {
    id: 'profile-456' as ProfileId,
    auth_user_id: 'auth-123' as UserId,
    display_name: 'Test User',
    avatar_url: null,
    member_type: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  household: {
    id: 'household-789' as HouseholdId,
    name: 'Test Household',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  household_role: 'member',
};

describe('WhatCanICookPanel', () => {
  const mockToggleFavorite = vi.fn();
  const mockAddToShortlist = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseRecipes.mockReturnValue({
      recipes: mockRecipes,
      loading: false,
      error: null,
      toggleFavorite: mockToggleFavorite,
    });

    // Mock useRecipeFilters to return the same recipes (no filtering)
    mockUseRecipeFilters.mockReturnValue(mockRecipes);

    mockUseShortlistStore.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      add: mockAddToShortlist,
      hasRecipe: () => false,
    });

    // Mock authenticated user by default
    mockUseAuth.mockReturnValue({
      user: mockAuthenticatedUser,
      session: null,
      household: mockAuthenticatedUser.household,
      householdRole: 'member',
      isAuthenticated: true,
      isLoading: false,
      isError: false,
      error: null,
      initialized: true,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      clearError: vi.fn(),
    });
  });

  describe('Basic Rendering', () => {
    it('should render panel title', () => {
      render(<WhatCanICookPanel />);

      expect(screen.getByText(/what can i cook/i)).toBeInTheDocument();
    });

    it('should render recipe grid', () => {
      render(<WhatCanICookPanel />);

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
      expect(screen.getByText('Chicken Curry')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      mockUseRecipes.mockReturnValue({
        recipes: [],
        loading: true,
        error: null,
        toggleFavorite: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render error state', () => {
      mockUseRecipes.mockReturnValue({
        recipes: [],
        loading: false,
        error: new Error('Failed to load recipes'),
        toggleFavorite: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      expect(screen.getByText(/failed to load recipes/i)).toBeInTheDocument();
    });

    it('should render empty state when no recipes match filters', () => {
      mockUseRecipeFilters.mockReturnValue([]);

      render(<WhatCanICookPanel />);

      expect(screen.getByText(/no recipes found/i)).toBeInTheDocument();
    });
  });

  describe('Tag Filters', () => {
    it('should render tag chips for available tags', () => {
      render(<WhatCanICookPanel />);

      expect(screen.getByRole('button', { name: /pasta/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /italian/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /chicken/i })).toBeInTheDocument();
    });

    it('should show selected tags with active styling', async () => {
      const user = userEvent.setup();
      mockUseRecipeFilters.mockReturnValue(mockRecipes);

      render(<WhatCanICookPanel />);

      // Click pasta tag to select it
      const pastaChip = screen.getByRole('button', { name: /pasta/i });
      await user.click(pastaChip);

      // Selected chip should have 'filled' variant
      expect(pastaChip).toHaveClass('MuiChip-filled');
    });

    it('should call toggleTag when tag chip clicked', async () => {
      const user = userEvent.setup();
      mockUseRecipeFilters.mockReturnValue(mockRecipes);

      render(<WhatCanICookPanel />);

      const pastaChip = screen.getByRole('button', { name: /pasta/i });

      // Verify chip is initially unselected (outlined variant)
      expect(pastaChip).toHaveClass('MuiChip-outlined');

      await user.click(pastaChip);

      // After click, chip should be selected (filled variant)
      expect(pastaChip).toHaveClass('MuiChip-filled');
    });

    it('should render clear filters button when filters active', async () => {
      const user = userEvent.setup();
      mockUseRecipeFilters.mockReturnValue(mockRecipes);

      render(<WhatCanICookPanel />);

      // Initially no clear filters button
      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();

      // Click a tag to activate filters
      const pastaChip = screen.getByRole('button', { name: /pasta/i });
      await user.click(pastaChip);

      // Now clear filters button should appear
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });

    it('should clear filters when clear button clicked', async () => {
      const user = userEvent.setup();
      mockUseRecipeFilters.mockReturnValue(mockRecipes);

      render(<WhatCanICookPanel />);

      // Click a tag to activate filters
      const pastaChip = screen.getByRole('button', { name: /pasta/i });
      await user.click(pastaChip);

      // Verify chip is selected
      expect(pastaChip).toHaveClass('MuiChip-filled');

      // Click clear filters button
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      // Verify chip is no longer selected
      expect(pastaChip).toHaveClass('MuiChip-outlined');

      // Clear filters button should be gone
      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
    });
  });

  describe('Favorites Filter', () => {
    it('should render favorites checkbox', () => {
      render(<WhatCanICookPanel />);

      expect(screen.getByRole('checkbox', { name: /favorites only/i })).toBeInTheDocument();
    });

    it('should show checkbox as checked when showFavoritesOnly is true', async () => {
      const user = userEvent.setup();
      mockUseRecipeFilters.mockReturnValue(mockRecipes);

      render(<WhatCanICookPanel />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });

      // Initially unchecked
      expect(checkbox).not.toBeChecked();

      // Click to check
      await user.click(checkbox);

      // Now checked
      expect(checkbox).toBeChecked();
    });

    it('should toggle favorites checkbox when clicked', async () => {
      const user = userEvent.setup();
      mockUseRecipeFilters.mockReturnValue(mockRecipes);

      render(<WhatCanICookPanel />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });

      // Initially unchecked
      expect(checkbox).not.toBeChecked();

      // Click once
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      // Click again
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Sort Options', () => {
    it('should render sort select dropdown', () => {
      render(<WhatCanICookPanel />);

      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });

    it('should show current sort option', async () => {
      const user = userEvent.setup();
      mockUseRecipeFilters.mockReturnValue(mockRecipes);

      render(<WhatCanICookPanel />);

      // MUI Select renders as combobox with text content
      const select = screen.getByRole('combobox', { name: /sort by/i });

      // Initially shows "Last Cooked" (default)
      expect(select).toHaveTextContent('Last Cooked');

      // Click to open dropdown
      await user.click(select);

      // Click "Title (A-Z)" option
      const titleOption = await screen.findByRole('option', { name: /title/i });
      await user.click(titleOption);

      // Now shows "Title (A-Z)"
      expect(select).toHaveTextContent('Title (A-Z)');
    });

    it('should change sort option when dropdown selection changes', async () => {
      const user = userEvent.setup();
      mockUseRecipeFilters.mockReturnValue(mockRecipes);

      render(<WhatCanICookPanel />);

      const select = screen.getByRole('combobox', { name: /sort by/i });

      // Initially shows "Last Cooked"
      expect(select).toHaveTextContent('Last Cooked');

      await user.click(select);

      // Click the "Title (A-Z)" option in the dropdown
      const titleOption = await screen.findByRole('option', { name: /title/i });
      await user.click(titleOption);

      // Verify sort option changed
      expect(select).toHaveTextContent('Title (A-Z)');
    });

    it('should render all sort options', async () => {
      const user = userEvent.setup();

      render(<WhatCanICookPanel />);

      const select = screen.getByRole('combobox', { name: /sort by/i });
      await user.click(select);

      // Check that all options appear in the dropdown
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /last cooked/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /title/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /rating/i })).toBeInTheDocument();
      });
    });
  });

  describe('Shortlist Integration', () => {
    it('should add recipe to shortlist when button clicked', async () => {
      const user = userEvent.setup();

      render(<WhatCanICookPanel />);

      const buttons = screen.getAllByRole('button', { name: /add to shortlist/i });
      await user.click(buttons[0]!);

      expect(mockAddToShortlist).toHaveBeenCalledWith('recipe-1' as RecipeId, expect.any(String));
    });

    it('should show recipes as shortlisted when in shortlist store', () => {
      mockUseShortlistStore.mockReturnValue({
        items: [],
        loading: false,
        error: null,
        add: vi.fn(),
        hasRecipe: (recipeId: RecipeId) => recipeId === ('recipe-1' as RecipeId),
      });

      render(<WhatCanICookPanel />);

      // First card should show "Added" button
      const addedButtons = screen.getAllByRole('button', { name: /added/i });
      expect(addedButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Auth Context Integration', () => {
    it('should use authenticated user profile ID when adding to shortlist', async () => {
      const user = userEvent.setup();

      render(<WhatCanICookPanel />);

      const buttons = screen.getAllByRole('button', { name: /add to shortlist/i });
      await user.click(buttons[0]!);

      // Should be called with profile ID, not placeholder
      expect(mockAddToShortlist).toHaveBeenCalledWith(
        'recipe-1' as RecipeId,
        'profile-456' as ProfileId, // ← Profile ID from mockAuthenticatedUser
      );
    });

    it('should not add to shortlist if user is not authenticated', async () => {
      const user = userEvent.setup();

      // Mock unauthenticated state
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        household: null,
        householdRole: null,
        isAuthenticated: false,
        isLoading: false,
        isError: false,
        error: null,
        initialized: true,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        clearError: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      const buttons = screen.getAllByRole('button', { name: /add to shortlist/i });
      await user.click(buttons[0]!);

      // Should NOT be called when user is not authenticated
      expect(mockAddToShortlist).not.toHaveBeenCalled();
    });

    it('should not add to shortlist if user has no profile', async () => {
      const user = userEvent.setup();

      // Mock user without profile (edge case)
      mockUseAuth.mockReturnValue({
        user: {
          ...mockAuthenticatedUser,
          profile: null as any, // User without profile
        },
        session: null,
        household: null,
        householdRole: null,
        isAuthenticated: true,
        isLoading: false,
        isError: false,
        error: null,
        initialized: true,
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        clearError: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      const buttons = screen.getAllByRole('button', { name: /add to shortlist/i });
      await user.click(buttons[0]!);

      // Should NOT be called when user has no profile
      expect(mockAddToShortlist).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for filters', () => {
      render(<WhatCanICookPanel />);

      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /favorites only/i })).toBeInTheDocument();
    });

    it('should have accessible tag chip labels', () => {
      render(<WhatCanICookPanel />);

      const pastaChip = screen.getByRole('button', { name: /pasta/i });
      expect(pastaChip).toBeInTheDocument();
    });
  });
});
