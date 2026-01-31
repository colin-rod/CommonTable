import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { CalendarEmptyState } from './CalendarEmptyState';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('CalendarEmptyState', () => {
  describe('Rendering', () => {
    it('should render empty state message', () => {
      render(<CalendarEmptyState />);

      expect(
        screen.getByRole('heading', { name: /no meals planned/i, level: 6 }),
      ).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<CalendarEmptyState />);

      expect(screen.getByText(/add meals to your calendar to plan the week/i)).toBeInTheDocument();
    });

    it('should render add meal button', () => {
      render(<CalendarEmptyState />);

      const button = screen.getByRole('button', { name: /add meal/i });
      expect(button).toBeInTheDocument();
    });

    it('should render calendar icon', () => {
      render(<CalendarEmptyState />);

      // Material Icon has data-testid
      const icon = screen.getByTestId('CalendarTodayIcon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to calendar page when button clicked', () => {
      render(<CalendarEmptyState />);

      const button = screen.getByRole('button', { name: /add meal/i });
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/calendar');
    });
  });

  describe('Design System Compliance', () => {
    it('should use Typography h6 for title', () => {
      render(<CalendarEmptyState />);

      const title = screen.getByRole('heading', { name: /no meals planned/i, level: 6 });
      expect(title.tagName).toBe('H6');
      expect(title).toHaveClass('MuiTypography-h6');
    });

    it('should use Typography body2 for description', () => {
      render(<CalendarEmptyState />);

      const description = screen.getByText(/add meals to your calendar to plan the week/i);
      expect(description).toHaveClass('MuiTypography-body2');
    });

    it('should use contained primary button', () => {
      render(<CalendarEmptyState />);

      const button = screen.getByRole('button', { name: /add meal/i });
      expect(button.closest('button')).toHaveClass('MuiButton-contained');
      expect(button.closest('button')).toHaveClass('MuiButton-colorPrimary');
    });

    it('should use Stack component with spacing', () => {
      render(<CalendarEmptyState />);

      const container = screen.getByTestId('CalendarTodayIcon').closest('.MuiStack-root');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<CalendarEmptyState />);

      const heading = screen.getByRole('heading', { name: /no meals planned/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible button text', () => {
      render(<CalendarEmptyState />);

      const button = screen.getByRole('button', { name: /add meal/i });
      expect(button).toHaveAccessibleName();
    });
  });
});
