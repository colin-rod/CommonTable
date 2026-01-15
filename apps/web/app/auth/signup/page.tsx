'use client';

import type { SignUpInput } from '@commontable/types';
import { CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/hooks/useAuth';

/**
 * Sign Up Page
 * Handles new user registration
 *
 * - Auto-creates household on successful signup
 * - Redirects to /dashboard after signup
 * - Redirects to /dashboard if already authenticated
 */
export default function SignUpPage() {
  const router = useRouter();
  const { signUp, isAuthenticated, initialized, error } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [initialized, isAuthenticated, router]);

  const handleSignUp = async (data: SignUpInput) => {
    await signUp(data);
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

  return <SignUpForm onSubmit={handleSignUp} error={error} />;
}
