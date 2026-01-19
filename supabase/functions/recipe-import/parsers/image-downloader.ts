import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Image Downloader for Recipe Import
 *
 * Downloads recipe images from external URLs and uploads them to Supabase Storage
 * in a temporary location for preview before recipe creation.
 */

export interface DownloadImageResult {
  storage_path: string;
  mime_type: string;
  file_size: number;
}

/**
 * Allowed image MIME types (must match RecipeImageService constraints)
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Maximum image size in bytes (5MB)
 */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Download timeout in milliseconds (10 seconds)
 */
const DOWNLOAD_TIMEOUT_MS = 10000;

/**
 * Download image from URL and upload to temporary storage
 *
 * @param imageUrl - External image URL to download
 * @param userId - User ID (auth.users.id) for storage path
 * @param supabase - Supabase client (with service role for upload)
 * @returns Download result with storage path, or null on failure
 */
export async function downloadAndUploadImage(
  imageUrl: string,
  userId: string,
  supabase: SupabaseClient,
): Promise<DownloadImageResult | null> {
  try {
    // Validate URL protocol
    const url = new URL(imageUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      console.error('Invalid image URL protocol:', url.protocol);
      return null;
    }

    // Fetch image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'CommonTableBot/1.0',
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Image download timed out:', imageUrl);
      } else {
        console.error('Image download failed:', error);
      }
      return null;
    }

    clearTimeout(timeoutId);

    // Check HTTP status
    if (!response.ok) {
      console.error(`Image download failed with status ${response.status}:`, imageUrl);
      return null;
    }

    // Get blob and validate
    const blob = await response.blob();

    // Validate MIME type
    const contentType = response.headers.get('content-type') || blob.type;
    const mimeType = contentType.split(';')[0]?.trim(); // Remove charset if present

    if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
      console.error('Invalid image MIME type:', mimeType, 'for URL:', imageUrl);
      return null;
    }

    // Validate file size
    const fileSize = blob.size;
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      console.error(`Image too large (${fileSize} bytes, max ${MAX_FILE_SIZE_BYTES}):`, imageUrl);
      return null;
    }

    // Generate storage path: imports/{user_id}/{timestamp}_{uuid}/{image_id}.{ext}
    const timestamp = Date.now();
    // eslint-disable-next-line no-undef
    const sessionId = crypto.randomUUID().split('-')[0]; // Use first segment of UUID
    // eslint-disable-next-line no-undef
    const imageId = crypto.randomUUID();
    const extension = getExtensionFromMimeType(mimeType);
    const storagePath = `imports/${userId}/${timestamp}_${sessionId}/${imageId}.${extension}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(storagePath, blob, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Image upload to storage failed:', uploadError);
      return null;
    }

    console.log(`Successfully uploaded image to: ${storagePath}`);

    return {
      storage_path: storagePath,
      mime_type: mimeType,
      file_size: fileSize,
    };
  } catch (error) {
    console.error('Unexpected error in downloadAndUploadImage:', error);
    return null;
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}
