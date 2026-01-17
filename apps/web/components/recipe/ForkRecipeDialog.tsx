'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import { useState, useEffect } from 'react';

interface ForkRecipeDialogProps {
  open: boolean;
  recipeName: string;
  loading?: boolean;
  onConfirm: (newTitle: string) => void;
  onCancel: () => void;
}

/**
 * ForkRecipeDialog Component
 *
 * Dialog for forking (copying) a recipe with a new title
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses Dialog (approved component)
 * - TextField for title input
 * - body2 for helper text
 * - outlined button for cancel (secondary)
 * - contained primary button for fork action
 */
export function ForkRecipeDialog({
  open,
  recipeName,
  loading = false,
  onConfirm,
  onCancel,
}: ForkRecipeDialogProps) {
  const [newTitle, setNewTitle] = useState('');

  // Reset title when dialog opens with pre-filled default
  useEffect(() => {
    if (open) {
      setNewTitle(`Copy of ${recipeName}`);
    }
  }, [open, recipeName]);

  const handleConfirm = () => {
    if (newTitle.trim()) {
      onConfirm(newTitle.trim());
    }
  };

  const handleKeyDown = (event: { key: string }) => {
    if (event.key === 'Enter' && newTitle.trim() && !loading) {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Fork Recipe</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create a copy of this recipe that you can modify independently.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="New Recipe Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          error={!newTitle.trim()}
          helperText={!newTitle.trim() ? 'Title is required' : ''}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          disabled={loading || !newTitle.trim()}
        >
          {loading ? 'Forking...' : 'Fork'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
