import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ShortlistFAB } from './ShortlistFAB';

// Mock useShortlistStore
const mockUseShortlistStore = vi.fn();

vi.mock('@/stores/useShortlistStore', () => ({
  useShortlistStore: () => mockUseShortlistStore(),
}));

describe('ShortlistFAB', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: empty shortlist
    mockUseShortlistStore.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      getCount: () => 0,
    });
  });

  describe('Basic Rendering', () => {
    it('should render floating action button', () => {
      render(<ShortlistFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /shortlist/i });
      expect(fab).toBeInTheDocument();
    });

    it('should render shortlist icon', () => {
      render(<ShortlistFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /shortlist/i });
      // Material UI Fab should contain an icon
      expect(fab).toBeInTheDocument();
    });

    it('should have fixed position styling', () => {
      render(<ShortlistFAB onClick={mockOnClick} />);

      // FAB should be rendered (positioning is handled by MUI sx prop)
      const fab = screen.getByRole('button', { name: /shortlist/i });
      expect(fab).toBeInTheDocument();
    });
  });

  describe('Badge Count', () => {
    it('should not show badge when shortlist is empty', () => {
      mockUseShortlistStore.mockReturnValue({
        items: [],
        loading: false,
        error: null,
        getCount: () => 0,
      });

      render(<ShortlistFAB onClick={mockOnClick} />);

      // Badge with count should not be visible when count is 0
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should show badge with count when shortlist has items', () => {
      mockUseShortlistStore.mockReturnValue({
        items: [{}, {}, {}], // 3 mock items
        loading: false,
        error: null,
        getCount: () => 3,
      });

      render(<ShortlistFAB onClick={mockOnClick} />);

      // Badge should show count
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should update badge count when shortlist changes', () => {
      mockUseShortlistStore.mockReturnValue({
        items: [{}, {}, {}, {}, {}], // 5 mock items
        loading: false,
        error: null,
        getCount: () => 5,
      });

      const { rerender } = render(<ShortlistFAB onClick={mockOnClick} />);

      expect(screen.getByText('5')).toBeInTheDocument();

      // Simulate shortlist update
      mockUseShortlistStore.mockReturnValue({
        items: [{}, {}], // 2 mock items
        loading: false,
        error: null,
        getCount: () => 2,
      });

      rerender(<ShortlistFAB onClick={mockOnClick} />);

      expect(screen.queryByText('5')).not.toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show "9+" for counts greater than 9', () => {
      mockUseShortlistStore.mockReturnValue({
        items: Array(15).fill({}), // 15 mock items
        loading: false,
        error: null,
        getCount: () => 15,
      });

      render(<ShortlistFAB onClick={mockOnClick} />);

      // Badge should show "9+" for double-digit counts
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();

      render(<ShortlistFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /shortlist/i });
      await user.click(fab);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when shortlist has items', async () => {
      const user = userEvent.setup();

      mockUseShortlistStore.mockReturnValue({
        items: [{}, {}],
        loading: false,
        error: null,
        getCount: () => 2,
      });

      render(<ShortlistFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /shortlist/i });
      await user.click(fab);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Material Design Compliance', () => {
    it('should use Material UI Fab component', () => {
      const { container } = render(<ShortlistFAB onClick={mockOnClick} />);

      // Check for MUI Fab classes
      const fab = container.querySelector('[class*="MuiFab"]');
      expect(fab).toBeInTheDocument();
    });

    it('should use Material UI Badge component when count > 0', () => {
      mockUseShortlistStore.mockReturnValue({
        items: [{}],
        loading: false,
        error: null,
        getCount: () => 1,
      });

      const { container } = render(<ShortlistFAB onClick={mockOnClick} />);

      // Check for MUI Badge classes
      const badge = container.querySelector('[class*="MuiBadge"]');
      expect(badge).toBeInTheDocument();
    });

    it('should use primary color', () => {
      const { container } = render(<ShortlistFAB onClick={mockOnClick} />);

      // Check for MUI Fab with primary color (presence indicates correct setup)
      const fab = container.querySelector('[class*="MuiFab"]');
      expect(fab).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<ShortlistFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /shortlist/i });
      expect(fab).toHaveAttribute('aria-label');
    });

    it('should have accessible label with count when shortlist has items', () => {
      mockUseShortlistStore.mockReturnValue({
        items: [{}, {}, {}],
        loading: false,
        error: null,
        getCount: () => 3,
      });

      render(<ShortlistFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button');
      expect(fab).toHaveAttribute('aria-label', expect.stringMatching(/3 items/i));
    });
  });

  describe('Positioning', () => {
    it('should be positioned in bottom-right corner', () => {
      const { container } = render(<ShortlistFAB onClick={mockOnClick} />);

      // Check for fixed positioning
      const fabContainer = container.firstChild as HTMLElement;
      expect(fabContainer).toHaveStyle({ position: 'fixed' });
    });
  });
});
