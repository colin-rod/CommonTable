'use client';

import type { SignInInput } from '@commontable/types';
import { CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

/**
 * Login Page
 * Handles user sign in
 *
 * - Redirects to /dashboard if already authenticated
 * - Shows loading state during auth check
 * - Handles errors from auth service
 */
export default function LoginPage() {
  const router = useRouter();
  const { signIn, isAuthenticated, error, initialized } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [initialized, isAuthenticated, router]);

  const handleSignIn = async (data: SignInInput) => {
    await signIn(data);
    // useAuth hook will update state, useEffect will handle redirect
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

  return <LoginForm onSubmit={handleSignIn} error={error} />;
}
