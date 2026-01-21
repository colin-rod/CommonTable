'use client';

import type { MealRequest, MealRequestId, Recipe } from '@commontable/types';
import { List, Typography, Box } from '@mui/material';

import { MealRequestListItem } from './MealRequestListItem';

interface MealRequestListProps {
  requests: MealRequest[];
  recipes: Recipe[];
  requesterNames: Map<string, string>; // user_id -> display_name
  onAddToCalendar: (id: MealRequestId) => void;
  onDismiss: (id: MealRequestId) => void;
  onUpdatePriority: (id: MealRequestId, delta: number) => void;
}

/**
 * MealRequestList Component
 *
 * Displays a list of meal requests
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses List component
 * - Shows empty state with Typography
 * - No custom styling beyond MUI components
 */
export function MealRequestList({
  requests,
  recipes,
  requesterNames,
  onAddToCalendar,
  onDismiss,
  onUpdatePriority,
}: MealRequestListProps) {
  // Empty state
  if (requests.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No meal requests yet
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {requests.map((request) => {
        const recipe = request.recipe_id
          ? recipes.find((r) => r.id === request.recipe_id)
          : undefined;
        const requesterName = requesterNames.get(request.requested_by) || 'Unknown';

        return (
          <MealRequestListItem
            key={request.id}
            request={request}
            recipe={recipe}
            requesterName={requesterName}
            onAddToCalendar={() => onAddToCalendar(request.id)}
            onDismiss={() => onDismiss(request.id)}
            onUpdatePriority={(delta) => onUpdatePriority(request.id, delta)}
          />
        );
      })}
    </List>
  );
}
