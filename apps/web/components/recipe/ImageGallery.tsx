'use client';

import type { RecipeImage, RecipeImageId } from '@commontable/types';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import StarOutlined from '@mui/icons-material/StarOutlined';
import { Box, Stack, Typography, IconButton, CircularProgress } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';

/**
 * Props for the ImageGallery component
 */
export interface ImageGalleryProps {
  /** Array of recipe images to display */
  images: RecipeImage[];
  /** Loading state */
  loading?: boolean;
  /** Get URL for an image (signed or public) */
  getImageUrl: (image: RecipeImage) => Promise<string>;
  /** Called when user wants to set an image as primary */
  onSetPrimary?: (imageId: RecipeImageId) => void;
  /** Called when user wants to edit an image */
  onEdit?: (image: RecipeImage) => void;
  /** Called when user wants to delete an image */
  onDelete?: (imageId: RecipeImageId) => void;
  /** Whether gallery is in edit mode (shows action buttons) */
  editMode?: boolean;
}

/**
 * Single image item in the gallery
 */
interface ImageItemProps {
  image: RecipeImage;
  imageUrl: string | null;
  editMode: boolean;
  onSetPrimary?: (imageId: RecipeImageId) => void;
  onEdit?: (image: RecipeImage) => void;
  onDelete?: (imageId: RecipeImageId) => void;
}

function ImageItem({ image, imageUrl, editMode, onSetPrimary, onEdit, onDelete }: ImageItemProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        aspectRatio: '4/3',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: image.is_primary ? '2px solid' : '1px solid',
        borderColor: image.is_primary ? 'primary.main' : 'divider',
      }}
    >
      {/* Image */}
      {imageUrl ? (
        <Box
          component="img"
          src={imageUrl}
          alt={image.alt_text || 'Recipe image'}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Primary indicator badge */}
      {image.is_primary && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 0.5,
            px: 0.5,
            py: 0.25,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <StarOutlined sx={{ fontSize: 14 }} />
          <Typography variant="body2" sx={{ fontSize: 10, fontWeight: 500 }}>
            Cover
          </Typography>
        </Box>
      )}

      {/* Action buttons (edit mode only) */}
      {editMode && (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            bgcolor: 'rgba(255,255,255,0.9)',
            borderRadius: 0.5,
            p: 0.25,
          }}
        >
          {!image.is_primary && onSetPrimary && (
            <IconButton size="small" onClick={() => onSetPrimary(image.id)} title="Set as cover">
              <StarOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          {onEdit && (
            <IconButton size="small" onClick={() => onEdit(image)} title="Edit">
              <EditOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              onClick={() => onDelete(image.id)}
              title="Delete"
              color="error"
            >
              <DeleteOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Stack>
      )}
    </Box>
  );
}

/**
 * ImageGallery Component
 *
 * Displays a grid of recipe images with optional edit actions.
 * Images are loaded asynchronously using signed URLs.
 *
 * Follows Material Design 3:
 * - Grid layout using CSS Grid
 * - Box with border for image containers
 * - IconButton for secondary actions
 */
export function ImageGallery({
  images,
  loading = false,
  getImageUrl,
  onSetPrimary,
  onEdit,
  onDelete,
  editMode = false,
}: ImageGalleryProps) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  /**
   * Load URLs for all images
   */
  const loadImageUrls = useCallback(async () => {
    const urls: Record<string, string> = {};

    await Promise.all(
      images.map(async (image) => {
        try {
          const url = await getImageUrl(image);
          urls[image.id] = url;
        } catch (error) {
          console.error(`Failed to load URL for image ${image.id}:`, error);
        }
      }),
    );

    setImageUrls(urls);
  }, [images, getImageUrl]);

  // Load URLs when images change
  useEffect(() => {
    if (images.length > 0) {
      void loadImageUrls();
    }
  }, [images, loadImageUrls]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (images.length === 0) {
    return (
      <Box
        sx={{
          py: 4,
          textAlign: 'center',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No images yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 2,
      }}
    >
      {images.map((image) => (
        <ImageItem
          key={image.id}
          image={image}
          imageUrl={imageUrls[image.id] || null}
          editMode={editMode}
          onSetPrimary={onSetPrimary}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
}
