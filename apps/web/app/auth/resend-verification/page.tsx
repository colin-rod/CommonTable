'use client';

import { CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ResendVerificationForm } from '@/components/auth/ResendVerificationForm';
import { useAuth } from '@/hooks/useAuth';

/**
 * Resend Verification Page
 * Allows users to request a new verification email
 *
 * - Redirects to /dashboard if already authenticated
 * - Shows form for users to enter email and resend verification
 */
export default function ResendVerificationPage() {
  const router = useRouter();
  const { isAuthenticated, initialized } = useAuth();
  const [error, setError] = useState<Error | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [initialized, isAuthenticated, router]);

  const handleResend = async (email: string) => {
    try {
      setError(null);
      // Import dynamically to avoid circular dependencies
      const { AuthService } = await import('@commontable/api-client');
      const { createClient } = await import('@/lib/supabase/client');

      const supabase = createClient();
      const authService = new AuthService(supabase);

      await authService.resendVerificationEmail(email);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // Show loading state during initialization
  if (!initialized) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  // Don't show form if already authenticated (about to redirect)
  if (isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return <ResendVerificationForm onSubmit={handleResend} error={error} />;
}
