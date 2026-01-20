import type { SortOption } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecipeFilterBar } from './RecipeFilterBar';

describe('RecipeFilterBar Component', () => {
  const mockOnTagsChange = vi.fn();
  const mockOnSortChange = vi.fn();
  const mockOnFavoritesToggle = vi.fn();

  const defaultProps = {
    selectedTags: [],
    onTagsChange: mockOnTagsChange,
    sortBy: 'last-cooked' as SortOption,
    onSortChange: mockOnSortChange,
    showFavoritesOnly: false,
    onFavoritesToggle: mockOnFavoritesToggle,
    availableTags: ['pasta', 'italian', 'quick', 'vegetarian'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render tag filter dropdown', () => {
      render(<RecipeFilterBar {...defaultProps} />);

      expect(screen.getByLabelText(/filter by tags/i)).toBeInTheDocument();
    });

    it('should render sort dropdown', () => {
      render(<RecipeFilterBar {...defaultProps} />);

      // SortSelect component should be rendered
      expect(screen.getByLabelText(/^sort$/i)).toBeInTheDocument();
    });

    it('should render favorites checkbox', () => {
      render(<RecipeFilterBar {...defaultProps} />);

      expect(screen.getByRole('checkbox', { name: /favorites only/i })).toBeInTheDocument();
    });

    it('should render favorites checkbox label', () => {
      render(<RecipeFilterBar {...defaultProps} />);

      expect(screen.getByText(/favorites only/i)).toBeInTheDocument();
    });
  });

  describe('Favorites toggle', () => {
    it('should show unchecked checkbox when showFavoritesOnly is false', () => {
      render(<RecipeFilterBar {...defaultProps} showFavoritesOnly={false} />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });
      expect(checkbox).not.toBeChecked();
    });

    it('should show checked checkbox when showFavoritesOnly is true', () => {
      render(<RecipeFilterBar {...defaultProps} showFavoritesOnly={true} />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });
      expect(checkbox).toBeChecked();
    });

    it('should call onFavoritesToggle with true when unchecked checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<RecipeFilterBar {...defaultProps} showFavoritesOnly={false} />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });
      await user.click(checkbox);

      expect(mockOnFavoritesToggle).toHaveBeenCalledWith(true);
      expect(mockOnFavoritesToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onFavoritesToggle with false when checked checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<RecipeFilterBar {...defaultProps} showFavoritesOnly={true} />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });
      await user.click(checkbox);

      expect(mockOnFavoritesToggle).toHaveBeenCalledWith(false);
      expect(mockOnFavoritesToggle).toHaveBeenCalledTimes(1);
    });

    it('should toggle multiple times correctly', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<RecipeFilterBar {...defaultProps} showFavoritesOnly={false} />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });

      // First click: check
      await user.click(checkbox);
      expect(mockOnFavoritesToggle).toHaveBeenCalledWith(true);

      // Clear mock calls
      mockOnFavoritesToggle.mockClear();

      // Rerender with updated state
      rerender(<RecipeFilterBar {...defaultProps} showFavoritesOnly={true} />);

      // Second click: uncheck
      await user.click(checkbox);
      expect(mockOnFavoritesToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('Tag filter', () => {
    it('should render all available tags in dropdown menu', async () => {
      const user = userEvent.setup();
      render(<RecipeFilterBar {...defaultProps} />);

      // Open the dropdown
      const tagFilter = screen.getByLabelText(/filter by tags/i);
      await user.click(tagFilter);

      // Check all tags are present
      expect(screen.getByText('pasta')).toBeInTheDocument();
      expect(screen.getByText('italian')).toBeInTheDocument();
      expect(screen.getByText('quick')).toBeInTheDocument();
      expect(screen.getByText('vegetarian')).toBeInTheDocument();
    });

    it('should show "No tags available" when availableTags is empty', async () => {
      const user = userEvent.setup();
      render(<RecipeFilterBar {...defaultProps} availableTags={[]} />);

      // Open the dropdown
      const tagFilter = screen.getByLabelText(/filter by tags/i);
      await user.click(tagFilter);

      expect(screen.getByText(/no tags available/i)).toBeInTheDocument();
    });

    it('should display selected tags as chips', () => {
      render(<RecipeFilterBar {...defaultProps} selectedTags={['pasta', 'italian']} />);

      expect(screen.getByText('pasta')).toBeInTheDocument();
      expect(screen.getByText('italian')).toBeInTheDocument();
    });

    it('should call onTagsChange when tag is selected', async () => {
      const user = userEvent.setup();
      render(<RecipeFilterBar {...defaultProps} selectedTags={[]} />);

      // Open the dropdown
      const tagFilter = screen.getByLabelText(/filter by tags/i);
      await user.click(tagFilter);

      // Select a tag
      const pastaOption = screen.getByText('pasta');
      await user.click(pastaOption);

      expect(mockOnTagsChange).toHaveBeenCalledWith(['pasta']);
    });
  });

  describe('Sort dropdown', () => {
    it('should display current sort option', () => {
      render(<RecipeFilterBar {...defaultProps} sortBy="alphabetical" />);

      // SortSelect should show the current value
      const sortSelect = screen.getByLabelText(/^sort$/i);
      expect(sortSelect).toBeInTheDocument();
    });

    it('should call onSortChange when sort option changes', async () => {
      const user = userEvent.setup();
      render(<RecipeFilterBar {...defaultProps} sortBy="last-cooked" />);

      // Open sort dropdown
      const sortSelect = screen.getByLabelText(/^sort$/i);
      await user.click(sortSelect);

      // Select a different sort option (A-Z is the display name for alphabetical)
      const alphabeticalOption = screen.getByRole('option', { name: /^a-z$/i });
      await user.click(alphabeticalOption);

      expect(mockOnSortChange).toHaveBeenCalledWith('alphabetical');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label for favorites checkbox', () => {
      render(<RecipeFilterBar {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });
      expect(checkbox).toBeInTheDocument();
    });

    it('should have accessible label for tag filter', () => {
      render(<RecipeFilterBar {...defaultProps} />);

      expect(screen.getByLabelText(/filter by tags/i)).toBeInTheDocument();
    });

    it('should have accessible label for sort dropdown', () => {
      render(<RecipeFilterBar {...defaultProps} />);

      expect(screen.getByLabelText(/^sort$/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation for favorites checkbox', async () => {
      const user = userEvent.setup();
      render(<RecipeFilterBar {...defaultProps} showFavoritesOnly={false} />);

      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });

      // Focus the checkbox and press space
      checkbox.focus();
      await user.keyboard(' ');

      // onFavoritesToggle should be called when spacebar is pressed
      expect(mockOnFavoritesToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('Integration', () => {
    it('should handle all filters working together', async () => {
      const user = userEvent.setup();
      render(
        <RecipeFilterBar
          {...defaultProps}
          selectedTags={['pasta']}
          showFavoritesOnly={true}
          sortBy="recent"
        />,
      );

      // Verify all states are reflected
      expect(screen.getByText('pasta')).toBeInTheDocument(); // Tag chip
      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });
      expect(checkbox).toBeChecked(); // Favorites checked

      // Change favorites
      await user.click(checkbox);
      expect(mockOnFavoritesToggle).toHaveBeenCalledWith(false);
    });

    it('should maintain filter state through multiple interactions', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <RecipeFilterBar {...defaultProps} selectedTags={[]} showFavoritesOnly={false} />,
      );

      // Toggle favorites
      const checkbox = screen.getByRole('checkbox', { name: /favorites only/i });
      await user.click(checkbox);

      // Rerender with updated state
      rerender(<RecipeFilterBar {...defaultProps} selectedTags={[]} showFavoritesOnly={true} />);

      // Verify state persisted
      expect(checkbox).toBeChecked();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty selected tags array', () => {
      render(<RecipeFilterBar {...defaultProps} selectedTags={[]} />);

      // No chips should be rendered when no tags selected
      const tagFilter = screen.getByLabelText(/filter by tags/i);
      expect(tagFilter).toBeInTheDocument();
    });

    it('should handle single available tag', async () => {
      const user = userEvent.setup();
      render(<RecipeFilterBar {...defaultProps} availableTags={['pasta']} />);

      // Open dropdown
      const tagFilter = screen.getByLabelText(/filter by tags/i);
      await user.click(tagFilter);

      // Only one tag should be available (MUI uses 'option' role for Select items, not 'menuitem')
      const tags = screen.getAllByRole('option');
      expect(tags).toHaveLength(1);
      expect(screen.getByText('pasta')).toBeInTheDocument();
    });

    it('should handle all tags being selected', () => {
      const allTags = ['pasta', 'italian', 'quick', 'vegetarian'];
      render(<RecipeFilterBar {...defaultProps} selectedTags={allTags} />);

      // All tags should be displayed as chips
      allTags.forEach((tag) => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });
  });

  describe('Layout responsiveness', () => {
    it('should render in horizontal layout', () => {
      const { container } = render(<RecipeFilterBar {...defaultProps} />);

      // Stack should exist with proper direction prop
      const stack = container.querySelector('.MuiStack-root');
      expect(stack).toBeInTheDocument();
    });

    it('should contain all three filter components', () => {
      render(<RecipeFilterBar {...defaultProps} />);

      expect(screen.getByLabelText(/filter by tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^sort$/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /favorites only/i })).toBeInTheDocument();
    });
  });
});
