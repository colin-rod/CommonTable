'use client';

import { Stack, Container } from '@mui/material';

import { WhatCanICookPanel } from '@/components/recipe/WhatCanICookPanel';

/**
 * Discovery Page (What Can I Cook?)
 *
 * Main recipe discovery page that helps users find recipes they can cook
 * based on available ingredients. Integrates:
 * - WhatCanICookPanel: Grid view of recipes with filters and search
 * - Meal Plan actions are provided by the dashboard layout
 *
 * Follows DESIGN_SYSTEM.md:
 * - Container with maxWidth="md"
 * - Stack with spacing={3} for layout
 * - h5 for page title
 * - Material Design 3 components only
 */
export default function DiscoveryPage() {
  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        {/* Main Content: Recipe Discovery Panel (includes title) */}
        <WhatCanICookPanel />
      </Stack>
    </Container>
  );
}
