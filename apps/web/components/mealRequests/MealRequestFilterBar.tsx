'use client';

import type { MealRequestStatus } from '@commontable/types';
import { Tabs, Tab, Box } from '@mui/material';
import type { SyntheticEvent } from 'react';

interface MealRequestFilterBarProps {
  statusFilter: MealRequestStatus | 'all';
  onStatusFilterChange: (status: MealRequestStatus | 'all') => void;
}

/**
 * MealRequestFilterBar Component
 *
 * Provides status filtering tabs for meal requests
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses Tabs component
 * - Neutral labels (no emojis)
 * - Only approved MUI components
 */
export function MealRequestFilterBar({
  statusFilter,
  onStatusFilterChange,
}: MealRequestFilterBarProps) {
  const handleChange = (_: SyntheticEvent, newValue: MealRequestStatus | 'all') => {
    onStatusFilterChange(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={statusFilter}
        onChange={handleChange}
        aria-label="Filter meal requests by status"
      >
        <Tab label="All" value="all" />
        <Tab label="Open" value="open" />
        <Tab label="Planned" value="planned" />
        <Tab label="Dismissed" value="dismissed" />
      </Tabs>
    </Box>
  );
}
