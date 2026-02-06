import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MealPlanFAB } from './MealPlanFAB';

// Mock useMealPlan hook
const mockUseMealPlan = vi.fn();

vi.mock('@/hooks/useMealPlan', () => ({
  useMealPlan: () => mockUseMealPlan(),
}));

describe('MealPlanFAB', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: empty meal plan
    mockUseMealPlan.mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      count: 0,
    });
  });

  describe('Basic Rendering', () => {
    it('should render floating action button', () => {
      render(<MealPlanFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /meal plan/i });
      expect(fab).toBeInTheDocument();
    });

    it('should render meal plan icon', () => {
      render(<MealPlanFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /meal plan/i });
      expect(fab).toBeInTheDocument();
    });

    it('should have fixed position styling', () => {
      render(<MealPlanFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /meal plan/i });
      expect(fab).toBeInTheDocument();
    });
  });

  describe('Badge Count', () => {
    it('should not show badge when meal plan is empty', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [],
        loading: false,
        error: null,
        count: 0,
      });

      render(<MealPlanFAB onClick={mockOnClick} />);

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should show badge with count when meal plan has items', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [{}, {}, {}],
        loading: false,
        error: null,
        count: 3,
      });

      render(<MealPlanFAB onClick={mockOnClick} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should update badge count when meal plan changes', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [{}, {}, {}, {}, {}],
        loading: false,
        error: null,
        count: 5,
      });

      const { rerender } = render(<MealPlanFAB onClick={mockOnClick} />);

      expect(screen.getByText('5')).toBeInTheDocument();

      mockUseMealPlan.mockReturnValue({
        entries: [{}, {}],
        loading: false,
        error: null,
        count: 2,
      });

      rerender(<MealPlanFAB onClick={mockOnClick} />);

      expect(screen.queryByText('5')).not.toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show "9+" for counts greater than 9', () => {
      mockUseMealPlan.mockReturnValue({
        entries: Array(15).fill({}),
        loading: false,
        error: null,
        count: 15,
      });

      render(<MealPlanFAB onClick={mockOnClick} />);

      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();

      render(<MealPlanFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /meal plan/i });
      await user.click(fab);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when meal plan has items', async () => {
      const user = userEvent.setup();

      mockUseMealPlan.mockReturnValue({
        entries: [{}, {}],
        loading: false,
        error: null,
        count: 2,
      });

      render(<MealPlanFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /meal plan/i });
      await user.click(fab);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Material Design Compliance', () => {
    it('should use Material UI Fab component', () => {
      const { container } = render(<MealPlanFAB onClick={mockOnClick} />);

      const fab = container.querySelector('[class*="MuiFab"]');
      expect(fab).toBeInTheDocument();
    });

    it('should use Material UI Badge component when count > 0', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [{}],
        loading: false,
        error: null,
        count: 1,
      });

      const { container } = render(<MealPlanFAB onClick={mockOnClick} />);

      const badge = container.querySelector('[class*="MuiBadge"]');
      expect(badge).toBeInTheDocument();
    });

    it('should use primary color', () => {
      const { container } = render(<MealPlanFAB onClick={mockOnClick} />);

      const fab = container.querySelector('[class*="MuiFab"]');
      expect(fab).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<MealPlanFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button', { name: /meal plan/i });
      expect(fab).toHaveAttribute('aria-label');
    });

    it('should have accessible label with count when meal plan has items', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [{}, {}, {}],
        loading: false,
        error: null,
        count: 3,
      });

      render(<MealPlanFAB onClick={mockOnClick} />);

      const fab = screen.getByRole('button');
      expect(fab).toHaveAttribute('aria-label', expect.stringMatching(/3 items/i));
    });
  });

  describe('Positioning', () => {
    it('should be positioned in bottom-right corner', () => {
      const { container } = render(<MealPlanFAB onClick={mockOnClick} />);

      const fabContainer = container.firstChild as HTMLElement;
      expect(fabContainer).toHaveStyle({ position: 'fixed' });
    });
  });
});
