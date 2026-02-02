'use client';

import { Typography, Stack, CircularProgress, Snackbar, Alert, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { updateProfile, changePassword } from '@/app/actions/profile';
import { ProfileForm, type ProfileFormData } from '@/components/settings/ProfileForm';
import { useAuth } from '@/hooks/useAuth';

/**
 * Profile Page
 * Allows users to edit their profile and change password
 *
 * Design System Compliance:
 * - Container maxWidth md
 * - Stack spacing 3 (24px)
 * - Typography: h5 for page title
 * - CircularProgress for loading state
 */
export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: ProfileFormData) => {
    try {
      // Update display name
      const profileResult = await updateProfile({ display_name: data.display_name });

      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Failed to update profile');
      }

      // If password fields are filled, change password
      if (data.current_password && data.new_password) {
        const passwordResult = await changePassword({
          current_password: data.current_password,
          new_password: data.new_password,
        });

        if (!passwordResult.success) {
          throw new Error(passwordResult.error || 'Failed to change password');
        }

        setSnackbar({
          open: true,
          message: 'Password changed successfully',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error',
      });
    }
  };

  /**
   * Handle cancel - navigate back to household settings
   */
  const handleCancel = () => {
    router.push('/settings/household');
  };

  /**
   * Handle snackbar close
   */
  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <Stack spacing={3}>
      {/* Page Title */}
      <Typography variant="h5">Profile</Typography>

      {/* Profile Form */}
      <ProfileForm user={user} onSubmit={handleSubmit} onCancel={handleCancel} />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
