import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MealPlanDrawer } from './MealPlanDrawer';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useMealPlan hook
const mockUseMealPlan = vi.fn();

vi.mock('@/hooks/useMealPlan', () => ({
  useMealPlan: () => mockUseMealPlan(),
}));

describe('MealPlanDrawer', () => {
  const mockOnClose = vi.fn();
  const mockRemoveFromMealPlan = vi.fn();
  const mockMarkAsCooked = vi.fn();

  const mockEntry1 = {
    id: 'entry-1',
    recipe_id: 'recipe-1',
    recipe: {
      id: 'recipe-1',
      title: 'Pasta Carbonara',
    },
    position: 1,
  };

  const mockEntry2 = {
    id: 'entry-2',
    recipe_id: 'recipe-2',
    recipe: {
      id: 'recipe-2',
      title: 'Caesar Salad',
    },
    position: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseMealPlan.mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      count: 0,
      removeFromMealPlan: mockRemoveFromMealPlan,
      markAsCooked: mockMarkAsCooked,
    });
  });

  describe('Basic Rendering', () => {
    it('should render drawer when open', () => {
      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      expect(screen.getByText('Meal Plan')).toBeInTheDocument();
    });

    it('should not render content when closed', () => {
      render(<MealPlanDrawer open={false} onClose={mockOnClose} />);

      expect(screen.queryByText('Meal Plan')).not.toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no entries', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [],
        loading: false,
        error: null,
        count: 0,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      expect(screen.getByText(/no recipes in meal plan/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [],
        loading: true,
        error: null,
        count: 0,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when error occurs', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [],
        loading: false,
        error: new Error('Failed to load'),
        count: 0,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  describe('Meal Plan Items', () => {
    it('should display meal plan entries', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [mockEntry1, mockEntry2],
        loading: false,
        error: null,
        count: 2,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
    });

    it('should show count in header', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [mockEntry1, mockEntry2],
        loading: false,
        error: null,
        count: 2,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      expect(screen.getByText('Meal Plan (2)')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to recipe when clicked', async () => {
      const user = userEvent.setup();

      mockUseMealPlan.mockReturnValue({
        entries: [mockEntry1],
        loading: false,
        error: null,
        count: 1,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      await user.click(screen.getByText('Pasta Carbonara'));

      expect(mockPush).toHaveBeenCalledWith('/recipes/recipe-1');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have link to full meal plan page', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [mockEntry1],
        loading: false,
        error: null,
        count: 1,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      expect(screen.getByText(/view full meal plan/i)).toBeInTheDocument();
    });

    it('should navigate to meal plan page when link clicked', async () => {
      const user = userEvent.setup();

      mockUseMealPlan.mockReturnValue({
        entries: [mockEntry1],
        loading: false,
        error: null,
        count: 1,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      await user.click(screen.getByText(/view full meal plan/i));

      expect(mockPush).toHaveBeenCalledWith('/meal-plan');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Remove Action', () => {
    it('should call removeFromMealPlan when remove button clicked', async () => {
      const user = userEvent.setup();

      mockUseMealPlan.mockReturnValue({
        entries: [mockEntry1],
        loading: false,
        error: null,
        count: 1,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      const removeButton = screen.getByRole('button', { name: /remove pasta carbonara/i });
      await user.click(removeButton);

      expect(mockRemoveFromMealPlan).toHaveBeenCalledWith('entry-1');
    });
  });

  describe('Mark as Cooked Action', () => {
    it('should call markAsCooked when button clicked', async () => {
      const user = userEvent.setup();

      mockUseMealPlan.mockReturnValue({
        entries: [mockEntry1],
        loading: false,
        error: null,
        count: 1,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      const cookButton = screen.getByRole('button', { name: /mark pasta carbonara as cooked/i });
      await user.click(cookButton);

      expect(mockMarkAsCooked).toHaveBeenCalledWith('entry-1');
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Material Design Compliance', () => {
    it('should render drawer with correct structure', () => {
      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      // Verify drawer content is rendered with proper structure
      expect(screen.getByRole('presentation')).toBeInTheDocument();
      expect(screen.getByText('Meal Plan')).toBeInTheDocument();
    });

    it('should render list when entries exist', () => {
      mockUseMealPlan.mockReturnValue({
        entries: [mockEntry1],
        loading: false,
        error: null,
        count: 1,
        removeFromMealPlan: mockRemoveFromMealPlan,
        markAsCooked: mockMarkAsCooked,
      });

      render(<MealPlanDrawer open={true} onClose={mockOnClose} />);

      // Verify list items are rendered
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });
});
