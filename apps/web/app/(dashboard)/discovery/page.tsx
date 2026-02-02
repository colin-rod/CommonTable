'use client';

import { Stack, Container } from '@mui/material';
import { useState } from 'react';

import { ShortlistDrawer } from '@/components/recipe/ShortlistDrawer';
import { ShortlistFAB } from '@/components/recipe/ShortlistFAB';
import { WhatCanICookPanel } from '@/components/recipe/WhatCanICookPanel';

/**
 * Discovery Page (What Can I Cook?)
 *
 * Main recipe discovery page that helps users find recipes they can cook
 * based on available ingredients. Integrates:
 * - WhatCanICookPanel: Grid view of recipes with filters and search
 * - ShortlistFAB: Floating action button for quick shortlist access
 * - ShortlistDrawer: Side drawer for managing shortlisted recipes
 *
 * Follows DESIGN_SYSTEM.md:
 * - Container with maxWidth="md"
 * - Stack with spacing={3} for layout
 * - h5 for page title
 * - Material Design 3 components only
 */
export default function DiscoveryPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        {/* Main Content: Recipe Discovery Panel (includes title) */}
        <WhatCanICookPanel />

        {/* Floating Action Button: Shortlist Access */}
        <ShortlistFAB onClick={handleOpenDrawer} />

        {/* Side Drawer: Shortlist Management */}
        <ShortlistDrawer open={drawerOpen} onClose={handleCloseDrawer} />
      </Stack>
    </Container>
  );
}
