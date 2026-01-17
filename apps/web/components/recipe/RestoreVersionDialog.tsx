'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';

interface RestoreVersionDialogProps {
  open: boolean;
  recipeName: string;
  versionNumber: number;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * RestoreVersionDialog Component
 *
 * Confirmation dialog for restoring a recipe to a previous version.
 * Explains that restoring creates a new version (preserves history).
 *
 * Follows DESIGN_SYSTEM.md:
 * - Dialog with DialogTitle > DialogContent > DialogActions
 * - Cancel: outlined, primary
 * - Restore: outlined, primary (secondary action per user preference)
 * - Calm, neutral tone (no emojis)
 */
export function RestoreVersionDialog({
  open,
  recipeName,
  versionNumber,
  loading = false,
  onConfirm,
  onCancel,
}: RestoreVersionDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Restore Version</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Restore "{recipeName}" to Version {versionNumber}?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This will create a new version with the content from Version {versionNumber}. The current
          version will be preserved in the history.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="outlined" color="primary" onClick={onConfirm} disabled={loading}>
          {loading ? 'Restoring...' : 'Restore'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
