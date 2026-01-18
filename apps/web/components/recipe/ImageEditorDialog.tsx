/* eslint-disable no-undef */
'use client';

import type { RecipeImage, RecipeImageId, UpdateRecipeImageInput } from '@commontable/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Checkbox,
  FormControlLabel,
  Box,
  CircularProgress,
} from '@mui/material';
import { useState, useCallback, useEffect } from 'react';

/**
 * Props for the ImageEditorDialog component
 */
export interface ImageEditorDialogProps {
  /** Image to edit (null when closed) */
  image: RecipeImage | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Close the dialog */
  onClose: () => void;
  /** Save changes to the image */
  onSave: (imageId: RecipeImageId, updates: UpdateRecipeImageInput) => Promise<void>;
  /** Delete the image */
  onDelete: (imageId: RecipeImageId) => Promise<void>;
  /** Get URL for the image */
  getImageUrl: (image: RecipeImage) => Promise<string>;
}

/**
 * ImageEditorDialog Component
 *
 * Dialog for editing image metadata (alt text, primary status, public status).
 * Also provides delete functionality.
 *
 * Follows Material Design 3:
 * - Dialog component for modal
 * - TextField for alt text input
 * - Checkbox for boolean options
 * - Button variants: outlined (Cancel), contained primary (Save), contained error (Delete)
 */
export function ImageEditorDialog({
  image,
  open,
  onClose,
  onSave,
  onDelete,
  getImageUrl,
}: ImageEditorDialogProps) {
  const [altText, setAltText] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Reset form when image changes
  useEffect(() => {
    if (image) {
      setAltText(image.alt_text || '');
      setIsPrimary(image.is_primary);
      setIsPublic(image.is_public);

      // Load image URL
      void getImageUrl(image)
        .then(setImageUrl)
        .catch(() => setImageUrl(null));
    } else {
      setAltText('');
      setIsPrimary(false);
      setIsPublic(false);
      setImageUrl(null);
    }
  }, [image, getImageUrl]);

  /**
   * Handle save
   */
  const handleSave = useCallback(async () => {
    if (!image) return;

    const updates: UpdateRecipeImageInput = {};

    // Only include changed fields
    if (altText !== (image.alt_text || '')) {
      updates.altText = altText || null;
    }
    if (isPrimary !== image.is_primary) {
      updates.isPrimary = isPrimary;
    }
    if (isPublic !== image.is_public) {
      updates.isPublic = isPublic;
    }

    // Skip if nothing changed
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    try {
      setSaving(true);
      await onSave(image.id, updates);
      onClose();
    } catch (error) {
      console.error('Failed to save image:', error);
    } finally {
      setSaving(false);
    }
  }, [image, altText, isPrimary, isPublic, onSave, onClose]);

  /**
   * Handle delete
   */
  const handleDelete = useCallback(async () => {
    if (!image) return;

    // Confirm deletion

    const confirmed = confirm('Delete this image? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeleting(true);
      await onDelete(image.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete image:', error);
    } finally {
      setDeleting(false);
    }
  }, [image, onDelete, onClose]);

  const isLoading = saving || deleting;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Image</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* Image preview */}
          {imageUrl && (
            <Box
              component="img"
              src={imageUrl}
              alt={altText || 'Preview'}
              sx={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'contain',
                borderRadius: 1,
                bgcolor: 'background.default',
              }}
            />
          )}

          {/* Alt text */}
          <TextField
            label="Alt text (accessibility)"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image for screen readers"
            multiline
            rows={2}
            fullWidth
            disabled={isLoading}
            helperText="Helps users with screen readers understand the image"
          />

          {/* Set as primary */}
          <FormControlLabel
            control={
              <Checkbox
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                disabled={isLoading || image?.is_primary}
              />
            }
            label="Set as cover image"
          />

          {/* Make public (future feature) */}
          <FormControlLabel
            control={
              <Checkbox
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isLoading}
              />
            }
            label="Make publicly accessible"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button variant="contained" color="error" onClick={handleDelete} disabled={isLoading}>
          {deleting ? <CircularProgress size={20} /> : 'Delete'}
        </Button>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={isLoading}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
