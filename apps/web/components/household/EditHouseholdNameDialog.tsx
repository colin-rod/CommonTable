'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { useState, useEffect } from 'react';

interface EditHouseholdNameDialogProps {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export function EditHouseholdNameDialog({
  open,
  currentName,
  onClose,
  onSave,
}: EditHouseholdNameDialogProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens with new currentName
  useEffect(() => {
    if (open) {
      setName(currentName);
      setError('');
    }
  }, [open, currentName]);

  const validate = (value: string): string => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return 'Household name is required';
    }

    if (trimmed.length > 100) {
      return 'Household name cannot exceed 100 characters';
    }

    return '';
  };

  const handleSave = async () => {
    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onSave(name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update household name');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Household Name</DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            label="Household Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            error={!!error}
            helperText={error || 'Choose a name for your household'}
            fullWidth
            autoFocus
            disabled={saving}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined" disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
