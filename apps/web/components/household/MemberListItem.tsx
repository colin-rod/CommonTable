'use client';

import type { HouseholdMemberWithProfile } from '@commontable/types';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  ListItem,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Box,
} from '@mui/material';
import type React from 'react';
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
 * - Role chip (admin or member)
 * - Join date
 * - Role management menu (admin only)
 *
 * Design System Compliance:
 * - Uses List components (not tables)
 * - Only body1/body2 typography variants
 * - Icon-only secondary actions (menu, delete)
 * - Chip component for role display
 * - Menu component for role management
 */
export function MemberListItem({ member, isAdmin }: MemberListItemProps) {
  const { removeMember, updateMemberRole } = useHousehold();
  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePromoteToAdmin = async () => {
    handleMenuClose();

    /* eslint-disable no-undef */
    const confirmMessage = `Promote ${member.profile.display_name} to admin? They will have full access to household settings.`;

    if (typeof window !== 'undefined' && window.confirm(confirmMessage)) {
      try {
        setUpdating(true);
        await updateMemberRole(member.user_id, 'admin');
      } catch (error) {
        console.error('Failed to update member role:', error);
        if (typeof window !== 'undefined') {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to update member role. Please try again.';
          window.alert(errorMessage);
        }
      } finally {
        setUpdating(false);
      }
    }
    /* eslint-enable no-undef */
  };

  const handleDemoteToMember = async () => {
    handleMenuClose();

    /* eslint-disable no-undef */
    const confirmMessage = `Demote ${member.profile.display_name} to member? They will lose access to household settings.`;

    if (typeof window !== 'undefined' && window.confirm(confirmMessage)) {
      try {
        setUpdating(true);
        await updateMemberRole(member.user_id, 'member');
      } catch (error) {
        console.error('Failed to update member role:', error);
        if (typeof window !== 'undefined') {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to update member role. Please try again.';
          window.alert(errorMessage);
        }
      } finally {
        setUpdating(false);
      }
    }
    /* eslint-enable no-undef */
  };

  const handleRemove = async () => {
    handleMenuClose();

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

  // Check if managed member (cannot be promoted to admin)
  const isManagedMember = member.profile.member_type === 'managed';

  return (
    <ListItem
      secondaryAction={
        isAdmin && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              edge="end"
              onClick={handleMenuOpen}
              disabled={removing || updating}
              aria-label="Manage member"
            >
              <MoreVertIcon />
            </IconButton>
            <IconButton edge="end" onClick={handleRemove} disabled={removing || updating}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )
      }
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        <Box sx={{ flex: 1 }}>
          <ListItemText
            primary={member.profile.display_name + memberTypeLabel}
            secondary={`${member.role} · Joined ${joinDate}`}
          />
        </Box>
        <Chip
          label={member.role}
          size="small"
          color={member.role === 'admin' ? 'primary' : 'default'}
        />
      </Box>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
        {member.role === 'member' && (
          <MenuItem onClick={handlePromoteToAdmin} disabled={isManagedMember}>
            Promote to Admin
          </MenuItem>
        )}
        {member.role === 'admin' && (
          <MenuItem onClick={handleDemoteToMember}>Demote to Member</MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleRemove}>
          <DeleteIcon sx={{ mr: 1 }} />
          Remove from Household
        </MenuItem>
      </Menu>
    </ListItem>
  );
}
