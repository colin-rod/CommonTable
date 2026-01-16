'use client';

import type { StepInput } from '@commontable/types';
import { List, ListItem, ListItemText, Typography, Box } from '@mui/material';

interface StepListProps {
  steps: StepInput[];
}

/**
 * StepList Component
 *
 * Displays recipe steps with:
 * - Step numbers (1. 2. 3.)
 * - Step text
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses List as primary pattern
 * - body1 for step text
 * - Numbered list format
 */
export function StepList({ steps }: StepListProps) {
  if (steps.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No steps listed
        </Typography>
      </Box>
    );
  }

  // Sort steps by position
  const sortedSteps = [...steps].sort((a, b) => a.position - b.position);

  return (
    <List disablePadding>
      {sortedSteps.map((step, index) => (
        <ListItem key={step.position} disablePadding sx={{ py: 1, alignItems: 'flex-start' }}>
          <Box
            sx={{
              minWidth: 32,
              pt: 0.25,
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              {index + 1}.
            </Typography>
          </Box>
          <ListItemText
            primary={step.text}
            primaryTypographyProps={{
              variant: 'body1',
              sx: { whiteSpace: 'pre-wrap' },
            }}
          />
        </ListItem>
      ))}
    </List>
  );
}
