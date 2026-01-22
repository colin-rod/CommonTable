'use client';

import { Typography, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

/**
 * Dashboard Client Component
 * Handles client-side authentication display and sign out
 */
export function DashboardClient() {
  const { user, household, householdRole, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Page Header */}
      <Box>
        <Typography variant="h5">Welcome, {user.profile.display_name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {user.email}
        </Typography>
      </Box>

      {/* Household Info */}
      {household && (
        <Box>
          <Typography variant="h6">Your Household</Typography>
          <Typography variant="body1">{household.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Role: {householdRole}
          </Typography>
        </Box>
      )}

      {/* Actions */}
      <Box>
        <Button variant="outlined" color="primary" onClick={handleSignOut}>
          Sign out
        </Button>
      </Box>
    </>
  );
}
