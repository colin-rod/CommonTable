'use client';

import { IMAGE_CONSTRAINTS } from '@commontable/types';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import { Box, Button, CircularProgress, Stack, Typography, Alert } from '@mui/material';
import React, { useCallback, useState, useRef } from 'react';

import { isImageFile, createImagePreviewUrl, revokeImagePreviewUrl } from '@/lib/image/compress';

/**
 * Props for the ImageUploader component
 */
export interface ImageUploaderProps {
  /** Called when a file is selected and ready for upload */
  onFileSelect: (file: File) => Promise<void>;
  /** Whether upload is in progress */
  uploading?: boolean;
  /** Current number of images for the recipe (for limit checking) */
  currentImageCount: number;
  /** Whether the uploader is disabled */
  disabled?: boolean;
}

/**
 * Validates a file for upload
 * Returns null if valid, error message if invalid
 */
function validateFile(file: File): string | null {
  // Check file type
  if (
    !IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(
      file.type as (typeof IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return `Invalid file type. Allowed: ${IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES.join(', ')}`;
  }

  // Check file size
  if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE_BYTES) {
    const maxSizeMB = IMAGE_CONSTRAINTS.MAX_FILE_SIZE_BYTES / (1024 * 1024);
    return `File too large. Maximum size: ${maxSizeMB}MB`;
  }

  return null;
}

/**
 * ImageUploader Component
 *
 * Provides drag-and-drop and click-to-browse image upload functionality.
 * Shows preview before upload and validates file type/size.
 *
 * Follows Material Design 3:
 * - Box with dashed border for drop zone
 * - Typography for instructions
 * - Button (outlined) for browse action
 * - CircularProgress for upload state
 * - Alert for error messages
 */
export function ImageUploader({
  onFileSelect,
  uploading = false,
  currentImageCount,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLimitReached = currentImageCount >= IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE;
  const isDisabled = disabled || uploading || isLimitReached;

  /**
   * Handle file selection (from drop or file picker)
   */
  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Check image count limit
      if (isLimitReached) {
        setError(`Maximum ${IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE} images per recipe`);
        return;
      }

      // Check it's actually an image
      if (!isImageFile(file)) {
        setError('Please select an image file');
        return;
      }

      // Create preview
      const url = createImagePreviewUrl(file);
      setPreviewUrl(url);

      try {
        await onFileSelect(file);
        // Clear preview on success
        revokeImagePreviewUrl(url);
        setPreviewUrl(null);
      } catch (err) {
        // Keep preview on error for retry
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
      }
    },
    [onFileSelect, isLimitReached],
  );

  /**
   * Handle drag enter
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled) {
        setIsDragging(true);
      }
    },
    [isDisabled],
  );

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /**
   * Handle drag over (required to enable drop)
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (isDisabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        void handleFile(files[0]);
      }
    },
    [isDisabled, handleFile],
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        void handleFile(files[0]);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFile],
  );

  /**
   * Open file picker
   */
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Clear error and preview
   */
  const handleClearPreview = useCallback(() => {
    if (previewUrl) {
      revokeImagePreviewUrl(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
  }, [previewUrl]);

  return (
    <Stack spacing={2}>
      {/* Error message */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Limit reached message */}
      {isLimitReached && !error && (
        <Alert severity="info">
          Maximum {IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE} images per recipe reached
        </Alert>
      )}

      {/* Drop zone */}
      <Box
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 1,
          p: 4,
          textAlign: 'center',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
        onClick={isDisabled ? undefined : handleBrowseClick}
      >
        {uploading ? (
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Uploading image...
            </Typography>
          </Stack>
        ) : previewUrl ? (
          <Stack spacing={2} alignItems="center">
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: 200,
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
            <Button variant="outlined" color="primary" onClick={handleClearPreview}>
              Clear
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2} alignItems="center">
            <CloudUploadOutlined sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body1">Drop image here or click to browse</Typography>
            <Typography variant="body2" color="text.secondary">
              JPEG, PNG, or WebP (max {IMAGE_CONSTRAINTS.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB)
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={isDisabled}
      />

      {/* Image count */}
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
        {currentImageCount} / {IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE} images
      </Typography>
    </Stack>
  );
}
