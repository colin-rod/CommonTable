import { describe, it, expect } from 'vitest';

import {
  IMAGE_CONSTRAINTS,
  UploadRecipeImageOptionsSchema,
  UploadRecipeImageInputSchema,
  UpdateRecipeImageSchema,
  ReorderRecipeImagesSchema,
  RecipeImageIdSchema,
  FileMetadataSchema,
  validateFileForUpload,
} from './recipe-image';

// Mock File constructor for Node.js environment
class MockFile {
  name: string;
  type: string;
  size: number;

  constructor(parts: unknown[], name: string, options?: { type?: string }) {
    this.name = name;
    this.type = options?.type || '';
    this.size = 0; // Will be overridden by Object.defineProperty in tests
  }
}

describe('IMAGE_CONSTRAINTS', () => {
  it('should export expected constraints', () => {
    expect(IMAGE_CONSTRAINTS.MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    expect(IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE).toBe(10);
    expect(IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
    expect(IMAGE_CONSTRAINTS.URL_EXPIRY_SECONDS).toBe(3600);
  });
});

describe('UploadRecipeImageOptionsSchema', () => {
  describe('valid inputs', () => {
    it('should accept all fields', () => {
      const input = {
        altText: 'Delicious pasta dish',
        isPrimary: true,
        isPublic: true,
      };
      const result = UploadRecipeImageOptionsSchema.parse(input);
      expect(result.altText).toBe('Delicious pasta dish');
      expect(result.isPrimary).toBe(true);
      expect(result.isPublic).toBe(true);
    });

    it('should default isPrimary to false', () => {
      const input = {};
      const result = UploadRecipeImageOptionsSchema.parse(input);
      expect(result.isPrimary).toBe(false);
    });

    it('should default isPublic to false', () => {
      const input = {};
      const result = UploadRecipeImageOptionsSchema.parse(input);
      expect(result.isPublic).toBe(false);
    });

    it('should trim whitespace from altText', () => {
      const input = {
        altText: '  Delicious pasta dish  ',
      };
      const result = UploadRecipeImageOptionsSchema.parse(input);
      expect(result.altText).toBe('Delicious pasta dish');
    });

    it('should accept altText at maximum length (500 chars)', () => {
      const input = {
        altText: 'a'.repeat(500),
      };
      const result = UploadRecipeImageOptionsSchema.parse(input);
      expect(result.altText).toBe('a'.repeat(500));
    });

    it('should accept empty object', () => {
      const input = {};
      const result = UploadRecipeImageOptionsSchema.parse(input);
      expect(result.isPrimary).toBe(false);
      expect(result.isPublic).toBe(false);
    });
  });

  describe('validation errors', () => {
    it('should reject altText over 500 characters', () => {
      const input = {
        altText: 'a'.repeat(501),
      };
      expect(() => UploadRecipeImageOptionsSchema.parse(input)).toThrow(
        'Alt text must be 500 characters or less',
      );
    });

    it('should reject non-boolean isPrimary', () => {
      const input = {
        isPrimary: 'true' as any,
      };
      expect(() => UploadRecipeImageOptionsSchema.parse(input)).toThrow();
    });

    it('should reject non-boolean isPublic', () => {
      const input = {
        isPublic: 'true' as any,
      };
      expect(() => UploadRecipeImageOptionsSchema.parse(input)).toThrow();
    });
  });
});

describe('UploadRecipeImageInputSchema', () => {
  describe('valid inputs', () => {
    it('should accept recipeId only', () => {
      const input = {
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = UploadRecipeImageInputSchema.parse(input);
      expect(result.recipeId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.options).toBeUndefined();
    });

    it('should accept recipeId with options', () => {
      const input = {
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
        options: {
          altText: 'Pasta dish',
          isPrimary: true,
          isPublic: false,
        },
      };
      const result = UploadRecipeImageInputSchema.parse(input);
      expect(result.recipeId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.options?.altText).toBe('Pasta dish');
      expect(result.options?.isPrimary).toBe(true);
    });
  });

  describe('validation errors', () => {
    it('should reject invalid recipeId UUID', () => {
      const input = {
        recipeId: 'not-a-uuid',
      };
      expect(() => UploadRecipeImageInputSchema.parse(input)).toThrow('Invalid recipe ID');
    });

    it('should reject missing recipeId', () => {
      const input = {};
      expect(() => UploadRecipeImageInputSchema.parse(input)).toThrow();
    });

    it('should reject invalid options', () => {
      const input = {
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
        options: {
          altText: 'a'.repeat(501),
        },
      };
      expect(() => UploadRecipeImageInputSchema.parse(input)).toThrow(
        'Alt text must be 500 characters or less',
      );
    });
  });
});

describe('UpdateRecipeImageSchema', () => {
  describe('valid inputs', () => {
    it('should accept altText update', () => {
      const input = {
        altText: 'Updated alt text',
      };
      const result = UpdateRecipeImageSchema.parse(input);
      expect(result.altText).toBe('Updated alt text');
    });

    it('should accept isPrimary update', () => {
      const input = {
        isPrimary: true,
      };
      const result = UpdateRecipeImageSchema.parse(input);
      expect(result.isPrimary).toBe(true);
    });

    it('should accept isPublic update', () => {
      const input = {
        isPublic: true,
      };
      const result = UpdateRecipeImageSchema.parse(input);
      expect(result.isPublic).toBe(true);
    });

    it('should accept multiple fields', () => {
      const input = {
        altText: 'Updated alt text',
        isPrimary: true,
        isPublic: false,
      };
      const result = UpdateRecipeImageSchema.parse(input);
      expect(result.altText).toBe('Updated alt text');
      expect(result.isPrimary).toBe(true);
      expect(result.isPublic).toBe(false);
    });

    it('should accept null altText', () => {
      const input = {
        altText: null,
      };
      const result = UpdateRecipeImageSchema.parse(input);
      expect(result.altText).toBeNull();
    });

    it('should trim whitespace from altText', () => {
      const input = {
        altText: '  Updated alt text  ',
      };
      const result = UpdateRecipeImageSchema.parse(input);
      expect(result.altText).toBe('Updated alt text');
    });
  });

  describe('validation errors', () => {
    it('should reject empty object', () => {
      const input = {};
      expect(() => UpdateRecipeImageSchema.parse(input)).toThrow(
        'At least one field must be provided for update',
      );
    });

    it('should reject altText over 500 characters', () => {
      const input = {
        altText: 'a'.repeat(501),
      };
      expect(() => UpdateRecipeImageSchema.parse(input)).toThrow(
        'Alt text must be 500 characters or less',
      );
    });

    it('should reject non-boolean isPrimary', () => {
      const input = {
        isPrimary: 'true' as any,
      };
      expect(() => UpdateRecipeImageSchema.parse(input)).toThrow();
    });

    it('should reject non-boolean isPublic', () => {
      const input = {
        isPublic: 'true' as any,
      };
      expect(() => UpdateRecipeImageSchema.parse(input)).toThrow();
    });
  });
});

describe('ReorderRecipeImagesSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid reorder input', () => {
      const input = {
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
        imageIds: [
          '660e8400-e29b-41d4-a716-446655440001',
          '770e8400-e29b-41d4-a716-446655440002',
          '880e8400-e29b-41d4-a716-446655440003',
        ],
      };
      const result = ReorderRecipeImagesSchema.parse(input);
      expect(result.recipeId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.imageIds).toHaveLength(3);
    });

    it('should accept single image ID', () => {
      const input = {
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
        imageIds: ['660e8400-e29b-41d4-a716-446655440001'],
      };
      const result = ReorderRecipeImagesSchema.parse(input);
      expect(result.imageIds).toHaveLength(1);
    });

    it('should accept maximum number of images', () => {
      const input = {
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
        imageIds: Array(10)
          .fill(0)
          .map((_, i) => `${i}60e8400-e29b-41d4-a716-446655440001`.slice(-36)),
      };
      const result = ReorderRecipeImagesSchema.parse(input);
      expect(result.imageIds).toHaveLength(10);
    });
  });

  describe('validation errors', () => {
    it('should reject invalid recipeId UUID', () => {
      const input = {
        recipeId: 'not-a-uuid',
        imageIds: ['660e8400-e29b-41d4-a716-446655440001'],
      };
      expect(() => ReorderRecipeImagesSchema.parse(input)).toThrow('Invalid recipe ID');
    });

    it('should reject empty imageIds array', () => {
      const input = {
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
        imageIds: [],
      };
      expect(() => ReorderRecipeImagesSchema.parse(input)).toThrow(
        'At least one image ID is required',
      );
    });

    it('should reject too many image IDs', () => {
      const input = {
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
        imageIds: Array(11)
          .fill(0)
          .map((_, i) => `${i}60e8400-e29b-41d4-a716-446655440001`.slice(-36)),
      };
      expect(() => ReorderRecipeImagesSchema.parse(input)).toThrow('Too many image IDs');
    });

    it('should reject invalid image ID UUID', () => {
      const input = {
        recipeId: '550e8400-e29b-41d4-a716-446655440000',
        imageIds: ['not-a-uuid'],
      };
      expect(() => ReorderRecipeImagesSchema.parse(input)).toThrow('Invalid image ID');
    });
  });
});

describe('RecipeImageIdSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = RecipeImageIdSchema.parse(uuid);
      expect(result).toBe(uuid);
    });

    it('should accept UUID in different cases', () => {
      const uppercaseUuid = '550E8400-E29B-41D4-A716-446655440000';
      const result = RecipeImageIdSchema.parse(uppercaseUuid);
      expect(result).toBe(uppercaseUuid);
    });
  });

  describe('validation errors', () => {
    it('should reject invalid UUID format', () => {
      expect(() => RecipeImageIdSchema.parse('not-a-uuid')).toThrow('Invalid recipe image ID');
    });

    it('should reject UUID without hyphens', () => {
      expect(() => RecipeImageIdSchema.parse('550e8400e29b41d4a716446655440000')).toThrow(
        'Invalid recipe image ID',
      );
    });

    it('should reject empty string', () => {
      expect(() => RecipeImageIdSchema.parse('')).toThrow('Invalid recipe image ID');
    });
  });
});

describe('FileMetadataSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid JPEG file metadata', () => {
      const input = {
        name: 'image.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg' as const,
      };
      const result = FileMetadataSchema.parse(input);
      expect(result.name).toBe('image.jpg');
      expect(result.size).toBe(1024 * 1024);
      expect(result.type).toBe('image/jpeg');
    });

    it('should accept valid PNG file metadata', () => {
      const input = {
        name: 'image.png',
        size: 2 * 1024 * 1024, // 2MB
        type: 'image/png' as const,
      };
      const result = FileMetadataSchema.parse(input);
      expect(result.type).toBe('image/png');
    });

    it('should accept valid WebP file metadata', () => {
      const input = {
        name: 'image.webp',
        size: 500 * 1024, // 500KB
        type: 'image/webp' as const,
      };
      const result = FileMetadataSchema.parse(input);
      expect(result.type).toBe('image/webp');
    });

    it('should accept file at maximum size (5MB)', () => {
      const input = {
        name: 'large-image.jpg',
        size: 5 * 1024 * 1024, // 5MB
        type: 'image/jpeg' as const,
      };
      const result = FileMetadataSchema.parse(input);
      expect(result.size).toBe(5 * 1024 * 1024);
    });
  });

  describe('validation errors', () => {
    it('should reject empty file name', () => {
      const input = {
        name: '',
        size: 1024,
        type: 'image/jpeg' as const,
      };
      expect(() => FileMetadataSchema.parse(input)).toThrow('File name is required');
    });

    it('should reject file larger than 5MB', () => {
      const input = {
        name: 'image.jpg',
        size: 6 * 1024 * 1024, // 6MB
        type: 'image/jpeg' as const,
      };
      expect(() => FileMetadataSchema.parse(input)).toThrow('File too large');
    });

    it('should reject zero file size', () => {
      const input = {
        name: 'image.jpg',
        size: 0,
        type: 'image/jpeg' as const,
      };
      expect(() => FileMetadataSchema.parse(input)).toThrow('File size must be positive');
    });

    it('should reject negative file size', () => {
      const input = {
        name: 'image.jpg',
        size: -1024,
        type: 'image/jpeg' as const,
      };
      expect(() => FileMetadataSchema.parse(input)).toThrow('File size must be positive');
    });

    it('should reject unsupported file type (GIF)', () => {
      const input = {
        name: 'image.gif',
        size: 1024,
        type: 'image/gif' as any,
      };
      expect(() => FileMetadataSchema.parse(input)).toThrow(
        'Invalid file type. Allowed: image/jpeg, image/png, image/webp',
      );
    });

    it('should reject unsupported file type (SVG)', () => {
      const input = {
        name: 'image.svg',
        size: 1024,
        type: 'image/svg+xml' as any,
      };
      expect(() => FileMetadataSchema.parse(input)).toThrow(
        'Invalid file type. Allowed: image/jpeg, image/png, image/webp',
      );
    });
  });
});

describe('validateFileForUpload', () => {
  it('should validate and return file metadata for valid JPEG file', () => {
    const mockFile = new MockFile(['content'], 'image.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 });

    const result = validateFileForUpload(mockFile as any);
    expect(result.name).toBe('image.jpg');
    expect(result.size).toBe(1024 * 1024);
    expect(result.type).toBe('image/jpeg');
  });

  it('should validate and return file metadata for valid PNG file', () => {
    const mockFile = new MockFile(['content'], 'image.png', {
      type: 'image/png',
    });
    Object.defineProperty(mockFile, 'size', { value: 2 * 1024 * 1024 });

    const result = validateFileForUpload(mockFile as any);
    expect(result.type).toBe('image/png');
  });

  it('should throw for file larger than 5MB', () => {
    const mockFile = new MockFile(['content'], 'large-image.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(mockFile, 'size', { value: 6 * 1024 * 1024 });

    expect(() => validateFileForUpload(mockFile as any)).toThrow('File too large');
  });

  it('should throw for unsupported file type', () => {
    const mockFile = new MockFile(['content'], 'image.gif', {
      type: 'image/gif',
    });
    Object.defineProperty(mockFile, 'size', { value: 1024 });

    expect(() => validateFileForUpload(mockFile as any)).toThrow(
      'Invalid file type. Allowed: image/jpeg, image/png, image/webp',
    );
  });
});
