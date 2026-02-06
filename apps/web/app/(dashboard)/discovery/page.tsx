'use client';

import { Stack, Container } from '@mui/material';
import { useState } from 'react';

import { MealPlanDrawer } from '@/components/meal-plan/MealPlanDrawer';
import { MealPlanFAB } from '@/components/meal-plan/MealPlanFAB';
import { WhatCanICookPanel } from '@/components/recipe/WhatCanICookPanel';

/**
 * Discovery Page (What Can I Cook?)
 *
 * Main recipe discovery page that helps users find recipes they can cook
 * based on available ingredients. Integrates:
 * - WhatCanICookPanel: Grid view of recipes with filters and search
 * - MealPlanFAB: Floating action button for quick meal plan access
 * - MealPlanDrawer: Side drawer for managing meal plan items
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

        {/* Floating Action Button: Meal Plan Access */}
        <MealPlanFAB onClick={handleOpenDrawer} />

        {/* Side Drawer: Meal Plan Management */}
        <MealPlanDrawer open={drawerOpen} onClose={handleCloseDrawer} />
      </Stack>
    </Container>
  );
}
