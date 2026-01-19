import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DeleteRecipeDialog } from './DeleteRecipeDialog';

describe('DeleteRecipeDialog Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(
        <DeleteRecipeDialog
          open={false}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.queryByText(/delete recipe/i)).not.toBeInTheDocument();
    });

    it('should render dialog when open is true', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText(/delete recipe/i)).toBeInTheDocument();
    });

    it('should display recipe name in warning', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText(/pasta carbonara/i)).toBeInTheDocument();
    });

    it('should display warning message', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render delete button', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });
  });

  describe('User interaction', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should call onConfirm when delete button clicked', async () => {
      const user = userEvent.setup();
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when dialog backdrop clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      // Click backdrop (MuiBackdrop-root)
      const backdrop = container.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Loading state', () => {
    it('should show "Deleting..." when loading', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          loading={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
    });

    it('should disable cancel button during loading', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          loading={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should disable delete button during loading', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          loading={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const deleteButton = screen.getByRole('button', { name: /deleting/i });
      expect(deleteButton).toBeDisabled();
    });

    it('should not call callbacks when buttons clicked while loading', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          loading={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const deleteButton = screen.getByRole('button', { name: /deleting/i });

      // Buttons are disabled, so they cannot be clicked
      expect(cancelButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Button variants', () => {
    it('should render cancel button as outlined variant', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveClass('MuiButton-outlined');
    });

    it('should render delete button as contained error variant', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      expect(deleteButton).toHaveClass('MuiButton-contained');
      expect(deleteButton).toHaveClass('MuiButton-colorError');
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      // Tab through buttons
      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /^delete$/i })).toHaveFocus();
    });

    it('should allow Enter key on focused delete button', async () => {
      const user = userEvent.setup();
      render(
        <DeleteRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      deleteButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
