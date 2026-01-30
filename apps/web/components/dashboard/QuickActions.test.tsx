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

  it('should render exactly 3 buttons with correct labels', () => {
    render(<QuickActions />);

    // Should render exactly 3 buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    // Verify button labels
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

  it('should have exactly 1 primary button and 2 secondary buttons', () => {
    render(<QuickActions />);

    // Only "Add Recipe" should be contained primary
    const addRecipeButton = screen.getByRole('button', { name: /add recipe/i });
    expect(addRecipeButton).toHaveClass('MuiButton-contained');
    expect(addRecipeButton).toHaveClass('MuiButton-containedPrimary');

    // "Plan This Week's Meals" and "Browse All Recipes" should be outlined
    const planMealsButton = screen.getByRole('button', { name: /plan this week's meals/i });
    const browseRecipesButton = screen.getByRole('button', { name: /browse all recipes/i });

    expect(planMealsButton).toHaveClass('MuiButton-outlined');
    expect(planMealsButton).toHaveClass('MuiButton-outlinedPrimary');
    expect(browseRecipesButton).toHaveClass('MuiButton-outlined');
    expect(browseRecipesButton).toHaveClass('MuiButton-outlinedPrimary');
  });

  it('should not render removed buttons', () => {
    render(<QuickActions />);

    // These buttons should NOT be in the document
    expect(screen.queryByRole('button', { name: /import recipe/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /recipe suggestions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ai tag review/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /meal requests/i })).not.toBeInTheDocument();
  });
});
