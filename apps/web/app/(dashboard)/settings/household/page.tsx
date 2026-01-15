'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Container, Typography, Stack, Box, Button, List, CircularProgress } from '@mui/material';
import { useState } from 'react';

import { AddMemberDialog } from '@/components/household/AddMemberDialog';
import { InvitationListItem } from '@/components/household/InvitationListItem';
import { InviteMemberDialog } from '@/components/household/InviteMemberDialog';
import { MemberListItem } from '@/components/household/MemberListItem';
import { useHousehold } from '@/hooks/useHousehold';

/**
 * Household Settings Page
 *
 * Displays:
 * - List of household members (authenticated + managed)
 * - List of pending invitations (admin only)
 * - Actions to invite/add/remove members (admin only)
 *
 * Design System Compliance:
 * - Max 1 primary button per screen: "Add Member"
 * - Only 3 button variants: contained primary, outlined primary
 * - Only 4 typography variants: h5 (page title), h6 (section headers), body1, body2
 * - Spacing: 16px (2), 24px (3), 32px (4)
 * - Lists instead of tables
 */
export default function HouseholdSettingsPage() {
  const { members, invitations, loading, error, isAdmin } = useHousehold();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Typography variant="h5">Household Settings</Typography>
          <Typography variant="body1" color="error">
            Failed to load household settings. Please try again.
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Stack spacing={4}>
        {/* Page Title */}
        <Typography variant="h5">Household Settings</Typography>

        {/* Members Section */}
        <Box>
          <Stack spacing={2}>
            <Typography variant="h6">Members</Typography>
            <Typography variant="body2" color="text.secondary">
              {members.length} {members.length === 1 ? 'member' : 'members'} in your household
            </Typography>
            <List>
              {members.map((member) => (
                <MemberListItem key={member.user_id} member={member} isAdmin={isAdmin} />
              ))}
            </List>
          </Stack>
        </Box>

        {/* Pending Invitations Section (Admin Only) */}
        {isAdmin && invitations.length > 0 && (
          <Box>
            <Stack spacing={2}>
              <Typography variant="h6">Pending Invitations</Typography>
              <Typography variant="body2" color="text.secondary">
                {invitations.length} pending{' '}
                {invitations.length === 1 ? 'invitation' : 'invitations'}
              </Typography>
              <List>
                {invitations.map((invitation) => (
                  <InvitationListItem key={invitation.id} invitation={invitation} />
                ))}
              </List>
            </Stack>
          </Box>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <Stack spacing={2} direction="row">
            <Button variant="outlined" color="primary" onClick={() => setInviteDialogOpen(true)}>
              Invite by Email
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddMemberDialogOpen(true)}
            >
              Add Member
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Dialogs */}
      {isAdmin && (
        <>
          <InviteMemberDialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} />
          <AddMemberDialog
            open={addMemberDialogOpen}
            onClose={() => setAddMemberDialogOpen(false)}
          />
        </>
      )}
    </Container>
  );
}
