import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useHousehold } from '@/hooks/useHousehold';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * InviteMemberDialog Component
 *
 * Dialog for inviting authenticated users via email
 *
 * Features:
 * - Email input with validation
 * - Role selection (admin/member)
 * - Send invitation via Supabase Auth
 *
 * Design System Compliance:
 * - Max 1 primary button: "Send Invitation"
 * - Only 3 button variants: outlined (cancel), contained (submit)
 * - Only h6/body1/body2 typography
 * - Spacing: 16px (2), 24px (3)
 */
export function InviteMemberDialog({ open, onClose }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { inviteMember } = useHousehold();

  const handleSubmit = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await inviteMember({ email, role });

      // Success - close dialog and reset form
      setEmail('');
      setRole('member');
      onClose();
    } catch (err) {
      console.error('Failed to invite member:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setRole('member');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invite Member by Email</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Send an email invitation to join your household. They will receive a link to accept the
            invitation.
          </Typography>

          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            error={!!error}
            helperText={error || 'Enter the email address of the person you want to invite'}
            disabled={loading}
          />

          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              label="Role"
              disabled={loading}
            >
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !email}>
          {loading ? 'Sending...' : 'Send Invitation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
