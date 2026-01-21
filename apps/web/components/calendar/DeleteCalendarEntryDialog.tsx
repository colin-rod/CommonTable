'use client';

import type { CalendarEntry } from '@commontable/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useState } from 'react';

interface DeleteCalendarEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entry: CalendarEntry | null;
}

/**
 * Format meal slot for display
 */
function formatMealSlot(slot: string): string {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Dialog for confirming calendar entry deletion
 *
 * Design System Compliance:
 * - Dialog component
 * - Typography for content
 * - Buttons: outlined (Cancel) and contained error (Delete)
 */
export function DeleteCalendarEntryDialog({
  open,
  onClose,
  onConfirm,
  entry,
}: DeleteCalendarEntryDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (deleting) return;
    onClose();
  };

  if (!entry) return null;

  const entryTitle = entry.recipe_id ? 'Recipe entry' : 'Notes-only entry';
  const dateStr = formatDate(new Date(entry.planned_date));
  const mealSlotStr = formatMealSlot(entry.meal_slot);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Meal Entry</DialogTitle>

      <DialogContent>
        <Typography variant="body1">
          Remove {entryTitle} from {dateStr} ({mealSlotStr})?
        </Typography>

        {entry.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Notes: {entry.notes}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined" color="primary" disabled={deleting}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
