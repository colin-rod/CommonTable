'use client';

import type { CalendarEntry } from '@commontable/types';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Box, Typography, IconButton, Chip } from '@mui/material';

interface CalendarEntryCardProps {
  entry: CalendarEntry;
  onEdit: () => void;
  onDelete: () => void;
  onViewRecipe?: () => void;
  onMarkComplete: () => void;
}

/**
 * Get status badge color
 */
function getStatusColor(
  status: CalendarEntry['status'],
): 'default' | 'primary' | 'success' | 'error' {
  switch (status) {
    case 'planned':
      return 'default';
    case 'confirmed':
      return 'primary';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: CalendarEntry['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Calendar entry card with recipe info and action buttons
 *
 * Design System Compliance:
 * - Typography: body1 for title, body2 for notes
 * - IconButtons for actions (secondary actions)
 * - Material Icons only
 * - Chip for status badge
 * - Spacing: 8px base grid
 */
export function CalendarEntryCard({
  entry,
  onEdit,
  onDelete,
  onViewRecipe,
  onMarkComplete,
}: CalendarEntryCardProps) {
  const showCompleteButton = entry.status === 'planned' || entry.status === 'confirmed';

  return (
    <Box>
      {/* Recipe title or notes-only indicator */}
      <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
        {entry.recipe_id ? 'Recipe assigned' : 'Notes only'}
      </Typography>

      {/* Notes */}
      {entry.notes && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {entry.notes}
        </Typography>
      )}

      {/* Status badge */}
      <Box sx={{ mb: 1 }}>
        <Chip
          label={getStatusLabel(entry.status)}
          color={getStatusColor(entry.status)}
          size="small"
        />
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton size="small" onClick={onEdit} aria-label="Edit calendar entry" title="Edit">
          <EditIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          onClick={onDelete}
          aria-label="Delete calendar entry"
          title="Delete"
          color="error"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>

        {onViewRecipe && (
          <IconButton
            size="small"
            onClick={onViewRecipe}
            aria-label="View recipe"
            title="View recipe"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        )}

        {showCompleteButton && (
          <IconButton
            size="small"
            onClick={onMarkComplete}
            aria-label="Mark as completed"
            title="Mark as completed"
          >
            <CheckCircleIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
