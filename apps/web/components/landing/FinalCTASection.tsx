'use client';

import { Stack, Typography, Button, Link } from '@mui/material';

export function FinalCTASection() {
  return (
    <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', py: 6 }}>
      {/* Headline - h6 per DESIGN_SYSTEM.md */}
      <Typography variant="h6">Ready to get started?</Typography>

      {/* Body text - body1 per DESIGN_SYSTEM.md */}
      <Typography variant="body1">Create your household recipe book in minutes.</Typography>

      {/* Primary CTA - contained primary button */}
      <Button
        variant="contained"
        color="primary"
        size="large"
        href="/auth/signup"
        LinkComponent={Link}
      >
        Sign up for free
      </Button>

      {/* Secondary CTA - text link */}
      <Typography variant="body2">
        <Link href="/auth/login" sx={{ color: 'primary.main' }}>
          Log in to your account
        </Link>
      </Typography>
    </Stack>
  );
}
