import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EditHouseholdNameDialog } from './EditHouseholdNameDialog';

describe('EditHouseholdNameDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const currentName = 'Smith Family Kitchen';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with current name prefilled', () => {
    render(
      <EditHouseholdNameDialog
        open={true}
        currentName={currentName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Household Name')).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: /household name/i });
    expect(input).toHaveValue(currentName);
  });

  it('should not render when open is false', () => {
    render(
      <EditHouseholdNameDialog
        open={false}
        currentName={currentName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <EditHouseholdNameDialog
        open={true}
        currentName={currentName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should validate minimum length (1 character)', async () => {
    const user = userEvent.setup();

    render(
      <EditHouseholdNameDialog
        open={true}
        currentName={currentName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const input = screen.getByRole('textbox', { name: /household name/i });
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    // Clear input
    await user.clear(input);

    // Try to save with empty name
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/household name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate maximum length (100 characters)', async () => {
    const user = userEvent.setup();

    render(
      <EditHouseholdNameDialog
        open={true}
        currentName={currentName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const input = screen.getByRole('textbox', { name: /household name/i });
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    // Enter 101 characters
    const longName = 'a'.repeat(101);
    await user.clear(input);
    await user.type(input, longName);

    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/household name cannot exceed 100 characters/i)).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onSave with trimmed name when valid', async () => {
    const user = userEvent.setup();
    const newName = '  Johnson Family  ';

    render(
      <EditHouseholdNameDialog
        open={true}
        currentName={currentName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const input = screen.getByRole('textbox', { name: /household name/i });
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    await user.clear(input);
    await user.type(input, newName);
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('Johnson Family');
    });
  });

  it('should show server error when onSave throws', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to update household name';
    mockOnSave.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <EditHouseholdNameDialog
        open={true}
        currentName={currentName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should disable save button while saving', async () => {
    const user = userEvent.setup();
    let resolveSave: (value: void) => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    mockOnSave.mockReturnValueOnce(savePromise);

    render(
      <EditHouseholdNameDialog
        open={true}
        currentName={currentName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Button should be disabled while saving
    expect(saveButton).toBeDisabled();

    // Resolve the promise
    resolveSave!();

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('should close dialog after successful save', async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValueOnce(undefined);

    render(
      <EditHouseholdNameDialog
        open={true}
        currentName={currentName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should reset form when dialog opens with new name', () => {
    const { rerender } = render(
      <EditHouseholdNameDialog
        open={false}
        currentName={currentName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const newName = 'New Family Name';

    rerender(
      <EditHouseholdNameDialog
        open={true}
        currentName={newName}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByRole('textbox', { name: /household name/i })).toHaveValue(newName);
  });
});
