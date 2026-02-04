'use client';

import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
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
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useRecipeQueue } from '@/hooks/useRecipeQueue';
import { useShortlistStore } from '@/stores/useShortlistStore';

interface ShortlistDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ShortlistDrawer({ open, onClose }: ShortlistDrawerProps) {
  const router = useRouter();
  const { items, loading, error, remove } = useShortlistStore();
  const { addToQueue } = useRecipeQueue();
  const [addingToQueue, setAddingToQueue] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipes/${recipeId}`);
    onClose(); // Close drawer after navigation
  };

  const handleAddToQueue = async (recipeId: string, recipeTitle: string) => {
    try {
      setAddingToQueue(recipeId);
      await addToQueue(recipeId);
      setSnackbarMessage(`Added "${recipeTitle}" to queue`);
    } catch (err) {
      console.error('Failed to add to queue:', err);
      setSnackbarMessage('Failed to add to queue');
    } finally {
      setAddingToQueue(null);
    }
  };

  const handleAddAllToQueue = async () => {
    try {
      setAddingToQueue('all');
      await Promise.all(items.map((item) => addToQueue(item.recipe.id)));
      setSnackbarMessage(`Added ${items.length} recipes to queue`);
    } catch (err) {
      console.error('Failed to add all to queue:', err);
      setSnackbarMessage('Failed to add all to queue');
    } finally {
      setAddingToQueue(null);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Shortlist {items.length > 0 && `(${items.length})`}
            </Typography>
            <IconButton onClick={onClose} aria-label="Close shortlist">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Add All to Queue Button */}
          {!loading && !error && items.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddAllToQueue}
              disabled={addingToQueue === 'all'}
              fullWidth
              startIcon={<AddIcon />}
            >
              {addingToQueue === 'all' ? 'Adding All...' : 'Add All to Queue'}
            </Button>
          )}
        </Stack>

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
              {error}
            </Typography>
          </Box>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No recipes in shortlist
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add recipes from the discovery panel to plan your meals
            </Typography>
          </Box>
        )}

        {/* Recipe List */}
        {!loading && !error && items.length > 0 && (
          <List>
            {items.map((item) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => handleAddToQueue(item.recipe.id, item.recipe.title)}
                      disabled={addingToQueue === item.recipe.id}
                      startIcon={<AddIcon />}
                    >
                      {addingToQueue === item.recipe.id ? 'Adding...' : 'Queue'}
                    </Button>
                    <IconButton
                      edge="end"
                      aria-label={`Remove ${item.recipe.title} from shortlist`}
                      onClick={() => remove(item.recipe.id)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemButton onClick={() => handleRecipeClick(item.recipe.id)}>
                  <ListItemText
                    primary={item.recipe.title}
                    secondary={`Added by ${item.addedBy.name}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {/* Success Snackbar */}
        <Snackbar
          open={!!snackbarMessage}
          autoHideDuration={3000}
          onClose={() => setSnackbarMessage(null)}
          message={snackbarMessage}
        />
      </Box>
    </Drawer>
  );
}
