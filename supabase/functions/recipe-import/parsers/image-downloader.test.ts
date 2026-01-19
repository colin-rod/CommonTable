import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { describe, it } from 'https://deno.land/std@0.224.0/testing/bdd.ts';

import { downloadAndUploadImage } from './image-downloader.ts';

/**
 * Image Downloader Tests
 *
 * Tests the image download and upload functionality for recipe imports.
 * Images are downloaded from external URLs and uploaded to temp storage.
 */

describe('downloadAndUploadImage', () => {
  // Mock Supabase client for testing
  const createMockSupabase = (uploadResponse: { error: null | Error; data?: unknown }) => {
    return {
      storage: {
        from: () => ({
          upload: async () => uploadResponse,
        }),
      },
    };
  };

  it('should download and upload a valid JPEG image', async () => {
    // Mock fetch to return a valid JPEG
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      const blob = new Blob(['fake-jpeg-data'], { type: 'image/jpeg' });
      return new Response(blob, {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      });
    };

    const mockSupabase = createMockSupabase({ error: null, data: { path: 'test-path' } });

    try {
      const result = await downloadAndUploadImage(
        'https://example.com/recipe.jpg',
        'user-123',
        mockSupabase as any,
      );

      assertExists(result, 'Result should exist');
      assertEquals(result!.mime_type, 'image/jpeg');
      assertExists(result!.storage_path, 'Storage path should exist');
      assertEquals(result!.storage_path.startsWith('imports/user-123/'), true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should download and upload a valid PNG image', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      const blob = new Blob(['fake-png-data'], { type: 'image/png' });
      return new Response(blob, {
        status: 200,
        headers: { 'content-type': 'image/png' },
      });
    };

    const mockSupabase = createMockSupabase({ error: null, data: { path: 'test-path' } });

    try {
      const result = await downloadAndUploadImage(
        'https://example.com/recipe.png',
        'user-456',
        mockSupabase as any,
      );

      assertExists(result);
      assertEquals(result!.mime_type, 'image/png');
      assertEquals(result!.storage_path.startsWith('imports/user-456/'), true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should download and upload a valid WebP image', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      const blob = new Blob(['fake-webp-data'], { type: 'image/webp' });
      return new Response(blob, {
        status: 200,
        headers: { 'content-type': 'image/webp' },
      });
    };

    const mockSupabase = createMockSupabase({ error: null, data: { path: 'test-path' } });

    try {
      const result = await downloadAndUploadImage(
        'https://example.com/recipe.webp',
        'user-789',
        mockSupabase as any,
      );

      assertExists(result);
      assertEquals(result!.mime_type, 'image/webp');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should return null for invalid MIME type', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      const blob = new Blob(['fake-svg-data'], { type: 'image/svg+xml' });
      return new Response(blob, {
        status: 200,
        headers: { 'content-type': 'image/svg+xml' },
      });
    };

    const mockSupabase = createMockSupabase({ error: null });

    try {
      const result = await downloadAndUploadImage(
        'https://example.com/recipe.svg',
        'user-123',
        mockSupabase as any,
      );

      assertEquals(result, null, 'Should return null for invalid MIME type');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should return null for image exceeding 5MB size limit', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      // Create a blob larger than 5MB
      const largeData = new Uint8Array(6 * 1024 * 1024); // 6MB
      const blob = new Blob([largeData], { type: 'image/jpeg' });
      return new Response(blob, {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      });
    };

    const mockSupabase = createMockSupabase({ error: null });

    try {
      const result = await downloadAndUploadImage(
        'https://example.com/huge-recipe.jpg',
        'user-123',
        mockSupabase as any,
      );

      assertEquals(result, null, 'Should return null for oversized image');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should return null on network error', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('Network error');
    };

    const mockSupabase = createMockSupabase({ error: null });

    try {
      const result = await downloadAndUploadImage(
        'https://example.com/recipe.jpg',
        'user-123',
        mockSupabase as any,
      );

      assertEquals(result, null, 'Should return null on network error');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should return null on HTTP error (404)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return new Response(null, { status: 404 });
    };

    const mockSupabase = createMockSupabase({ error: null });

    try {
      const result = await downloadAndUploadImage(
        'https://example.com/missing.jpg',
        'user-123',
        mockSupabase as any,
      );

      assertEquals(result, null, 'Should return null on 404');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should return null on timeout', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      // Simulate long-running request
      await new Promise((resolve) => setTimeout(resolve, 15000));
      return new Response(new Blob(['data'], { type: 'image/jpeg' }));
    };

    const mockSupabase = createMockSupabase({ error: null });

    try {
      const result = await downloadAndUploadImage(
        'https://example.com/slow.jpg',
        'user-123',
        mockSupabase as any,
      );

      assertEquals(result, null, 'Should return null on timeout');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should return null on storage upload error', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      const blob = new Blob(['fake-jpeg-data'], { type: 'image/jpeg' });
      return new Response(blob, {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      });
    };

    const mockSupabase = createMockSupabase({ error: new Error('Upload failed') });

    try {
      const result = await downloadAndUploadImage(
        'https://example.com/recipe.jpg',
        'user-123',
        mockSupabase as any,
      );

      assertEquals(result, null, 'Should return null on upload error');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should generate storage path with correct format', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      const blob = new Blob(['fake-jpeg-data'], { type: 'image/jpeg' });
      return new Response(blob, {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      });
    };

    const mockSupabase = createMockSupabase({ error: null });

    try {
      const result = await downloadAndUploadImage(
        'https://example.com/recipe.jpg',
        'user-abc-123',
        mockSupabase as any,
      );

      assertExists(result);

      // Path format: imports/{user_id}/{timestamp}_{uuid}/{image_id}.{ext}
      const pathParts = result!.storage_path.split('/');
      assertEquals(pathParts[0], 'imports');
      assertEquals(pathParts[1], 'user-abc-123');
      assertEquals(pathParts.length, 4); // imports/user_id/session/image.ext
      assertEquals(result!.storage_path.endsWith('.jpg'), true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
