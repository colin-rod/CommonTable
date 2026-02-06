import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QuickActionsDropdown } from './QuickActions';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('QuickActionsDropdown', () => {
  const mockOnClose = vi.fn();
  let mockAnchorEl: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line no-undef
    mockAnchorEl = document.createElement('button');
  });

  it('should not render when closed', () => {
    render(<QuickActionsDropdown anchorEl={mockAnchorEl} open={false} onClose={mockOnClose} />);

    // Menu should not be visible
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should render menu with 3 items when open', () => {
    render(<QuickActionsDropdown anchorEl={mockAnchorEl} open={true} onClose={mockOnClose} />);

    // Menu should be visible
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();

    // Should have 3 menu items
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems).toHaveLength(3);

    // Verify menu item labels
    expect(screen.getByRole('menuitem', { name: /add recipe/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /open meal plan/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /browse all recipes/i })).toBeInTheDocument();
  });

  it('should navigate to /recipes/new and close menu when "Add Recipe" is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActionsDropdown anchorEl={mockAnchorEl} open={true} onClose={mockOnClose} />);

    const addRecipeItem = screen.getByRole('menuitem', { name: /add recipe/i });
    await user.click(addRecipeItem);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/recipes/new');
  });

  it('should navigate to /meal-plan and close menu when "Open Meal Plan" is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActionsDropdown anchorEl={mockAnchorEl} open={true} onClose={mockOnClose} />);

    const planMealsItem = screen.getByRole('menuitem', { name: /open meal plan/i });
    await user.click(planMealsItem);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/meal-plan');
  });

  it('should navigate to /recipes and close menu when "Browse All Recipes" is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActionsDropdown anchorEl={mockAnchorEl} open={true} onClose={mockOnClose} />);

    const browseRecipesItem = screen.getByRole('menuitem', { name: /browse all recipes/i });
    await user.click(browseRecipesItem);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/recipes');
  });

  it('should render icons for each menu item', () => {
    render(<QuickActionsDropdown anchorEl={mockAnchorEl} open={true} onClose={mockOnClose} />);

    // Each menu item should have an icon (ListItemIcon)
    const menuItems = screen.getAllByRole('menuitem');
    menuItems.forEach((item) => {
      // Check that each item has an icon element
      const icon = item.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});
