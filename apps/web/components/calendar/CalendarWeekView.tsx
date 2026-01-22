'use client';

import type {
  MealSlot,
  RecipeId,
  CalendarEntryId,
  CalendarEntry,
  CreateCalendarEntryInput,
  UpdateCalendarEntryInput,
} from '@commontable/types';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

import { AddCalendarEntryDialog } from './AddCalendarEntryDialog';
import { DeleteCalendarEntryDialog } from './DeleteCalendarEntryDialog';
import { EditCalendarEntryDialog } from './EditCalendarEntryDialog';
import { WeekGrid } from './WeekGrid';
import { WeekNavigation } from './WeekNavigation';

import { LogMealDialog } from '@/components/cooking/LogMealDialog';
import { useCalendar } from '@/hooks/useCalendar';
import { useRecipes } from '@/hooks/useRecipes';
import { useWeekNavigation } from '@/hooks/useWeekNavigation';

/**
 * Container component for calendar week view
 *
 * Orchestrates:
 * - Week navigation state
 * - Calendar entries data fetching
 * - Dialog state management (add/edit/delete)
 * - Action handlers for all calendar operations
 *
 * Design System Compliance:
 * - Box for layout
 * - CircularProgress for loading state
 * - Typography for error messages
 */
export function CalendarWeekView() {
  const router = useRouter();

  // Week navigation
  const { currentWeekStart, currentWeekEnd, isCurrentWeek, goToPreviousWeek, goToNextWeek } =
    useWeekNavigation();

  // Calendar entries
  const {
    entries,
    loading: entriesLoading,
    error: entriesError,
    createEntry,
    updateEntry,
    deleteEntry,
    refresh,
  } = useCalendar(currentWeekStart, currentWeekEnd);

  // Recipes for autocomplete
  const { recipes, loading: recipesLoading } = useRecipes();

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logMealDialogOpen, setLogMealDialogOpen] = useState(false);

  // Selected date/slot for add dialog
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedMealSlot, setSelectedMealSlot] = useState<MealSlot | undefined>(undefined);

  // Selected entry for edit/delete/log meal dialogs
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

  // Refresh entries when week changes
  useEffect(() => {
    refresh();
  }, [currentWeekStart, currentWeekEnd, refresh]);

  // Add meal handler
  const handleAddMeal = useCallback((date: Date, mealSlot: MealSlot) => {
    setSelectedDate(date);
    setSelectedMealSlot(mealSlot);
    setAddDialogOpen(true);
  }, []);

  // Edit handler
  const handleEdit = useCallback(
    (id: CalendarEntryId) => {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        setSelectedEntry(entry);
        setEditDialogOpen(true);
      }
    },
    [entries],
  );

  // Delete handler
  const handleDelete = useCallback(
    (id: CalendarEntryId) => {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        setSelectedEntry(entry);
        setDeleteDialogOpen(true);
      }
    },
    [entries],
  );

  // View recipe handler
  const handleViewRecipe = useCallback(
    (recipeId: RecipeId) => {
      // Navigate to recipe detail page
      router.push(`/recipes/${recipeId}`);
    },
    [router],
  );

  // Mark complete handler - Opens LogMealDialog instead of directly marking complete
  const handleMarkComplete = useCallback(
    (id: CalendarEntryId) => {
      const entry = entries.find((e) => e.id === id);
      if (entry && entry.recipe_id) {
        setSelectedEntry(entry);
        setLogMealDialogOpen(true);
      }
    },
    [entries],
  );

  // Add dialog submit
  const handleAddSubmit = useCallback(
    async (data: CreateCalendarEntryInput) => {
      try {
        await createEntry(data);
      } catch (error) {
        console.error('Failed to create calendar entry:', error);
        throw error;
      }
    },
    [createEntry],
  );

  // Edit dialog submit
  const handleEditSubmit = useCallback(
    async (data: UpdateCalendarEntryInput) => {
      if (!selectedEntry) return;

      try {
        await updateEntry(selectedEntry.id, data);
      } catch (error) {
        console.error('Failed to update calendar entry:', error);
        throw error;
      }
    },
    [selectedEntry, updateEntry],
  );

  // Delete dialog confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedEntry) return;

    try {
      await deleteEntry(selectedEntry.id);
    } catch (error) {
      console.error('Failed to delete calendar entry:', error);
      throw error;
    }
  }, [selectedEntry, deleteEntry]);

  // Loading state
  if (entriesLoading || recipesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (entriesError) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="body1" color="error">
          Failed to load calendar entries. Please try again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Week Navigation */}
      <WeekNavigation
        weekStart={currentWeekStart}
        weekEnd={currentWeekEnd}
        onPrevious={goToPreviousWeek}
        onNext={goToNextWeek}
        isCurrentWeek={isCurrentWeek}
      />

      {/* Week Grid */}
      <WeekGrid
        weekStart={currentWeekStart}
        entries={entries}
        onAddMeal={handleAddMeal}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewRecipe={handleViewRecipe}
        onMarkComplete={handleMarkComplete}
      />

      {/* Add Dialog */}
      <AddCalendarEntryDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddSubmit}
        recipes={recipes}
        initialDate={selectedDate}
        initialMealSlot={selectedMealSlot}
      />

      {/* Edit Dialog */}
      <EditCalendarEntryDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleEditSubmit}
        recipes={recipes}
        entry={selectedEntry}
      />

      {/* Delete Dialog */}
      <DeleteCalendarEntryDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        entry={selectedEntry}
      />

      {/* Log Meal Dialog */}
      {selectedEntry?.recipe_id &&
        (() => {
          const recipe = recipes.find((r) => r.id === selectedEntry.recipe_id);
          if (!recipe || !recipe.current_version_id) return null;

          return (
            <LogMealDialog
              open={logMealDialogOpen}
              onClose={() => {
                setLogMealDialogOpen(false);
                setSelectedEntry(null);
              }}
              recipeId={recipe.id}
              recipeVersionId={recipe.current_version_id}
              recipeTitle={recipe.title}
              calendarEntryId={selectedEntry.id}
            />
          );
        })()}
    </Box>
  );
}
