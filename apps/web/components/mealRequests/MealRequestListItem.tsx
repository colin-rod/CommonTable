'use client';

import type { MealRequest, Recipe } from '@commontable/types';
import {
  AddCircle as AddToCalendarIcon,
  Close as DismissIcon,
  ArrowUpward as PriorityUpIcon,
  ArrowDownward as PriorityDownIcon,
} from '@mui/icons-material';
import {
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

interface MealRequestListItemProps {
  request: MealRequest;
  recipe?: Recipe;
  requesterName: string;
  onAddToCalendar: () => void;
  onDismiss: () => void;
  onUpdatePriority: (delta: number) => void;
}

/**
 * MealRequestListItem Component
 *
 * Displays a single meal request in a list with:
 * - Recipe title or notes excerpt (primary text)
 * - Requester, date, meal slot, priority (secondary text)
 * - Status badge
 * - Action buttons (add to calendar, dismiss, priority up/down)
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses ListItemButton for full-row clickability (only if recipe exists)
 * - Icon-only buttons for secondary actions
 * - Chip for status badge
 * - No emojis, calm neutral tone
 */
export function MealRequestListItem({
  request,
  recipe,
  requesterName,
  onAddToCalendar,
  onDismiss,
  onUpdatePriority,
}: MealRequestListItemProps) {
  const router = useRouter();

  const handleClick = () => {
    // Only navigate if recipe exists
    if (recipe) {
      router.push(`/recipes/${recipe.id}`);
    }
  };

  const handleAddToCalendar = (e: MouseEvent) => {
    e.stopPropagation();
    onAddToCalendar();
  };

  const handleDismiss = (e: MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  const handlePriorityUp = (e: MouseEvent) => {
    e.stopPropagation();
    onUpdatePriority(1);
  };

  const handlePriorityDown = (e: MouseEvent) => {
    e.stopPropagation();
    onUpdatePriority(-1);
  };

  // Format date
  const formatDate = (date: Date): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format meal slot
  const formatMealSlot = (slot: string): string => {
    return slot.charAt(0).toUpperCase() + slot.slice(1);
  };

  // Get status badge color
  const getStatusColor = (
    status: string,
  ): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'open':
        return 'default';
      case 'planned':
        return 'primary';
      case 'dismissed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Build primary text (recipe title or notes excerpt)
  const primaryText = recipe ? recipe.title : request.notes || 'No description';
  const truncatedPrimary = primaryText.length > 60 ? `${primaryText.slice(0, 57)}...` : primaryText;

  // Build secondary text
  const secondaryParts: string[] = [
    `Requested by ${requesterName}`,
    `${formatDate(request.requested_date)} at ${formatMealSlot(request.requested_meal_slot)}`,
  ];

  if (request.priority !== 0) {
    secondaryParts.push(`Priority: ${request.priority}`);
  }

  // Show actions only for open requests
  const showActions = request.status === 'open';

  return (
    <ListItem
      disablePadding
      secondaryAction={
        showActions ? (
          <Stack direction="row" spacing={0.5}>
            {/* Priority down */}
            <IconButton
              edge="end"
              onClick={handlePriorityDown}
              aria-label="Decrease priority"
              size="small"
            >
              <PriorityDownIcon fontSize="small" />
            </IconButton>

            {/* Priority up */}
            <IconButton
              edge="end"
              onClick={handlePriorityUp}
              aria-label="Increase priority"
              size="small"
            >
              <PriorityUpIcon fontSize="small" />
            </IconButton>

            {/* Add to calendar */}
            <IconButton
              edge="end"
              onClick={handleAddToCalendar}
              aria-label="Add to calendar"
              color="primary"
            >
              <AddToCalendarIcon />
            </IconButton>

            {/* Dismiss */}
            <IconButton edge="end" onClick={handleDismiss} aria-label="Dismiss" color="error">
              <DismissIcon />
            </IconButton>
          </Stack>
        ) : undefined
      }
    >
      {recipe ? (
        <ListItemButton onClick={handleClick}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <ListItemText
              primary={truncatedPrimary}
              secondary={secondaryParts.join(' · ')}
              sx={{ mr: showActions ? 20 : 2 }}
            />
            <Chip
              label={request.status}
              color={getStatusColor(request.status)}
              size="small"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>
        </ListItemButton>
      ) : (
        <ListItem>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <ListItemText
              primary={truncatedPrimary}
              secondary={secondaryParts.join(' · ')}
              sx={{ mr: showActions ? 20 : 2 }}
            />
            <Chip
              label={request.status}
              color={getStatusColor(request.status)}
              size="small"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>
        </ListItem>
      )}
    </ListItem>
  );
}
