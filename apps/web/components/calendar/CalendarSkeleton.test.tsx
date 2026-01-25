import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CalendarSkeleton } from './CalendarSkeleton';

describe('CalendarSkeleton', () => {
  describe('Rendering', () => {
    it('should render skeleton grid', () => {
      const { container } = render(<CalendarSkeleton />);

      // Grid component should be present
      const grid = container.querySelector('.MuiBox-root');
      expect(grid).toBeInTheDocument();
    });

    it('should render 7 day column skeletons', () => {
      const { container } = render(<CalendarSkeleton />);

      // Count day columns (7 days in a week)
      const dayColumns = container.querySelectorAll('[data-testid="day-column-skeleton"]');
      expect(dayColumns).toHaveLength(7);
    });

    it('should render rectangular skeletons for day headers', () => {
      const { container } = render(<CalendarSkeleton />);

      const rectangularSkeletons = container.querySelectorAll('.MuiSkeleton-rectangular');
      // Should have at least 7 (one per day column header)
      expect(rectangularSkeletons.length).toBeGreaterThanOrEqual(7);
    });

    it('should render meal slot skeletons', () => {
      const { container } = render(<CalendarSkeleton />);

      // Each day should have meal slot skeletons
      const mealSlots = container.querySelectorAll('[data-testid="meal-slot-skeleton"]');
      expect(mealSlots.length).toBeGreaterThan(0);
    });
  });

  describe('Structure', () => {
    it('should render 4 meal slots per day by default', () => {
      const { container } = render(<CalendarSkeleton />);

      // Count meal slots in first day column
      const firstDayColumn = container.querySelector('[data-testid="day-column-skeleton"]');
      const mealSlots = firstDayColumn?.querySelectorAll('[data-testid="meal-slot-skeleton"]');
      expect(mealSlots).toHaveLength(4);
    });

    it('should match WeekGrid structure', () => {
      const { container } = render(<CalendarSkeleton />);

      // Should have grid layout
      const grid = container.querySelector('.MuiBox-root');
      expect(grid).toBeInTheDocument();

      // Should have 7 columns
      const dayColumns = container.querySelectorAll('[data-testid="day-column-skeleton"]');
      expect(dayColumns).toHaveLength(7);
    });
  });

  describe('Design System Compliance', () => {
    it('should use Box component for grid', () => {
      const { container } = render(<CalendarSkeleton />);

      const grid = container.querySelector('.MuiBox-root');
      expect(grid).toBeInTheDocument();
    });

    it('should use Skeleton components', () => {
      const { container } = render(<CalendarSkeleton />);

      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should use Stack for day columns', () => {
      const { container } = render(<CalendarSkeleton />);

      const stacks = container.querySelectorAll('.MuiStack-root');
      // Should have at least 7 stacks (one per day)
      expect(stacks.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label for loading state', () => {
      const { container } = render(<CalendarSkeleton />);

      const grid = container.querySelector('[aria-label="Loading calendar"]');
      expect(grid).toBeInTheDocument();
    });
  });
});
