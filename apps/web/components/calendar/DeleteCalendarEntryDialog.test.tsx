import type { CalendarEntry, CalendarEntryId, RecipeId } from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { DeleteCalendarEntryDialog } from './DeleteCalendarEntryDialog';

describe('DeleteCalendarEntryDialog', () => {
  const mockEntry: CalendarEntry = {
    id: 'entry-1' as CalendarEntryId,
    household_id: 'household-1' as any,
    recipe_id: 'recipe-1' as RecipeId,
    planned_date: new Date('2026-01-20'),
    meal_slot: 'dinner',
    status: 'planned',
    notes: 'Family dinner',
    created_by: 'user-1' as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    entry: mockEntry,
  };

  it('should render dialog when open', () => {
    render(<DeleteCalendarEntryDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Meal Entry')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(<DeleteCalendarEntryDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should not render when entry is null', () => {
    render(<DeleteCalendarEntryDialog {...defaultProps} entry={null} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render Cancel and Delete buttons', () => {
    render(<DeleteCalendarEntryDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });

  it('should display entry details for recipe entry', () => {
    render(<DeleteCalendarEntryDialog {...defaultProps} />);

    expect(
      screen.getByText(/remove recipe entry from tuesday, january 20 \(dinner\)/i),
    ).toBeInTheDocument();
  });

  it('should display entry details for notes-only entry', () => {
    const notesOnlyEntry = { ...mockEntry, recipe_id: null };

    render(<DeleteCalendarEntryDialog {...defaultProps} entry={notesOnlyEntry} />);

    expect(screen.getByText(/remove notes-only entry from/i)).toBeInTheDocument();
  });

  it('should display notes when present', () => {
    render(<DeleteCalendarEntryDialog {...defaultProps} />);

    expect(screen.getByText(/notes: family dinner/i)).toBeInTheDocument();
  });

  it('should not display notes section when notes are null', () => {
    const entryWithoutNotes = { ...mockEntry, notes: null };

    render(<DeleteCalendarEntryDialog {...defaultProps} entry={entryWithoutNotes} />);

    expect(screen.queryByText(/notes:/i)).not.toBeInTheDocument();
  });

  it('should call onConfirm when Delete clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(<DeleteCalendarEntryDialog {...defaultProps} onConfirm={onConfirm} />);

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onClose when Cancel clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<DeleteCalendarEntryDialog {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose after successful deletion', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<DeleteCalendarEntryDialog {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should disable buttons while deleting', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));

    render(<DeleteCalendarEntryDialog {...defaultProps} onConfirm={onConfirm} />);

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(deleteButton);

    // Check buttons are disabled
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  it('should format breakfast meal slot correctly', () => {
    const breakfastEntry = { ...mockEntry, meal_slot: 'breakfast' as const };

    render(<DeleteCalendarEntryDialog {...defaultProps} entry={breakfastEntry} />);

    expect(screen.getByText(/breakfast/i)).toBeInTheDocument();
  });

  it('should format lunch meal slot correctly', () => {
    const lunchEntry = { ...mockEntry, meal_slot: 'lunch' as const };

    render(<DeleteCalendarEntryDialog {...defaultProps} entry={lunchEntry} />);

    expect(screen.getByText(/lunch/i)).toBeInTheDocument();
  });

  it('should format snack meal slot correctly', () => {
    const snackEntry = { ...mockEntry, meal_slot: 'snack' as const };

    render(<DeleteCalendarEntryDialog {...defaultProps} entry={snackEntry} />);

    expect(screen.getByText(/snack/i)).toBeInTheDocument();
  });

  it('should format date correctly for different dates', () => {
    const differentDateEntry = {
      ...mockEntry,
      planned_date: new Date('2026-02-15'),
    };

    render(<DeleteCalendarEntryDialog {...defaultProps} entry={differentDateEntry} />);

    expect(screen.getByText(/sunday, february 15/i)).toBeInTheDocument();
  });
});
