'use client';

import type { QueueEntry } from '@commontable/api-client';
import type { Recipe } from '@commontable/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import {
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

interface QueueLaneProps {
  laneKey: string;
  laneLabel: string;
  entries: Array<QueueEntry & { recipe: Recipe }>;
  onMarkCooked: (entryId: string) => void;
  onRemove: (entryId: string) => void;
}

interface SortableQueueItemProps {
  entry: QueueEntry & { recipe: Recipe };
  onMarkCooked: (entryId: string) => void;
  onRemove: (entryId: string) => void;
}

function SortableQueueItem({ entry, onMarkCooked, onRemove }: SortableQueueItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: entry.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        mb: 1,
        border: 1,
        borderColor: 'divider',
      }}
      secondaryAction={
        <Stack direction="row" spacing={1}>
          <IconButton
            edge="end"
            onClick={() => onMarkCooked(entry.id)}
            aria-label="Mark as cooked"
            size="small"
          >
            <CheckIcon />
          </IconButton>
          <IconButton
            edge="end"
            onClick={() => onRemove(entry.id)}
            aria-label="Remove from queue"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      }
    >
      <ListItemIcon {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
        <DragIndicatorIcon />
      </ListItemIcon>
      <ListItemText primary={entry.recipe.title} secondary={entry.notes || undefined} />
    </ListItem>
  );
}

export function QueueLane({ laneLabel, entries, onMarkCooked, onRemove }: QueueLaneProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Paper elevation={1} sx={{ p: 2, minWidth: 320, maxWidth: 400 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{laneLabel}</Typography>
        <List disablePadding>
          {entries.map((entry) => (
            <SortableQueueItem
              key={entry.id}
              entry={entry}
              onMarkCooked={onMarkCooked}
              onRemove={onRemove}
            />
          ))}
        </List>
      </Stack>
    </Paper>
  );
}
