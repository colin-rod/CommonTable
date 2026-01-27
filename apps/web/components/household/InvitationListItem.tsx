'use client';

import type { HouseholdInvitation } from '@commontable/types';
import CancelIcon from '@mui/icons-material/Cancel';
import { ListItem, ListItemText, IconButton, Chip, Button, Snackbar, Box } from '@mui/material';
import { useState } from 'react';

import { useHousehold } from '@/hooks/useHousehold';

interface InvitationListItemProps {
  invitation: HouseholdInvitation;
}

/**
 * InvitationListItem Component
 *
 * Displays a single household invitation in a list
 *
 * Shows:
 * - Invitee email
 * - Role (admin or member)
 * - Invitation date
 * - Status chip (pending: default, declined: error, expired: warning)
 * - Resend button (pending only)
 * - Cancel button
 *
 * Design System Compliance:
 * - Uses List components
 * - Only body1/body2 typography variants
 * - Icon-only secondary action (cancel)
 * - Button variants: outlined (resend), icon-only (cancel)
 * - Chip colors: default (pending), error (declined), warning (expired)
 */
export function InvitationListItem({ invitation }: InvitationListItemProps) {
  const { cancelInvitation, resendInvitation } = useHousehold();
  const [canceling, setCanceling] = useState(false);
  const [resending, setResending] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleCancel = async () => {
    /* eslint-disable no-undef */
    const confirmMessage = `Cancel invitation for ${invitation.invitee_email}?`;

    if (typeof window !== 'undefined' && window.confirm(confirmMessage)) {
      try {
        setCanceling(true);
        await cancelInvitation(invitation.id);
      } catch (error) {
        console.error('Failed to cancel invitation:', error);
        if (typeof window !== 'undefined') {
          window.alert('Failed to cancel invitation. Please try again.');
        }
      } finally {
        setCanceling(false);
      }
    }
    /* eslint-enable no-undef */
  };

  const handleResend = async () => {
    /* eslint-disable no-undef */
    try {
      setResending(true);
      await resendInvitation(invitation.id);
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      if (typeof window !== 'undefined') {
        window.alert('Failed to resend invitation. Please try again.');
      }
    } finally {
      setResending(false);
    }
    /* eslint-enable no-undef */
  };

  const handleCloseSnackbar = () => {
    setShowSuccessMessage(false);
  };

  // Format invitation date
  const invitedDate = new Date(invitation.invited_at).toLocaleDateString();

  // Format status for display (capitalize first letter)
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Determine chip color based on status
  const getChipColor = () => {
    switch (invitation.status) {
      case 'declined':
        return 'error';
      case 'expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  const isPending = invitation.status === 'pending';

  return (
    <>
      <ListItem
        secondaryAction={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isPending && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleResend}
                disabled={resending || canceling}
              >
                Resend
              </Button>
            )}
            <IconButton edge="end" onClick={handleCancel} disabled={canceling || resending}>
              <CancelIcon />
            </IconButton>
          </Box>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <ListItemText
              primary={invitation.invitee_email}
              secondary={`${invitation.role} · Invited ${invitedDate}`}
            />
          </Box>
          <Chip label={formatStatus(invitation.status)} size="small" color={getChipColor()} />
        </Box>
      </ListItem>

      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message="Invitation resent"
      />
    </>
  );
}
