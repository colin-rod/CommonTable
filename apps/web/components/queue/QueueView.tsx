'use client';

import type { LaneType } from '@commontable/types';
import { LANE_TYPES } from '@commontable/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useState, useCallback } from 'react';

import { QueueLane } from './QueueLane';

import { useRecipeQueue } from '@/hooks/useRecipeQueue';

export function QueueView() {
  const [selectedLaneType, setSelectedLaneType] = useState<LaneType>('meal_type');

  const { lanes, loading, reorder, markAsCooked, remove } = useRecipeQueue(selectedLaneType);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      // Find which lane the items are in
      const activeLane = Object.entries(lanes).find(([_, entries]) =>
        entries.some((e) => e.id === active.id),
      );

      if (!activeLane) {
        return;
      }

      const [_, laneEntries] = activeLane;
      const oldIndex = laneEntries.findIndex((e) => e.id === active.id);
      const newIndex = laneEntries.findIndex((e) => e.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        void reorder(active.id as string, newIndex);
      }
    },
    [lanes, reorder],
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  const laneKeys = Object.keys(lanes);
  const hasEntries = laneKeys.length > 0;

  return (
    <Stack spacing={3}>
      <Box>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Group by</InputLabel>
          <Select
            value={selectedLaneType}
            label="Group by"
            onChange={(e) => setSelectedLaneType(e.target.value as LaneType)}
          >
            {Object.values(LANE_TYPES).map((laneConfig) => (
              <MenuItem key={laneConfig.type} value={laneConfig.type}>
                {laneConfig.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!hasEntries && (
        <Typography variant="body2" color="text.secondary">
          No recipes in meal plan. Add recipes to get started.
        </Typography>
      )}

      {hasEntries && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 2,
            }}
          >
            {laneKeys.map((laneKey) => {
              const laneEntries = lanes[laneKey];
              if (!laneEntries || laneEntries.length === 0) {
                return null;
              }

              return (
                <SortableContext
                  key={laneKey}
                  items={laneEntries.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <QueueLane
                    laneKey={laneKey}
                    laneLabel={laneKey === 'uncategorized' ? 'Uncategorized' : laneKey}
                    entries={laneEntries}
                    onMarkCooked={(id) => void markAsCooked(id)}
                    onRemove={(id) => void remove(id)}
                  />
                </SortableContext>
              );
            })}
          </Box>
        </DndContext>
      )}
    </Stack>
  );
}
