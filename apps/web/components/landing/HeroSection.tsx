'use client';

import { Stack, Typography, Button, Link } from '@mui/material';

export function HeroSection() {
  return (
    <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center', py: 6 }}>
      {/* Headline - h5 per DESIGN_SYSTEM.md */}
      <Typography variant="h5">A shared recipe book for your household</Typography>

      {/* Subheadline - body1 per DESIGN_SYSTEM.md */}
      <Typography variant="body1" color="text.secondary">
        Plan meals, improve recipes over time, and preserve what your family loves to cook —
        together.
      </Typography>

      {/* Primary CTA - contained primary button */}
      <Button
        variant="contained"
        color="primary"
        size="large"
        href="/auth/signup"
        LinkComponent={Link}
      >
        Get started
      </Button>

      {/* Secondary CTA - text link */}
      <Typography variant="body2">
        Already have an account?{' '}
        <Link href="/auth/login" sx={{ color: 'primary.main' }}>
          Log in
        </Link>
      </Typography>
    </Stack>
  );
}
