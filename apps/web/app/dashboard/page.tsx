'use client';

import { Container, Typography, Stack, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

/**
 * Dashboard Page
 * Protected route - requires authentication
 *
 * Shows user profile and household information
 */
export default function DashboardPage() {
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
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
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
      </Stack>
    </Container>
  );
}
