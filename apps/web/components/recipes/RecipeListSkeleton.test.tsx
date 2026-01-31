import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { RecipeListSkeleton } from './RecipeListSkeleton';

describe('RecipeListSkeleton', () => {
  describe('Rendering', () => {
    it('should render skeleton items', () => {
      render(<RecipeListSkeleton />);

      // List component should be present
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('should render 5 skeleton items by default', () => {
      const { container } = render(<RecipeListSkeleton />);

      // Count skeleton items (ListItem components)
      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems).toHaveLength(5);
    });

    it('should render custom number of skeleton items', () => {
      const { container } = render(<RecipeListSkeleton count={3} />);

      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems).toHaveLength(3);
    });

    it('should render circular skeleton for avatar', () => {
      const { container } = render(<RecipeListSkeleton />);

      const circularSkeletons = container.querySelectorAll('.MuiSkeleton-circular');
      expect(circularSkeletons.length).toBeGreaterThan(0);
    });

    it('should render text skeletons for title and subtitle', () => {
      const { container } = render(<RecipeListSkeleton />);

      const textSkeletons = container.querySelectorAll('.MuiSkeleton-text');
      expect(textSkeletons.length).toBeGreaterThan(0);
    });

    it('should render rectangular skeleton for icon area', () => {
      const { container } = render(<RecipeListSkeleton />);

      const rectangularSkeletons = container.querySelectorAll('.MuiSkeleton-rectangular');
      expect(rectangularSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Design System Compliance', () => {
    it('should use List component', () => {
      render(<RecipeListSkeleton />);

      const list = screen.getByRole('list');
      expect(list).toHaveClass('MuiList-root');
    });

    it('should use ListItem components', () => {
      const { container } = render(<RecipeListSkeleton />);

      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('should use Skeleton components', () => {
      const { container } = render(<RecipeListSkeleton />);

      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have list role', () => {
      render(<RecipeListSkeleton />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have aria-label for loading state', () => {
      render(<RecipeListSkeleton />);

      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'Loading recipes');
    });
  });

  describe('Props', () => {
    it('should accept count prop', () => {
      const { container } = render(<RecipeListSkeleton count={10} />);

      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems).toHaveLength(10);
    });

    it('should default to 5 items when count not provided', () => {
      const { container } = render(<RecipeListSkeleton />);

      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems).toHaveLength(5);
    });
  });
});
