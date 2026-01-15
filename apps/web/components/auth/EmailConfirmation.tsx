'use client';

import { Container, Stack, Typography, CircularProgress, Alert, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type VerificationState = 'verifying' | 'success' | 'error';

interface EmailConfirmationProps {
  error?: string | null;
  errorDescription?: string | null;
}

/**
 * EmailConfirmation Component
 * Material Design 3 compliant email verification status display
 *
 * Following CLAUDE.md constraints:
 * - Only approved MUI components
 * - Only allowed button variants (contained primary)
 * - Only allowed typography variants (h5, body1, body2)
 * - Spacing: 24px gaps
 * - No emojis, calm neutral tone
 */
export function EmailConfirmation({ error, errorDescription }: EmailConfirmationProps) {
  const router = useRouter();
  const [state, setState] = useState<VerificationState>('verifying');

  useEffect(() => {
    if (error) {
      setState('error');
      return;
    }

    // Token exchange happens automatically via Supabase Auth
    // If no error, verification succeeded
    setState('success');

    // Auto-redirect to dashboard after 2 seconds
    let mounted = true;
    const timeoutId = globalThis.setTimeout(() => {
      if (mounted) {
        router.push('/dashboard');
      }
    }, 2000);

    return () => {
      mounted = false;
      globalThis.clearTimeout(timeoutId);
    };
  }, [error, router]);

  if (state === 'verifying') {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <Stack spacing={3} alignItems="center">
            <CircularProgress />
            <Typography variant="body1">Verifying your email</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (state === 'success') {
    return (
      <Container maxWidth="sm">
        <Stack spacing={3} sx={{ mt: 8 }}>
          <Typography variant="h5">Email verified</Typography>

          <Alert severity="success">
            Your email has been verified. Redirecting to dashboard...
          </Alert>

          <Button variant="contained" color="primary" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </Stack>
      </Container>
    );
  }

  // Error state
  const getErrorMessage = () => {
    if (errorDescription?.includes('expired')) {
      return 'Verification link expired. Request a new one.';
    }
    if (errorDescription?.includes('already') || error?.includes('already')) {
      return 'Email already verified. Sign in to continue.';
    }
    return 'Invalid verification link. Contact support if this persists.';
  };

  const getErrorAction = () => {
    if (errorDescription?.includes('already') || error?.includes('already')) {
      return (
        <Button variant="contained" color="primary" onClick={() => router.push('/auth/login')}>
          Sign In
        </Button>
      );
    }
    return (
      <Button
        variant="outlined"
        color="primary"
        onClick={() => router.push('/auth/resend-verification')}
      >
        Resend Verification
      </Button>
    );
  };

  return (
    <Container maxWidth="sm">
      <Stack spacing={3} sx={{ mt: 8 }}>
        <Typography variant="h5">Verification failed</Typography>

        <Alert severity="error">{getErrorMessage()}</Alert>

        <Typography variant="body2" color="text.secondary">
          {errorDescription || error}
        </Typography>

        {getErrorAction()}
      </Stack>
    </Container>
  );
}
