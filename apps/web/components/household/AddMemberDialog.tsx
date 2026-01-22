import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useHousehold } from '@/hooks/useHousehold';

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * AddMemberDialog Component
 *
 * Dialog for adding managed (non-authenticated) members
 *
 * Features:
 * - Name input
 * - Optional avatar URL input
 * - Creates managed member directly (no email required)
 *
 * Use Cases:
 * - Adding kids to household
 * - Adding family members without email
 * - Adding members who will use parent's session
 *
 * Design System Compliance:
 * - Max 1 primary button: "Add Member"
 * - Only 3 button variants: outlined (cancel), contained (submit)
 * - Only h6/body1/body2 typography
 * - Spacing: 16px (2), 24px (3)
 */
export function AddMemberDialog({ open, onClose }: AddMemberDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addManagedMember } = useHousehold();

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await addManagedMember({ display_name: displayName.trim(), role: 'member' });

      // Success - close dialog and reset form
      setDisplayName('');
      onClose();
    } catch (err) {
      console.error('Failed to add member:', err);
      setError(err instanceof Error ? err.message : 'Failed to add member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setDisplayName('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Household Member</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Add a family member without requiring email or login. They will use your session to
            access the household.
          </Typography>

          <TextField
            label="Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            required
            error={!!error}
            helperText={error || 'Enter the name of the person you want to add'}
            disabled={loading}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !displayName.trim()}
        >
          {loading ? 'Adding...' : 'Add Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
