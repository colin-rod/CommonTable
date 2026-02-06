'use client';

import {
  Close as CloseIcon,
  Check as CheckIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useMealPlan } from '@/hooks/useMealPlan';

interface MealPlanDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MealPlanDrawer({ open, onClose }: MealPlanDrawerProps) {
  const router = useRouter();
  const { entries, loading, error, count, removeFromMealPlan, markAsCooked } = useMealPlan();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipes/${recipeId}`);
    onClose();
  };

  const handleViewFullMealPlan = () => {
    router.push('/meal-plan');
    onClose();
  };

  const handleRemove = async (entryId: string) => {
    try {
      setActionInProgress(entryId);
      await removeFromMealPlan(entryId);
    } catch (err) {
      console.error('Failed to remove from meal plan:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkAsCooked = async (entryId: string) => {
    try {
      setActionInProgress(entryId);
      await markAsCooked(entryId);
    } catch (err) {
      console.error('Failed to mark as cooked:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Meal Plan{count > 0 ? ` (${count})` : ''}</Typography>
          <IconButton onClick={onClose} aria-label="Close meal plan">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="error">
              {error.message || 'Failed to load meal plan'}
            </Typography>
          </Box>
        )}

        {/* Empty State */}
        {!loading && !error && entries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No recipes in meal plan
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add recipes from any recipe page to plan your meals
            </Typography>
          </Box>
        )}

        {/* Meal Plan List */}
        {!loading && !error && entries.length > 0 && (
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <List>
              {entries.map((entry) => (
                <ListItem
                  key={entry.id}
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label={`Mark ${entry.recipe.title} as cooked`}
                        onClick={() => handleMarkAsCooked(entry.id)}
                        disabled={actionInProgress === entry.id}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label={`Remove ${entry.recipe.title} from meal plan`}
                        onClick={() => handleRemove(entry.id)}
                        disabled={actionInProgress === entry.id}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Stack>
                  }
                  disablePadding
                >
                  <ListItemButton onClick={() => handleRecipeClick(entry.recipe.id)}>
                    <ListItemText primary={entry.recipe.title} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* View Full Meal Plan Link */}
        {!loading && !error && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={handleViewFullMealPlan}
              endIcon={<OpenInNewIcon />}
            >
              View Full Meal Plan
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
