'use client';

import { Stack, Typography, Link, Box } from '@mui/material';

export function LandingFooter() {
  return (
    <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
      {/* Footer Links */}
      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/privacy" variant="body2" sx={{ color: 'text.primary' }}>
          Privacy Policy
        </Link>
        <Link href="/terms" variant="body2" sx={{ color: 'text.primary' }}>
          Terms of Service
        </Link>
        <Link href="mailto:support@commontable.app" variant="body2" sx={{ color: 'text.primary' }}>
          Support
        </Link>
      </Box>

      {/* Copyright Notice */}
      <Typography variant="body2" color="text.secondary">
        © 2026 CommonTable. All rights reserved.
      </Typography>
    </Stack>
  );
}
