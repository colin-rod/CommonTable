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
    render(<QuickActions />);

    const buttons = screen.getAllByRole('button');

    // All buttons should be MUI contained primary buttons
    buttons.forEach((button) => {
      expect(button).toHaveClass('MuiButton-contained');
      expect(button).toHaveClass('MuiButton-containedPrimary');
    });
  });
});
