'use client';

import { HouseholdService } from '@commontable/api-client';
import { CheckCircle as SuccessIcon, Error as ErrorIcon } from '@mui/icons-material';
import { Container, Typography, CircularProgress, Stack, Button } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { createClient } from '@/lib/supabase/client';

/**
 * AcceptInvitationContent Component
 *
 * Handles invitation acceptance flow
 *
 * Flow:
 * 1. Get token from URL query params
 * 2. Call HouseholdService.acceptInvitation()
 * 3. Show success/error message
 * 4. Redirect to dashboard on success
 *
 * Design System Compliance:
 * - Only h5/body1 typography variants
 * - Spacing: 24px (3), 64px (8)
 * - Centered layout
 */
function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const acceptInvitation = async () => {
      if (!token) {
        setStatus('error');
        setError('No invitation token provided');
        return;
      }

      try {
        const supabase = createClient();
        const householdService = new HouseholdService(supabase);

        await householdService.acceptInvitation({ token });

        setStatus('success');

        // Redirect to dashboard after 2 seconds
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-undef
          window.setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to accept invitation:', err);
        setStatus('error');
        setError(
          err instanceof Error ? err.message : 'Failed to accept invitation. Please try again.',
        );
      }
    };

    void acceptInvitation();
  }, [token, router]);

  return (
    <Container maxWidth="sm">
      <Stack spacing={3} alignItems="center" sx={{ pt: 8 }}>
        {status === 'loading' && (
          <>
            <CircularProgress />
            <Typography variant="body1">Accepting invitation...</Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <SuccessIcon color="success" sx={{ fontSize: 64 }} />
            <Typography variant="h5">Welcome to the household</Typography>
            <Typography variant="body1" color="text.secondary">
              Redirecting to dashboard...
            </Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon color="error" sx={{ fontSize: 64 }} />
            <Typography variant="h5">Failed to accept invitation</Typography>
            <Typography variant="body1" color="error">
              {error}
            </Typography>
            <Button variant="contained" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </>
        )}
      </Stack>
    </Container>
  );
}

/**
 * AcceptInvitationPage Component
 *
 * Wrapper with Suspense for useSearchParams
 */
export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="sm">
          <Stack spacing={3} alignItems="center" sx={{ pt: 8 }}>
            <CircularProgress />
            <Typography variant="body1">Loading...</Typography>
          </Stack>
        </Container>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
