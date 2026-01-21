'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Button } from '@mui/material';

interface AddMealButtonProps {
  onClick: () => void;
}

/**
 * Button for adding a meal to an empty calendar slot
 *
 * Design System Compliance:
 * - Outlined button variant (secondary action)
 * - Material Icon (Add)
 * - Calm, neutral label
 */
export function AddMealButton({ onClick }: AddMealButtonProps) {
  return (
    <Button
      variant="outlined"
      color="primary"
      startIcon={<AddIcon />}
      onClick={onClick}
      fullWidth
      sx={{ justifyContent: 'flex-start' }}
    >
      Add meal
    </Button>
  );
}
