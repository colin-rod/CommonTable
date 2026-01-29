import type { Recipe, RecipeId, RecipeVersionId, HouseholdId, UserId } from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WhatCanICookPanel } from './WhatCanICookPanel';

// Mock hooks
const mockUseRecipes = vi.fn();
const mockUseRecipeFilters = vi.fn();
const mockUseShortlistStore = vi.fn();

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: () => mockUseRecipes(),
}));

vi.mock('@/hooks/useRecipeFilters', () => ({
  useRecipeFilters: mockUseRecipeFilters,
}));

vi.mock('@/stores/useShortlistStore', () => ({
  useShortlistStore: () => mockUseShortlistStore(),
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
});

const mockRecipes: Recipe[] = [
  createMockRecipe('recipe-1', 'Pasta Carbonara', ['pasta', 'italian']),
  createMockRecipe('recipe-2', 'Pizza Margherita', ['pizza', 'italian']),
  createMockRecipe('recipe-3', 'Chicken Curry', ['chicken', 'curry', 'indian']),
];

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
      mockUseRecipeFilters.mockReturnValue({
        filteredRecipes: [],
        selectedTags: ['pasta'],
        availableTags: ['pasta', 'italian'],
        showFavoritesOnly: false,
        sortBy: 'last_cooked',
        toggleTag: vi.fn(),
        toggleFavorites: vi.fn(),
        setSortBy: vi.fn(),
        clearFilters: vi.fn(),
      });

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

    it('should show selected tags with active styling', () => {
      mockUseRecipeFilters.mockReturnValue({
        filteredRecipes: mockRecipes,
        selectedTags: ['pasta', 'italian'],
        availableTags: ['pasta', 'italian', 'pizza'],
        showFavoritesOnly: false,
        sortBy: 'last_cooked',
        toggleTag: vi.fn(),
        toggleFavorites: vi.fn(),
        setSortBy: vi.fn(),
        clearFilters: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      const pastaChip = screen.getByRole('button', { name: /pasta/i });
      const italianChip = screen.getByRole('button', { name: /italian/i });

      // Selected chips should have 'filled' variant
      expect(pastaChip).toHaveClass('MuiChip-filled');
      expect(italianChip).toHaveClass('MuiChip-filled');
    });

    it('should call toggleTag when tag chip clicked', async () => {
      const user = userEvent.setup();
      const mockToggleTag = vi.fn();

      mockUseRecipeFilters.mockReturnValue({
        filteredRecipes: mockRecipes,
        selectedTags: [],
        availableTags: ['pasta', 'italian'],
        showFavoritesOnly: false,
        sortBy: 'last_cooked',
        toggleTag: mockToggleTag,
        toggleFavorites: vi.fn(),
        setSortBy: vi.fn(),
        clearFilters: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      const pastaChip = screen.getByRole('button', { name: /pasta/i });
      await user.click(pastaChip);

      expect(mockToggleTag).toHaveBeenCalledWith('pasta');
    });

    it('should render clear filters button when filters active', () => {
      mockUseRecipeFilters.mockReturnValue({
        filteredRecipes: mockRecipes,
        selectedTags: ['pasta'],
        availableTags: ['pasta', 'italian'],
        showFavoritesOnly: false,
        sortBy: 'last_cooked',
        toggleTag: vi.fn(),
        toggleFavorites: vi.fn(),
        setSortBy: vi.fn(),
        clearFilters: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });

    it('should call clearFilters when clear button clicked', async () => {
      const user = userEvent.setup();
      const mockClearFilters = vi.fn();

      mockUseRecipeFilters.mockReturnValue({
        filteredRecipes: mockRecipes,
        selectedTags: ['pasta'],
        availableTags: ['pasta', 'italian'],
        showFavoritesOnly: false,
        sortBy: 'last_cooked',
        toggleTag: vi.fn(),
        toggleFavorites: vi.fn(),
        setSortBy: vi.fn(),
        clearFilters: mockClearFilters,
      });

      render(<WhatCanICookPanel />);

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      expect(mockClearFilters).toHaveBeenCalled();
    });
  });

  describe('Favorites Filter', () => {
    it('should render favorites checkbox', () => {
      render(<WhatCanICookPanel />);

      expect(screen.getByRole('checkbox', { name: /favorites only/i })).toBeInTheDocument();
    });

    it('should show checkbox as checked when showFavoritesOnly is true', () => {
      mockUseRecipeFilters.mockReturnValue({
        filteredRecipes: mockRecipes,
        selectedTags: [],
        availableTags: ['pasta', 'italian'],
        showFavoritesOnly: true,
        sortBy: 'last_cooked',
        toggleTag: vi.fn(),
        toggleFavorites: vi.fn(),
        setSortBy: vi.fn(),
        clearFilters: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });
      expect(checkbox).toBeChecked();
    });

    it('should call toggleFavorites when checkbox clicked', async () => {
      const user = userEvent.setup();
      const mockToggleFavorites = vi.fn();

      mockUseRecipeFilters.mockReturnValue({
        filteredRecipes: mockRecipes,
        selectedTags: [],
        availableTags: ['pasta', 'italian'],
        showFavoritesOnly: false,
        sortBy: 'last_cooked',
        toggleTag: vi.fn(),
        toggleFavorites: mockToggleFavorites,
        setSortBy: vi.fn(),
        clearFilters: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });
      await user.click(checkbox);

      expect(mockToggleFavorites).toHaveBeenCalled();
    });
  });

  describe('Sort Options', () => {
    it('should render sort select dropdown', () => {
      render(<WhatCanICookPanel />);

      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });

    it('should show current sort option', () => {
      mockUseRecipeFilters.mockReturnValue({
        filteredRecipes: mockRecipes,
        selectedTags: [],
        availableTags: ['pasta', 'italian'],
        showFavoritesOnly: false,
        sortBy: 'title',
        toggleTag: vi.fn(),
        toggleFavorites: vi.fn(),
        setSortBy: vi.fn(),
        clearFilters: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      // MUI Select renders as combobox with text content
      const select = screen.getByRole('combobox', { name: /sort by/i });
      expect(select).toHaveTextContent('Title (A-Z)');
    });

    it('should call setSortBy when sort option changed', async () => {
      const user = userEvent.setup();
      const mockSetSortBy = vi.fn();

      mockUseRecipeFilters.mockReturnValue({
        filteredRecipes: mockRecipes,
        selectedTags: [],
        availableTags: ['pasta', 'italian'],
        showFavoritesOnly: false,
        sortBy: 'last_cooked',
        toggleTag: vi.fn(),
        toggleFavorites: vi.fn(),
        setSortBy: mockSetSortBy,
        clearFilters: vi.fn(),
      });

      render(<WhatCanICookPanel />);

      const select = screen.getByRole('combobox', { name: /sort by/i });
      await user.click(select);

      // Click the "Title (A-Z)" option in the dropdown
      const titleOption = await screen.findByRole('option', { name: /title/i });
      await user.click(titleOption);

      expect(mockSetSortBy).toHaveBeenCalledWith('title');
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
