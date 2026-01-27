import type { CookingEvent, CookingEventId } from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CookingHistoryItem } from './CookingHistoryItem';

describe('CookingHistoryItem', () => {
  const mockEvent: CookingEvent = {
    id: 'event-1' as CookingEventId,
    recipe_id: 'recipe-1' as any,
    recipe_version_id: 'version-1' as any,
    household_id: 'household-1' as any,
    cooked_at: new Date('2026-01-20T18:00:00Z'),
    rating: 4,
    notes: 'Delicious meal with the family',
    servings_made: 6,
    cooked_by: 'user-1' as any,
  };

  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnUpdate.mockResolvedValue(undefined);
  });

  describe('Read-only mode', () => {
    it('should render cooking event date', () => {
      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(/1\/20\/2026/i)).toBeInTheDocument();
    });

    it('should render rating stars when rating exists', () => {
      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      // Material UI Rating component with value 4
      const ratingContainer = screen.getByRole('img', { hidden: true });
      expect(ratingContainer).toBeInTheDocument();
    });

    it('should not render rating stars when rating is null', () => {
      const eventWithoutRating = { ...mockEvent, rating: null };

      render(<CookingHistoryItem event={eventWithoutRating} onUpdate={mockOnUpdate} />);

      // No rating component should be rendered
      const ratings = screen.queryAllByRole('img', { hidden: true });
      expect(ratings.length).toBe(0);
    });

    it('should render notes when present', () => {
      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(/delicious meal with the family/i)).toBeInTheDocument();
    });

    it('should not render notes section when notes are null', () => {
      const eventWithoutNotes = { ...mockEvent, notes: null };

      render(<CookingHistoryItem event={eventWithoutNotes} onUpdate={mockOnUpdate} />);

      expect(screen.queryByText(/delicious/i)).not.toBeInTheDocument();
    });

    it('should show "Edit" button in read-only mode', () => {
      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    it('should switch to edit mode when Edit button clicked', async () => {
      const user = userEvent.setup();

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Should show Save and Cancel buttons
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show clickable star icons in edit mode', async () => {
      const user = userEvent.setup();

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Should have 5 star buttons (IconButton elements)
      const starButtons = screen.getAllByRole('button', { name: /rate \d stars?/i });
      expect(starButtons).toHaveLength(5);
    });

    it('should show TextField for notes in edit mode', async () => {
      const user = userEvent.setup();

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it('should pre-fill notes TextField with existing notes', async () => {
      const user = userEvent.setup();

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const notesField = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
      expect(notesField.value).toBe('Delicious meal with the family');
    });

    it('should show empty notes TextField when notes are null', async () => {
      const user = userEvent.setup();
      const eventWithoutNotes = { ...mockEvent, notes: null };

      render(<CookingHistoryItem event={eventWithoutNotes} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const notesField = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
      expect(notesField.value).toBe('');
    });

    it('should update rating when clicking star icons', async () => {
      const user = userEvent.setup();

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Click on 5 stars
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 stars/i });
      await user.click(fiveStarButton);

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(mockEvent.id, {
          rating: 5,
          notes: 'Delicious meal with the family',
        });
      });
    });

    it('should update notes when typing in TextField', async () => {
      const user = userEvent.setup();

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const notesField = screen.getByLabelText(/notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Updated notes');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(mockEvent.id, {
          rating: 4,
          notes: 'Updated notes',
        });
      });
    });

    it('should call onUpdate with correct data when Save clicked', async () => {
      const user = userEvent.setup();

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Change rating to 5
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 stars/i });
      await user.click(fiveStarButton);

      // Update notes
      const notesField = screen.getByLabelText(/notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Amazing!');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(mockEvent.id, {
          rating: 5,
          notes: 'Amazing!',
        });
      });
    });

    it('should show loading state during save', async () => {
      const user = userEvent.setup();

      // Make onUpdate delay to capture loading state
      let resolveUpdate: () => void;
      mockOnUpdate.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveUpdate = resolve;
          }),
      );

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show CircularProgress
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      resolveUpdate!();
    });

    it('should revert to read-only mode on successful save', async () => {
      const user = userEvent.setup();

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });

    it('should show error message if save fails', async () => {
      const user = userEvent.setup();

      mockOnUpdate.mockRejectedValue(new Error('Network error'));

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/couldn't save rating/i)).toBeInTheDocument();
      });
    });

    it('should keep edit mode visible if save fails', async () => {
      const user = userEvent.setup();

      mockOnUpdate.mockRejectedValue(new Error('Network error'));

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });
    });

    it('should cancel edit and revert changes when Cancel clicked', async () => {
      const user = userEvent.setup();

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Change rating
      const fiveStarButton = screen.getByRole('button', { name: /rate 5 stars/i });
      await user.click(fiveStarButton);

      // Change notes
      const notesField = screen.getByLabelText(/notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Changed');

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should revert to read-only mode
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();

      // onUpdate should NOT be called
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('should disable buttons during loading', async () => {
      const user = userEvent.setup();

      mockOnUpdate.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.click(saveButton);

      // Buttons should be disabled during loading
      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should allow submitting with empty notes (null)', async () => {
      const user = userEvent.setup();

      render(<CookingHistoryItem event={mockEvent} onUpdate={mockOnUpdate} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const notesField = screen.getByLabelText(/notes/i);
      await user.clear(notesField);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(mockEvent.id, {
          rating: 4,
          notes: null, // Empty notes should be null
        });
      });
    });
  });
});
