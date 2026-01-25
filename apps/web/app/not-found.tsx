'use client';

import { Container, Stack, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

/**
 * NotFound Page (404)
 * Custom 404 page for handling invalid routes
 *
 * Features:
 * - Clear error message
 * - Button to navigate home
 * - Centered layout
 *
 * Design System Compliance:
 * - Typography: h5 for title, body1 for description
 * - Button: outlined (secondary action)
 * - Stack spacing 2 (16px)
 * - Container centered
 */
export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <Container maxWidth="sm">
      <Stack spacing={2} alignItems="center" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5">Page not found</Typography>
        <Typography variant="body1" color="text.secondary">
          The page you're looking for doesn't exist
        </Typography>
        <Button variant="outlined" color="primary" onClick={handleGoHome}>
          Go Home
        </Button>
      </Stack>
    </Container>
  );
}
