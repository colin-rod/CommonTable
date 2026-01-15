import { Container, Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Auth Layout
 * Centered container for auth pages
 * Material Design 3 compliant
 *
 * Following CLAUDE.md constraints:
 * - Max width 400px
 * - Centered content
 * - No navigation
 * - Clean minimal design
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={4}>
          {/* Logo/Branding */}
          <Box textAlign="center">
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              CommonTable
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Shared household recipe book
            </Typography>
          </Box>

          {/* Auth Form */}
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 1,
              p: 4,
              boxShadow: 1,
            }}
          >
            {children}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
