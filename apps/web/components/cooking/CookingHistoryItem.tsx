'use client';

import type { UpdateCookingEventInput } from '@commontable/api-client';
import type { CookingEvent, CookingEventId } from '@commontable/types';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {
  Stack,
  Typography,
  Box,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { useState } from 'react';

interface CookingHistoryItemProps {
  event: CookingEvent;
  onUpdate: (id: CookingEventId, data: UpdateCookingEventInput) => Promise<void>;
}

/**
 * CookingHistoryItem - Displays a single cooking event with inline editing
 *
 * Design System Compliance:
 * - Typography: body1 for main content, body2 for meta/secondary info
 * - Button variants: outlined (Edit), contained (Save)
 * - Material Icons: Star, StarBorder
 * - Spacing: 8px base grid (1, 2, 3 units)
 * - No emojis, calm neutral tone
 */
export function CookingHistoryItem({ event, onUpdate }: CookingHistoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRating, setEditedRating] = useState<number | null>(event.rating);
  const [editedNotes, setEditedNotes] = useState(event.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onUpdate(event.id, {
        rating: editedRating,
        notes: editedNotes.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update cooking event:', err);
      setError("Couldn't save rating. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedRating(event.rating);
    setEditedNotes(event.notes || '');
    setIsEditing(false);
    setError(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={2}>
          {/* Date */}
          <Typography variant="body2" color="text.secondary">
            {new Date(event.cooked_at).toLocaleDateString()}
          </Typography>

          {/* Rating (read-only or editable) */}
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <IconButton
                  key={rating}
                  size="small"
                  onClick={() => setEditedRating(rating)}
                  disabled={loading}
                  aria-label={`Rate ${rating} ${rating === 1 ? 'star' : 'stars'}`}
                >
                  {editedRating && rating <= editedRating ? (
                    <StarIcon fontSize="small" />
                  ) : (
                    <StarBorderIcon fontSize="small" />
                  )}
                </IconButton>
              ))}
            </Box>
          ) : event.rating ? (
            <Box
              sx={{ display: 'flex', gap: 0.25 }}
              role="img"
              aria-label={`${event.rating} stars`}
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <Box key={rating}>
                  {event.rating && rating <= event.rating ? (
                    <StarIcon fontSize="small" />
                  ) : (
                    <StarBorderIcon fontSize="small" />
                  )}
                </Box>
              ))}
            </Box>
          ) : null}

          {/* Notes (read-only or editable) */}
          {isEditing ? (
            <TextField
              label="Notes"
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              multiline
              rows={2}
              fullWidth
              disabled={loading}
              placeholder="Add notes about this meal..."
            />
          ) : (
            event.notes && <Typography variant="body1">{event.notes}</Typography>
          )}

          {/* Servings (read-only always) */}
          {event.servings_made && (
            <Typography variant="body2" color="text.secondary">
              {event.servings_made} servings
            </Typography>
          )}

          {/* Actions */}
          {isEditing ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <CircularProgress size={16} /> : 'Save'}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </Stack>
          ) : (
            <Button variant="outlined" color="primary" size="small" onClick={handleEdit}>
              Edit
            </Button>
          )}

          {/* Error message */}
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
