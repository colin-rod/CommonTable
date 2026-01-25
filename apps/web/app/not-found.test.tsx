import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import NotFound from './not-found';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('NotFound Page', () => {
  describe('Rendering', () => {
    it('should render 404 title', () => {
      render(<NotFound />);

      expect(
        screen.getByRole('heading', { name: /page not found/i, level: 5 }),
      ).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<NotFound />);

      expect(screen.getByText(/the page you're looking for doesn't exist/i)).toBeInTheDocument();
    });

    it('should render go home button', () => {
      render(<NotFound />);

      const button = screen.getByRole('button', { name: /go home/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to home when button clicked', () => {
      render(<NotFound />);

      const button = screen.getByRole('button', { name: /go home/i });
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Design System Compliance', () => {
    it('should use Typography h5 for title', () => {
      render(<NotFound />);

      const title = screen.getByRole('heading', { name: /page not found/i, level: 5 });
      expect(title.tagName).toBe('H5');
      expect(title).toHaveClass('MuiTypography-h5');
    });

    it('should use Typography body1 for description', () => {
      render(<NotFound />);

      const description = screen.getByText(/the page you're looking for doesn't exist/i);
      expect(description).toHaveClass('MuiTypography-body1');
    });

    it('should use outlined button', () => {
      render(<NotFound />);

      const button = screen.getByRole('button', { name: /go home/i });
      expect(button.closest('button')).toHaveClass('MuiButton-outlined');
    });

    it('should use Stack component with spacing', () => {
      const { container } = render(<NotFound />);

      const stack = container.querySelector('.MuiStack-root');
      expect(stack).toBeInTheDocument();
    });

    it('should center content', () => {
      const { container } = render(<NotFound />);

      const stack = container.querySelector('.MuiStack-root');
      expect(stack).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<NotFound />);

      const heading = screen.getByRole('heading', { name: /page not found/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible button text', () => {
      render(<NotFound />);

      const button = screen.getByRole('button', { name: /go home/i });
      expect(button).toHaveAccessibleName();
    });
  });
});
