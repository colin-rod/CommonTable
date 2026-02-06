'use client';

import { Restaurant as RestaurantIcon } from '@mui/icons-material';
import { Badge, Box, Fab } from '@mui/material';

import { useShortlistStore } from '@/stores/useShortlistStore';

interface ShortlistFABProps {
  onClick: () => void;
}

export function ShortlistFAB({ onClick }: ShortlistFABProps) {
  const { getCount } = useShortlistStore();
  const count = getCount();

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
      }}
    >
      <Badge
        badgeContent={count}
        color="error"
        max={9}
        invisible={count === 0}
        overlap="circular"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ '& .MuiBadge-badge': { top: 6, right: 6 } }}
      >
        <Fab
          color="primary"
          onClick={onClick}
          aria-label={count > 0 ? `Shortlist (${count} items)` : 'Shortlist'}
        >
          <RestaurantIcon />
        </Fab>
      </Badge>
    </Box>
  );
}
