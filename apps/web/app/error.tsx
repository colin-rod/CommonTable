'use client';

import { Container, Stack, Typography, Button } from '@mui/material';
import { useEffect } from 'react';

/**
 * Error Page Props
 */
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global Error Page
 * Catches unhandled errors in the application
 *
 * Features:
 * - Error message display
 * - Reset button to retry
 * - Centered layout
 * - Logs error to console
 *
 * Design System Compliance:
 * - Typography: h5 for title, body1 for description
 * - Button: contained primary
 * - Stack spacing 2 (16px)
 * - Container centered
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console (or send to error tracking service like Sentry)
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <Container maxWidth="sm">
      <Stack spacing={2} alignItems="center" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5">Something went wrong</Typography>
        <Typography variant="body1" color="text.secondary">
          An error occurred. Please try again.
        </Typography>
        <Button variant="contained" color="primary" onClick={reset}>
          Try Again
        </Button>
      </Stack>
    </Container>
  );
}
