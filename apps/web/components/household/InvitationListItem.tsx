import type { HouseholdInvitation } from '@commontable/types';
import CancelIcon from '@mui/icons-material/Cancel';
import { ListItem, ListItemText, IconButton, Chip } from '@mui/material';
import { useState } from 'react';

interface InvitationListItemProps {
  invitation: HouseholdInvitation;
}

/**
 * InvitationListItem Component
 *
 * Displays a single pending invitation in a list
 *
 * Shows:
 * - Invitee email
 * - Role (admin or member)
 * - Invitation date
 * - Status chip
 * - Cancel button
 *
 * Design System Compliance:
 * - Uses List components
 * - Only body1/body2 typography variants
 * - Icon-only secondary action (cancel)
 */
export function InvitationListItem({ invitation }: InvitationListItemProps) {
  const [canceling, setCanceling] = useState(false);

  const handleCancel = async () => {
    /* eslint-disable no-undef */
    const confirmMessage = `Cancel invitation for ${invitation.invitee_email}?`;

    if (typeof window !== 'undefined' && window.confirm(confirmMessage)) {
      try {
        setCanceling(true);
        // TODO: Implement cancel invitation in useHousehold hook
        // await cancelInvitation(invitation.id);
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

  // Format invitation date
  const invitedDate = new Date(invitation.invited_at).toLocaleDateString();

  return (
    <ListItem
      secondaryAction={
        <IconButton edge="end" onClick={handleCancel} disabled={canceling}>
          <CancelIcon />
        </IconButton>
      }
    >
      <ListItemText
        primary={invitation.invitee_email}
        secondary={
          <>
            {invitation.role} · Invited {invitedDate}
            {' · '}
            <Chip label="Pending" size="small" sx={{ ml: 1 }} />
          </>
        }
      />
    </ListItem>
  );
}
