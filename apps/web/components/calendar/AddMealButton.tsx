'use client';

import AddIcon from '@mui/icons-material/Add';
import { IconButton, Stack, Typography } from '@mui/material';

interface AddMealButtonProps {
  onClick: () => void;
}

/**
 * Icon button for adding a meal to an empty calendar slot
 * Shows "Add meal" text on hover
 *
 * Design System Compliance:
 * - IconButton for secondary action
 * - Material Icon (Add)
 * - Hover text with opacity transition
 * - Dashed border to indicate empty state
 * - aria-label for accessibility
 */
export function AddMealButton({ onClick }: AddMealButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      aria-label="Add meal"
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 48,
        borderRadius: 1,
        border: '1px dashed',
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
          '& .add-meal-text': {
            opacity: 1,
          },
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <AddIcon fontSize="small" />
        <Typography
          variant="body2"
          className="add-meal-text"
          sx={{
            opacity: 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          Add meal
        </Typography>
      </Stack>
    </IconButton>
  );
}
