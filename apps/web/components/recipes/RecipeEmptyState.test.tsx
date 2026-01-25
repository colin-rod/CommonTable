import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { RecipeEmptyState } from './RecipeEmptyState';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('RecipeEmptyState', () => {
  describe('Rendering', () => {
    it('should render empty state message', () => {
      render(<RecipeEmptyState />);

      expect(
        screen.getByRole('heading', { name: /no recipes yet/i, level: 6 }),
      ).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<RecipeEmptyState />);

      expect(screen.getByText(/add your first recipe to get started/i)).toBeInTheDocument();
    });

    it('should render add recipe button', () => {
      render(<RecipeEmptyState />);

      const button = screen.getByRole('button', { name: /add recipe/i });
      expect(button).toBeInTheDocument();
    });

    it('should render restaurant icon', () => {
      render(<RecipeEmptyState />);

      // Material Icon has data-testid
      const icon = screen.getByTestId('RestaurantMenuIcon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to add recipe page when button clicked', () => {
      render(<RecipeEmptyState />);

      const button = screen.getByRole('button', { name: /add recipe/i });
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/recipes/new');
    });
  });

  describe('Design System Compliance', () => {
    it('should use Typography h6 for title', () => {
      render(<RecipeEmptyState />);

      const title = screen.getByRole('heading', { name: /no recipes yet/i, level: 6 });
      expect(title.tagName).toBe('H6');
      expect(title).toHaveClass('MuiTypography-h6');
    });

    it('should use Typography body2 for description', () => {
      render(<RecipeEmptyState />);

      const description = screen.getByText(/add your first recipe to get started/i);
      expect(description).toHaveClass('MuiTypography-body2');
    });

    it('should use contained primary button', () => {
      render(<RecipeEmptyState />);

      const button = screen.getByRole('button', { name: /add recipe/i });
      expect(button.closest('button')).toHaveClass('MuiButton-contained');
      expect(button.closest('button')).toHaveClass('MuiButton-colorPrimary');
    });

    it('should use Stack component with spacing', () => {
      render(<RecipeEmptyState />);

      const container = screen.getByTestId('RestaurantMenuIcon').closest('.MuiStack-root');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<RecipeEmptyState />);

      const heading = screen.getByRole('heading', { name: /no recipes yet/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible button text', () => {
      render(<RecipeEmptyState />);

      const button = screen.getByRole('button', { name: /add recipe/i });
      expect(button).toHaveAccessibleName();
    });
  });
});
