'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface DeleteRecipeDialogProps {
  open: boolean;
  recipeName: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteRecipeDialog Component
 *
 * Confirmation dialog for deleting a recipe
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses Dialog (approved component)
 * - body1 for content
 * - outlined button for cancel (secondary)
 * - contained error button for delete (destructive)
 */
export function DeleteRecipeDialog({
  open,
  recipeName,
  loading = false,
  onConfirm,
  onCancel,
}: DeleteRecipeDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Recipe</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to delete &quot;{recipeName}&quot;? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
