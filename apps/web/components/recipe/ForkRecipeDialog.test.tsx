import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForkRecipeDialog } from './ForkRecipeDialog';

describe('ForkRecipeDialog Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(
        <ForkRecipeDialog
          open={false}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.queryByText(/fork recipe/i)).not.toBeInTheDocument();
    });

    it('should render dialog when open is true', () => {
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText(/fork recipe/i)).toBeInTheDocument();
    });

    it('should pre-fill title with "Copy of {originalTitle}"', () => {
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i) as HTMLInputElement;
      expect(input.value).toBe('Copy of Pasta Carbonara');
    });

    it('should render description text', () => {
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(
        screen.getByText(/create a copy of this recipe that you can modify independently/i),
      ).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render fork button', () => {
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('button', { name: /^fork$/i })).toBeInTheDocument();
    });
  });

  describe('Title editing', () => {
    it('should allow editing new recipe title', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);

      await user.clear(input);
      await user.type(input, 'My Custom Carbonara');

      expect(input).toHaveValue('My Custom Carbonara');
    });

    it('should show error when title is empty', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);

      await user.clear(input);

      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    it('should autofocus title input when dialog opens', () => {
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);
      expect(input).toHaveFocus();
    });
  });

  describe('User interaction', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
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

    it('should call onConfirm with new title when fork button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const forkButton = screen.getByRole('button', { name: /^fork$/i });
      await user.click(forkButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('Copy of Pasta Carbonara');
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onConfirm with custom title', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);
      await user.clear(input);
      await user.type(input, 'My Amazing Recipe');

      const forkButton = screen.getByRole('button', { name: /^fork$/i });
      await user.click(forkButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('My Amazing Recipe');
    });

    it('should trim whitespace from title', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);
      await user.clear(input);
      await user.type(input, '  Spaced Title  ');

      const forkButton = screen.getByRole('button', { name: /^fork$/i });
      await user.click(forkButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('Spaced Title');
    });

    it('should support Enter key to confirm', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);
      await user.clear(input);
      await user.type(input, 'Quick Fork{Enter}');

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('Quick Fork');
      });
    });
  });

  describe('Validation', () => {
    it('should disable fork button if title is empty', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);
      await user.clear(input);

      const forkButton = screen.getByRole('button', { name: /^fork$/i });
      expect(forkButton).toBeDisabled();
    });

    it('should disable fork button if title is only whitespace', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);
      await user.clear(input);
      await user.type(input, '   ');

      const forkButton = screen.getByRole('button', { name: /^fork$/i });
      expect(forkButton).toBeDisabled();
    });

    it('should not call onConfirm if title is empty', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);
      await user.clear(input);

      const forkButton = screen.getByRole('button', { name: /^fork$/i });

      // Button is disabled when title is empty, cannot be clicked
      expect(forkButton).toBeDisabled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('should show "Forking..." when loading', () => {
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          loading={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('button', { name: /forking/i })).toBeInTheDocument();
    });

    it('should disable input field during loading', () => {
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          loading={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);
      expect(input).toBeDisabled();
    });

    it('should disable cancel button during loading', () => {
      render(
        <ForkRecipeDialog
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

    it('should disable fork button during loading', () => {
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          loading={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const forkButton = screen.getByRole('button', { name: /forking/i });
      expect(forkButton).toBeDisabled();
    });

    it('should not allow Enter key during loading', async () => {
      const user = userEvent.setup();
      render(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          loading={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i);
      await user.type(input, '{Enter}');

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Dialog reset on open', () => {
    it('should reset title when dialog reopens', () => {
      const { rerender } = render(
        <ForkRecipeDialog
          open={false}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      // Open dialog
      rerender(
        <ForkRecipeDialog
          open={true}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const input = screen.getByLabelText(/new recipe title/i) as HTMLInputElement;
      expect(input.value).toBe('Copy of Pasta Carbonara');

      // Close dialog
      rerender(
        <ForkRecipeDialog
          open={false}
          recipeName="Pasta Carbonara"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      // Reopen with different recipe name
      rerender(
        <ForkRecipeDialog
          open={true}
          recipeName="Chicken Curry"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const newInput = screen.getByLabelText(/new recipe title/i) as HTMLInputElement;
      expect(newInput.value).toBe('Copy of Chicken Curry');
    });
  });
});
