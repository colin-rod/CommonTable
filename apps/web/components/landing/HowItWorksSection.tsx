'use client';

import { Stack, Typography, List, ListItem, ListItemText } from '@mui/material';

export function HowItWorksSection() {
  return (
    <Stack spacing={3} sx={{ py: 6 }}>
      {/* Section Header - h6 per DESIGN_SYSTEM.md */}
      <Typography variant="h6" sx={{ textAlign: 'center' }}>
        How it works
      </Typography>

      {/* Step List */}
      <List>
        <ListItem>
          <ListItemText
            primary="1. Create your household"
            secondary="Sign up and invite family members or roommates."
            primaryTypographyProps={{ variant: 'body1', fontWeight: 'bold' }}
            secondaryTypographyProps={{ variant: 'body1' }}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="2. Add your recipes"
            secondary="Import from URLs or add manually. Tag and organize."
            primaryTypographyProps={{ variant: 'body1', fontWeight: 'bold' }}
            secondaryTypographyProps={{ variant: 'body1' }}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="3. Plan together"
            secondary="Add recipes to your calendar and review meal requests."
            primaryTypographyProps={{ variant: 'body1', fontWeight: 'bold' }}
            secondaryTypographyProps={{ variant: 'body1' }}
          />
        </ListItem>
      </List>
    </Stack>
  );
}
