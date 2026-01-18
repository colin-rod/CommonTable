/* eslint-disable no-undef */
import imageCompression from 'browser-image-compression';

/**
 * Options for image compression
 */
export interface CompressionOptions {
  /** Maximum file size in MB (default: 1) */
  maxSizeMB: number;
  /** Maximum width or height in pixels (default: 1920) */
  maxWidthOrHeight: number;
  /** Use web worker for compression (default: true) */
  useWebWorker: boolean;
  /** Preserve EXIF data (default: false) */
  preserveExif: boolean;
}

/**
 * Default compression options optimized for recipe images
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1, // Compress to 1MB max
  maxWidthOrHeight: 1920, // Good for most displays
  useWebWorker: true, // Better UX - doesn't block main thread
  preserveExif: false, // Remove metadata for privacy
};

/**
 * Compress an image file before upload
 *
 * Uses browser-image-compression library to reduce file size
 * while maintaining reasonable quality for recipe photos.
 *
 * @param file - The image file to compress
 * @param options - Optional compression settings
 * @returns Compressed image file
 *
 * @example
 * ```ts
 * const compressedFile = await compressImage(originalFile);
 * // Now upload compressedFile instead of originalFile
 * ```
 */
export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {},
): Promise<File> {
  const mergedOptions: CompressionOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  try {
    const compressedBlob = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
      useWebWorker: mergedOptions.useWebWorker,
      preserveExif: mergedOptions.preserveExif,
    });

    // Convert Blob back to File with original name
    return new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    // If compression fails, return original file
    console.warn('Image compression failed, using original file:', error);
    return file;
  }
}

/**
 * Image dimensions
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get the dimensions (width and height) of an image file
 *
 * Loads the image in memory to extract dimensions.
 * Useful for storing image metadata.
 *
 * @param file - The image file to measure
 * @returns Promise resolving to width and height
 *
 * @example
 * ```ts
 * const { width, height } = await getImageDimensions(file);
 * console.log(`Image is ${width}x${height}`);
 * ```
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Check if a file is an image based on its MIME type
 *
 * @param file - The file to check
 * @returns true if the file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Create a preview URL for an image file
 *
 * Remember to revoke the URL when done to free memory:
 * `URL.revokeObjectURL(previewUrl)`
 *
 * @param file - The image file
 * @returns Object URL for the image (use as img src)
 */
export function createImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 *
 * @param url - The URL created by createImagePreviewUrl
 */
export function revokeImagePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
