import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WelcomeDialog } from './WelcomeDialog';

describe('WelcomeDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dialog Visibility', () => {
    it('should render when open is true', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(<WelcomeDialog open={false} onClose={mockOnClose} onComplete={mockOnComplete} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Step 1: Welcome', () => {
    it('should show welcome message on first step', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      expect(
        screen.getByRole('heading', { name: /welcome to commontable/i, level: 5 }),
      ).toBeInTheDocument();
      expect(screen.getByText(/your shared household recipe book/i)).toBeInTheDocument();
    });

    it('should show next button on first step', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeInTheDocument();
      expect(nextButton.closest('button')).toHaveClass('MuiButton-contained');
    });

    it('should show skip button on first step', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      const skipButton = screen.getByRole('button', { name: /skip/i });
      expect(skipButton).toBeInTheDocument();
      expect(skipButton.closest('button')).toHaveClass('MuiButton-outlined');
    });

    it('should not show back button on first step', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    it('should call onClose when skip button clicked on first step', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should move to step 2 when next button clicked', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(screen.getByRole('heading', { name: /key features/i, level: 5 })).toBeInTheDocument();
    });
  });

  describe('Step 2: Feature Highlights', () => {
    beforeEach(() => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
    });

    it('should show feature highlights on second step', () => {
      expect(screen.getByRole('heading', { name: /key features/i, level: 5 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^recipes$/i, level: 6 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^calendar$/i, level: 6 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^requests$/i, level: 6 })).toBeInTheDocument();
    });

    it('should show back button on second step', () => {
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton.closest('button')).toHaveClass('MuiButton-outlined');
    });

    it('should show next button on second step', () => {
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should show skip button on second step', () => {
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    });

    it('should move back to step 1 when back button clicked', () => {
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(
        screen.getByRole('heading', { name: /welcome to commontable/i, level: 5 }),
      ).toBeInTheDocument();
    });

    it('should move to step 3 when next button clicked', () => {
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(screen.getByRole('heading', { name: /get started/i, level: 5 })).toBeInTheDocument();
    });
  });

  describe('Step 3: Get Started', () => {
    beforeEach(() => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);
      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
    });

    it('should show get started message on third step', () => {
      expect(screen.getByRole('heading', { name: /get started/i, level: 5 })).toBeInTheDocument();
      expect(screen.getByText(/ready to add your first recipe/i)).toBeInTheDocument();
    });

    it('should show back button on third step', () => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should show add first recipe button on third step', () => {
      const addButton = screen.getByRole('button', { name: /add first recipe/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton.closest('button')).toHaveClass('MuiButton-contained');
      expect(addButton.closest('button')).toHaveClass('MuiButton-colorPrimary');
    });

    it('should show skip button on third step', () => {
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    });

    it('should not show next button on third step', () => {
      expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
    });

    it('should move back to step 2 when back button clicked', () => {
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(screen.getByRole('heading', { name: /key features/i, level: 5 })).toBeInTheDocument();
    });

    it('should call onComplete when add first recipe button clicked', () => {
      const addButton = screen.getByRole('button', { name: /add first recipe/i });
      fireEvent.click(addButton);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when skip button clicked on third step', () => {
      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Design System Compliance', () => {
    it('should use Typography h5 for dialog titles', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      const title = screen.getByRole('heading', { name: /welcome to commontable/i, level: 5 });
      expect(title.tagName).toBe('H5');
      expect(title).toHaveClass('MuiTypography-h5');
    });

    it('should use Typography body1 for content', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      const content = screen.getByText(/your shared household recipe book/i);
      expect(content).toHaveClass('MuiTypography-body1');
    });

    it('should use allowed button variants', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      const skipButton = screen.getByRole('button', { name: /skip/i });

      // Next button should be contained primary
      expect(nextButton.closest('button')).toHaveClass('MuiButton-contained');
      expect(nextButton.closest('button')).toHaveClass('MuiButton-colorPrimary');

      // Skip button should be outlined
      expect(skipButton.closest('button')).toHaveClass('MuiButton-outlined');
    });

    it('should use Dialog component', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('MuiDialog-paper');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for buttons', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    });

    it('should have dialog role', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} onComplete={mockOnComplete} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
