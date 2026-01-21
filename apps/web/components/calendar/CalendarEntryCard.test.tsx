import type { CalendarEntry, CalendarEntryId } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { CalendarEntryCard } from './CalendarEntryCard';

describe('CalendarEntryCard', () => {
  const mockEntry: CalendarEntry = {
    id: 'entry-1' as CalendarEntryId,
    household_id: 'household-1' as any,
    recipe_id: 'recipe-1' as any,
    planned_date: new Date('2026-01-20'),
    meal_slot: 'dinner',
    status: 'planned',
    notes: 'Family dinner',
    created_by: 'user-1' as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const defaultProps = {
    entry: mockEntry,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onMarkComplete: vi.fn(),
  };

  it('should render recipe assigned indicator when recipe_id exists', () => {
    render(<CalendarEntryCard {...defaultProps} />);

    expect(screen.getByText('Recipe assigned')).toBeInTheDocument();
  });

  it('should render notes-only indicator when no recipe_id', () => {
    const entryWithoutRecipe = { ...mockEntry, recipe_id: null };

    render(<CalendarEntryCard {...defaultProps} entry={entryWithoutRecipe} />);

    expect(screen.getByText('Notes only')).toBeInTheDocument();
  });

  it('should display notes when present', () => {
    render(<CalendarEntryCard {...defaultProps} />);

    expect(screen.getByText('Family dinner')).toBeInTheDocument();
  });

  it('should not display notes section when notes are null', () => {
    const entryWithoutNotes = { ...mockEntry, notes: null };

    render(<CalendarEntryCard {...defaultProps} entry={entryWithoutNotes} />);

    expect(screen.queryByText('Family dinner')).not.toBeInTheDocument();
  });

  it('should display status badge', () => {
    render(<CalendarEntryCard {...defaultProps} />);

    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<CalendarEntryCard {...defaultProps} onEdit={onEdit} />);

    const editButton = screen.getByLabelText(/edit calendar entry/i);
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<CalendarEntryCard {...defaultProps} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText(/delete calendar entry/i);
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should show view recipe button when onViewRecipe provided', () => {
    const onViewRecipe = vi.fn();

    render(<CalendarEntryCard {...defaultProps} onViewRecipe={onViewRecipe} />);

    expect(screen.getByLabelText(/view recipe/i)).toBeInTheDocument();
  });

  it('should not show view recipe button when onViewRecipe not provided', () => {
    render(<CalendarEntryCard {...defaultProps} />);

    expect(screen.queryByLabelText(/view recipe/i)).not.toBeInTheDocument();
  });

  it('should call onViewRecipe when view button clicked', async () => {
    const user = userEvent.setup();
    const onViewRecipe = vi.fn();

    render(<CalendarEntryCard {...defaultProps} onViewRecipe={onViewRecipe} />);

    const viewButton = screen.getByLabelText(/view recipe/i);
    await user.click(viewButton);

    expect(onViewRecipe).toHaveBeenCalledTimes(1);
  });

  it('should show mark complete button when status is planned', () => {
    render(<CalendarEntryCard {...defaultProps} />);

    expect(screen.getByLabelText(/mark as completed/i)).toBeInTheDocument();
  });

  it('should show mark complete button when status is confirmed', () => {
    const confirmedEntry = { ...mockEntry, status: 'confirmed' as const };

    render(<CalendarEntryCard {...defaultProps} entry={confirmedEntry} />);

    expect(screen.getByLabelText(/mark as completed/i)).toBeInTheDocument();
  });

  it('should not show mark complete button when status is completed', () => {
    const completedEntry = { ...mockEntry, status: 'completed' as const };

    render(<CalendarEntryCard {...defaultProps} entry={completedEntry} />);

    expect(screen.queryByLabelText(/mark as completed/i)).not.toBeInTheDocument();
  });

  it('should call onMarkComplete when mark complete button clicked', async () => {
    const user = userEvent.setup();
    const onMarkComplete = vi.fn();

    render(<CalendarEntryCard {...defaultProps} onMarkComplete={onMarkComplete} />);

    const completeButton = screen.getByLabelText(/mark as completed/i);
    await user.click(completeButton);

    expect(onMarkComplete).toHaveBeenCalledTimes(1);
  });

  it('should display correct status colors', () => {
    const { rerender } = render(<CalendarEntryCard {...defaultProps} />);

    // Planned status
    expect(screen.getByText('Planned')).toBeInTheDocument();

    // Confirmed status
    rerender(<CalendarEntryCard {...defaultProps} entry={{ ...mockEntry, status: 'confirmed' }} />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();

    // Completed status
    rerender(<CalendarEntryCard {...defaultProps} entry={{ ...mockEntry, status: 'completed' }} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();

    // Cancelled status
    rerender(<CalendarEntryCard {...defaultProps} entry={{ ...mockEntry, status: 'cancelled' }} />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });
});
