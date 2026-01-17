import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RestoreVersionDialog } from './RestoreVersionDialog';

describe('RestoreVersionDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    open: true,
    recipeName: 'Pasta Carbonara',
    versionNumber: 2,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      render(<RestoreVersionDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Restore Version')).toBeInTheDocument();
    });

    it('does not render dialog when closed', () => {
      render(<RestoreVersionDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays recipe name and version number in confirmation message', () => {
      render(<RestoreVersionDialog {...defaultProps} />);

      expect(screen.getByText(/Pasta Carbonara/)).toBeInTheDocument();
      // Version 2 appears in both the question and explanation - just check dialog contains it
      expect(screen.getByText(/Restore "Pasta Carbonara" to Version 2/)).toBeInTheDocument();
    });

    it('displays explanation about preserving history', () => {
      render(<RestoreVersionDialog {...defaultProps} />);

      expect(screen.getByText(/create a new version/i)).toBeInTheDocument();
      expect(screen.getByText(/current version will be preserved/i)).toBeInTheDocument();
    });

    it('renders Cancel and Restore buttons', () => {
      render(<RestoreVersionDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    it('Cancel button should be outlined', () => {
      render(<RestoreVersionDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      // Check that it has the outlined class
      expect(cancelButton).toHaveClass('MuiButton-outlined');
    });

    it('Restore button should be outlined (secondary action)', () => {
      render(<RestoreVersionDialog {...defaultProps} />);

      const restoreButton = screen.getByRole('button', { name: /restore/i });
      // Per plan: restore is outlined (secondary), not primary
      expect(restoreButton).toHaveClass('MuiButton-outlined');
    });
  });

  describe('Interactions', () => {
    it('calls onConfirm when Restore button is clicked', async () => {
      const user = userEvent.setup();

      render(<RestoreVersionDialog {...defaultProps} />);

      const restoreButton = screen.getByRole('button', { name: /restore/i });
      await user.click(restoreButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(<RestoreVersionDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when Escape key is pressed', async () => {
      const user = userEvent.setup();

      render(<RestoreVersionDialog {...defaultProps} />);

      // Press Escape key to close the dialog
      await user.keyboard('{Escape}');
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('disables buttons when loading', () => {
      render(<RestoreVersionDialog {...defaultProps} loading={true} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /restoring/i })).toBeDisabled();
    });

    it('shows "Restoring..." text when loading', () => {
      render(<RestoreVersionDialog {...defaultProps} loading={true} />);

      expect(screen.getByRole('button', { name: /restoring/i })).toBeInTheDocument();
    });

    it('shows "Restore" text when not loading', () => {
      render(<RestoreVersionDialog {...defaultProps} loading={false} />);

      expect(screen.getByRole('button', { name: /^restore$/i })).toBeInTheDocument();
    });
  });
});
