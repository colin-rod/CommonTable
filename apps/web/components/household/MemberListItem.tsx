import type { HouseholdMemberWithProfile } from '@commontable/types';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { ListItem, ListItemText, IconButton } from '@mui/material';
import { useState } from 'react';

import { useHousehold } from '@/hooks/useHousehold';

interface MemberListItemProps {
  member: HouseholdMemberWithProfile;
  isAdmin: boolean;
}

/**
 * MemberListItem Component
 *
 * Displays a single household member in a list
 *
 * Shows:
 * - Member name
 * - Member type (managed or authenticated)
 * - Role (admin or member)
 * - Join date
 * - Delete button (admin only)
 *
 * Design System Compliance:
 * - Uses List components (not tables)
 * - Only body1/body2 typography variants
 * - Icon-only secondary action (delete)
 */
export function MemberListItem({ member, isAdmin }: MemberListItemProps) {
  const { removeMember } = useHousehold();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    /* eslint-disable no-undef */
    const confirmMessage = `Remove ${member.profile.display_name} from household?`;

    if (typeof window !== 'undefined' && window.confirm(confirmMessage)) {
      try {
        setRemoving(true);
        await removeMember(member.user_id);
      } catch (error) {
        console.error('Failed to remove member:', error);
        if (typeof window !== 'undefined') {
          window.alert('Failed to remove member. Please try again.');
        }
      } finally {
        setRemoving(false);
      }
    }
    /* eslint-enable no-undef */
  };

  // Format member type label
  const memberTypeLabel = member.profile.member_type === 'managed' ? ' (managed)' : '';

  // Format join date
  const joinDate = new Date(member.joined_at).toLocaleDateString();

  return (
    <ListItem
      secondaryAction={
        isAdmin && (
          <IconButton edge="end" onClick={handleRemove} disabled={removing}>
            <DeleteIcon />
          </IconButton>
        )
      }
    >
      <ListItemText
        primary={member.profile.display_name + memberTypeLabel}
        secondary={`${member.role} · Joined ${joinDate}`}
      />
    </ListItem>
  );
}
