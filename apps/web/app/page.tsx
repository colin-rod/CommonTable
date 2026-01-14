import { Container, Typography, Stack } from '@mui/material';

export default function HomePage() {
  return (
    <Container maxWidth="md">
      <Stack spacing={3} sx={{ paddingY: 4 }}>
        {/* Page Title - h5 per DESIGN_SYSTEM.md */}
        <Typography variant="h5">CommonTable</Typography>

        {/* Page Description - body1 per DESIGN_SYSTEM.md */}
        <Typography variant="body1">
          A shared household recipe book that helps families plan meals, improve
          recipes over time, and preserve what they love to cook — together.
        </Typography>

        {/* Secondary content - body2 per DESIGN_SYSTEM.md */}
        <Typography variant="body2" color="text.secondary">
          Currently in development. Phase 0: Monorepo setup complete.
        </Typography>
      </Stack>
    </Container>
  );
}
