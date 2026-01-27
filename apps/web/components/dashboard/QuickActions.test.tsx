import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QuickActions } from './QuickActions';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('QuickActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render section title', () => {
    render(<QuickActions />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should render 3 buttons with correct labels', () => {
    render(<QuickActions />);

    expect(screen.getByRole('button', { name: /add recipe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plan this week's meals/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse all recipes/i })).toBeInTheDocument();
  });

  it('should navigate to /recipes/new when "Add Recipe" button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions />);

    const addRecipeButton = screen.getByRole('button', { name: /add recipe/i });
    await user.click(addRecipeButton);

    expect(mockPush).toHaveBeenCalledWith('/recipes/new');
  });

  it('should navigate to /calendar when "Plan This Week\'s Meals" button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions />);

    const planMealsButton = screen.getByRole('button', { name: /plan this week's meals/i });
    await user.click(planMealsButton);

    expect(mockPush).toHaveBeenCalledWith('/calendar');
  });

  it('should navigate to /recipes when "Browse All Recipes" button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions />);

    const browseRecipesButton = screen.getByRole('button', { name: /browse all recipes/i });
    await user.click(browseRecipesButton);

    expect(mockPush).toHaveBeenCalledWith('/recipes');
  });

  it('should have correct button variant and color', () => {
    render(<QuickActions pendingTagsCount={0} pendingRequestsCount={0} />);

    // First 3 buttons should be contained primary (main actions)
    const addRecipeButton = screen.getByRole('button', { name: /add recipe/i });
    const planMealsButton = screen.getByRole('button', { name: /plan this week's meals/i });
    const browseRecipesButton = screen.getByRole('button', { name: /browse all recipes/i });

    expect(addRecipeButton).toHaveClass('MuiButton-contained');
    expect(addRecipeButton).toHaveClass('MuiButton-containedPrimary');
    expect(planMealsButton).toHaveClass('MuiButton-contained');
    expect(planMealsButton).toHaveClass('MuiButton-containedPrimary');
    expect(browseRecipesButton).toHaveClass('MuiButton-contained');
    expect(browseRecipesButton).toHaveClass('MuiButton-containedPrimary');

    // Last 4 buttons should be outlined (secondary actions)
    const importRecipeButton = screen.getByRole('button', { name: /import recipe/i });
    const suggestionsButton = screen.getByRole('button', { name: /recipe suggestions/i });
    const tagReviewButton = screen.getByRole('button', { name: /ai tag review/i });
    const mealRequestsButton = screen.getByRole('button', { name: /meal requests/i });

    expect(importRecipeButton).toHaveClass('MuiButton-outlined');
    expect(suggestionsButton).toHaveClass('MuiButton-outlined');
    expect(tagReviewButton).toHaveClass('MuiButton-outlined');
    expect(mealRequestsButton).toHaveClass('MuiButton-outlined');
  });

  it('should render 4 additional secondary action buttons', () => {
    render(<QuickActions pendingTagsCount={5} pendingRequestsCount={3} />);

    expect(screen.getByRole('button', { name: /import recipe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recipe suggestions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ai tag review/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /meal requests/i })).toBeInTheDocument();
  });

  it('should navigate to /recipes/import when "Import Recipe" button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions pendingTagsCount={0} pendingRequestsCount={0} />);

    const importRecipeButton = screen.getByRole('button', { name: /import recipe/i });
    await user.click(importRecipeButton);

    expect(mockPush).toHaveBeenCalledWith('/recipes/import');
  });

  it('should navigate to /suggestions when "Recipe Suggestions" button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions pendingTagsCount={0} pendingRequestsCount={0} />);

    const suggestionsButton = screen.getByRole('button', { name: /recipe suggestions/i });
    await user.click(suggestionsButton);

    expect(mockPush).toHaveBeenCalledWith('/suggestions');
  });

  it('should navigate to /tags/review when "AI Tag Review" button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions pendingTagsCount={5} pendingRequestsCount={0} />);

    const tagReviewButton = screen.getByRole('button', { name: /ai tag review/i });
    await user.click(tagReviewButton);

    expect(mockPush).toHaveBeenCalledWith('/tags/review');
  });

  it('should navigate to /requests when "Meal Requests" button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions pendingTagsCount={0} pendingRequestsCount={3} />);

    const mealRequestsButton = screen.getByRole('button', { name: /meal requests/i });
    await user.click(mealRequestsButton);

    expect(mockPush).toHaveBeenCalledWith('/requests');
  });

  it('should display badge count for AI Tag Review when count > 0', () => {
    render(<QuickActions pendingTagsCount={5} pendingRequestsCount={0} />);

    // Badge should show count
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display badge count for Meal Requests when count > 0', () => {
    render(<QuickActions pendingTagsCount={0} pendingRequestsCount={3} />);

    // Badge should show count
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should not display badge when counts are 0', () => {
    render(<QuickActions pendingTagsCount={0} pendingRequestsCount={0} />);

    // No badges should be visible with MuiBadge class showing content
    const badges = screen.queryAllByText('0');
    expect(badges).toHaveLength(0);
  });

  it('should have secondary buttons with outlined variant', () => {
    render(<QuickActions pendingTagsCount={0} pendingRequestsCount={0} />);

    const importRecipeButton = screen.getByRole('button', { name: /import recipe/i });
    const suggestionsButton = screen.getByRole('button', { name: /recipe suggestions/i });
    const tagReviewButton = screen.getByRole('button', { name: /ai tag review/i });
    const mealRequestsButton = screen.getByRole('button', { name: /meal requests/i });

    // Secondary buttons should be outlined
    expect(importRecipeButton).toHaveClass('MuiButton-outlined');
    expect(suggestionsButton).toHaveClass('MuiButton-outlined');
    expect(tagReviewButton).toHaveClass('MuiButton-outlined');
    expect(mealRequestsButton).toHaveClass('MuiButton-outlined');
  });
});
