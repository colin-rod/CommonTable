'use client';

import type { MealSlot } from '@commontable/types';
import CoffeeIcon from '@mui/icons-material/Coffee';
import CookieIcon from '@mui/icons-material/Cookie';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { List, ListItem, ListItemText, Typography, Box, Stack } from '@mui/material';
import { format, isToday, isTomorrow } from 'date-fns';

import type { CalendarEntryWithRecipe } from '@/app/actions/dashboard';

export interface UpcomingMealsProps {
  entries: CalendarEntryWithRecipe[];
}

/**
 * Get the icon for a meal slot
 */
function getMealSlotIcon(mealSlot: MealSlot) {
  switch (mealSlot) {
    case 'breakfast':
      return <CoffeeIcon fontSize="small" />;
    case 'lunch':
      return <WbSunnyIcon fontSize="small" />;
    case 'dinner':
      return <NightsStayIcon fontSize="small" />;
    case 'snack':
      return <CookieIcon fontSize="small" />;
  }
}

/**
 * Format the date for display
 */
function formatDate(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  return format(date, 'EEEE'); // Day name (e.g., "Wednesday")
}

/**
 * UpcomingMeals component
 * Displays a list of upcoming calendar entries for the next 7 days
 */
export function UpcomingMeals({ entries }: UpcomingMealsProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Upcoming Meals</Typography>

      {entries.length === 0 ? (
        <Box textAlign="center" py={3}>
          <Typography variant="body2" color="text.secondary">
            No meals planned for the next 7 days
          </Typography>
        </Box>
      ) : (
        <List>
          {entries.map((entry) => (
            <ListItem key={entry.id} disablePadding>
              <ListItemText
                primary={entry.recipe_title || 'Meal planned'}
                secondary={
                  <>
                    {getMealSlotIcon(entry.meal_slot)} {formatDate(entry.planned_date)}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}
