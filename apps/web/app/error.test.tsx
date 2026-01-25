import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import ErrorPage from './error';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe('Error Page', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Test error message');

  describe('Rendering', () => {
    it('should render error title', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(
        screen.getByRole('heading', { name: /something went wrong/i, level: 5 }),
      ).toBeInTheDocument();
    });

    it('should render error description', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByText(/an error occurred\. please try again/i)).toBeInTheDocument();
    });

    it('should render retry button', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should call reset when retry button clicked', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const button = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(button);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Design System Compliance', () => {
    it('should use Typography h5 for title', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const title = screen.getByRole('heading', { name: /something went wrong/i, level: 5 });
      expect(title.tagName).toBe('H5');
      expect(title).toHaveClass('MuiTypography-h5');
    });

    it('should use Typography body1 for description', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const description = screen.getByText(/an error occurred\. please try again/i);
      expect(description).toHaveClass('MuiTypography-body1');
    });

    it('should use contained primary button', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const button = screen.getByRole('button', { name: /try again/i });
      expect(button.closest('button')).toHaveClass('MuiButton-contained');
      expect(button.closest('button')).toHaveClass('MuiButton-colorPrimary');
    });

    it('should use Stack component with spacing', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const stack = container.querySelector('.MuiStack-root');
      expect(stack).toBeInTheDocument();
    });

    it('should center content', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const stack = container.querySelector('.MuiStack-root');
      expect(stack).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const heading = screen.getByRole('heading', { name: /something went wrong/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible button text', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toHaveAccessibleName();
    });
  });
});
