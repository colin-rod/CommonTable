/**
 * TDD Example: Testing custom error classes
 *
 * This file demonstrates the RED-GREEN-REFACTOR workflow per CLAUDE.md:
 * 1. RED: Write failing tests first
 * 2. GREEN: Implement minimal code to pass
 * 3. REFACTOR: Improve code quality
 *
 * These tests verify that error classes:
 * - Have correct properties (message, code, statusCode)
 * - Include metadata when provided
 * - Have correct error names
 * - Are instances of Error and AppError
 */

import { describe, it, expect } from 'vitest';

import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  SyncError,
  EmailVerificationError,
  StorageError,
  ImageLimitExceededError,
  InvalidFileTypeError,
  FileTooLargeError,
} from './errors';

describe('AppError', () => {
  it('should create an error with message, code, and statusCode', () => {
    const error = new AppError('Something went wrong', 'GENERIC_ERROR', 500);

    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe('GENERIC_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('AppError');
  });

  it('should default statusCode to 500', () => {
    const error = new AppError('Error', 'CODE');

    expect(error.statusCode).toBe(500);
  });

  it('should include metadata when provided', () => {
    const metadata = { userId: '123', action: 'delete' };
    const error = new AppError('Error', 'CODE', 500, metadata);

    expect(error.metadata).toEqual(metadata);
  });

  it('should be an instance of Error', () => {
    const error = new AppError('Error', 'CODE');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('ValidationError', () => {
  it('should create a validation error with 400 status code', () => {
    const error = new ValidationError('Invalid input');

    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('ValidationError');
  });

  it('should include metadata when provided', () => {
    const metadata = { field: 'email', value: 'invalid' };
    const error = new ValidationError('Invalid email', metadata);

    expect(error.metadata).toEqual(metadata);
  });

  it('should be an instance of AppError', () => {
    const error = new ValidationError('Invalid input');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('NotFoundError', () => {
  it('should create a not found error with resource and id', () => {
    const error = new NotFoundError('Recipe', '123');

    expect(error.message).toBe('Recipe not found: 123');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('NotFoundError');
  });

  it('should include resource and id in metadata', () => {
    const error = new NotFoundError('User', '456');

    expect(error.metadata).toEqual({
      resource: 'User',
      id: '456',
    });
  });

  it('should be an instance of AppError', () => {
    const error = new NotFoundError('Recipe', '123');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('UnauthorizedError', () => {
  it('should create an unauthorized error with default message', () => {
    const error = new UnauthorizedError();

    expect(error.message).toBe('Unauthorized');
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('UnauthorizedError');
  });

  it('should accept a custom message', () => {
    const error = new UnauthorizedError('Invalid token');

    expect(error.message).toBe('Invalid token');
  });

  it('should be an instance of AppError', () => {
    const error = new UnauthorizedError();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ConflictError', () => {
  it('should create a conflict error with 409 status code', () => {
    const error = new ConflictError('Resource already exists');

    expect(error.message).toBe('Resource already exists');
    expect(error.code).toBe('CONFLICT');
    expect(error.statusCode).toBe(409);
    expect(error.name).toBe('ConflictError');
  });

  it('should include metadata when provided', () => {
    const metadata = { existingId: '123' };
    const error = new ConflictError('Duplicate recipe', metadata);

    expect(error.metadata).toEqual(metadata);
  });

  it('should be an instance of AppError', () => {
    const error = new ConflictError('Conflict');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('SyncError', () => {
  it('should create a sync error with 500 status code', () => {
    const error = new SyncError('Sync failed');

    expect(error.message).toBe('Sync failed');
    expect(error.code).toBe('SYNC_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('SyncError');
  });

  it('should include metadata when provided', () => {
    const metadata = { operation: 'push', timestamp: Date.now() };
    const error = new SyncError('Push failed', metadata);

    expect(error.metadata).toEqual(metadata);
  });

  it('should be an instance of AppError', () => {
    const error = new SyncError('Sync failed');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('EmailVerificationError', () => {
  it('should create an email verification error with 400 status code', () => {
    const error = new EmailVerificationError('Invalid verification token');

    expect(error.message).toBe('Invalid verification token');
    expect(error.code).toBe('EMAIL_VERIFICATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('EmailVerificationError');
  });

  it('should include metadata when provided', () => {
    const metadata = { token: 'abc123', userId: '456' };
    const error = new EmailVerificationError('Token expired', metadata);

    expect(error.metadata).toEqual(metadata);
  });

  it('should be an instance of AppError', () => {
    const error = new EmailVerificationError('Verification failed');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('StorageError', () => {
  it('should create a storage error with 500 status code', () => {
    const error = new StorageError('Failed to upload file');

    expect(error.message).toBe('Failed to upload file');
    expect(error.code).toBe('STORAGE_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('StorageError');
  });

  it('should include metadata when provided', () => {
    const metadata = { path: '/uploads/image.jpg', bucket: 'recipes' };
    const error = new StorageError('Upload failed', metadata);

    expect(error.metadata).toEqual(metadata);
  });

  it('should be an instance of AppError', () => {
    const error = new StorageError('Storage operation failed');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ImageLimitExceededError', () => {
  it('should create an image limit exceeded error', () => {
    const error = new ImageLimitExceededError('recipe-123', 10, 10);

    expect(error.message).toBe('Maximum 10 images per recipe');
    expect(error.code).toBe('IMAGE_LIMIT_EXCEEDED');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('ImageLimitExceededError');
  });

  it('should include recipeId, currentCount, and maxCount in metadata', () => {
    const error = new ImageLimitExceededError('recipe-456', 8, 10);

    expect(error.metadata).toEqual({
      recipeId: 'recipe-456',
      currentCount: 8,
      maxCount: 10,
    });
  });

  it('should be an instance of AppError', () => {
    const error = new ImageLimitExceededError('recipe-789', 10, 10);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('InvalidFileTypeError', () => {
  it('should create an invalid file type error', () => {
    const allowedTypes = ['image/jpeg', 'image/png'] as const;
    const error = new InvalidFileTypeError('image/gif', allowedTypes);

    expect(error.message).toBe(
      'Invalid file type: image/gif. Allowed types: image/jpeg, image/png',
    );
    expect(error.code).toBe('INVALID_FILE_TYPE');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('InvalidFileTypeError');
  });

  it('should include providedType and allowedTypes in metadata', () => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
    const error = new InvalidFileTypeError('application/pdf', allowedTypes);

    expect(error.metadata).toEqual({
      providedType: 'application/pdf',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
  });

  it('should be an instance of AppError', () => {
    const allowedTypes = ['image/jpeg'] as const;
    const error = new InvalidFileTypeError('image/svg', allowedTypes);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('FileTooLargeError', () => {
  it('should create a file too large error', () => {
    const fileSize = 6 * 1024 * 1024; // 6MB
    const maxSize = 5 * 1024 * 1024; // 5MB
    const error = new FileTooLargeError(fileSize, maxSize);

    expect(error.message).toBe('File size 6.00MB exceeds maximum 5MB');
    expect(error.code).toBe('FILE_TOO_LARGE');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('FileTooLargeError');
  });

  it('should include fileSize and maxSize in metadata', () => {
    const fileSize = 7 * 1024 * 1024;
    const maxSize = 5 * 1024 * 1024;
    const error = new FileTooLargeError(fileSize, maxSize);

    expect(error.metadata).toEqual({
      fileSize: 7 * 1024 * 1024,
      maxSize: 5 * 1024 * 1024,
    });
  });

  it('should format file sizes correctly', () => {
    const fileSize = 1.5 * 1024 * 1024; // 1.5MB
    const maxSize = 1 * 1024 * 1024; // 1MB
    const error = new FileTooLargeError(fileSize, maxSize);

    expect(error.message).toBe('File size 1.50MB exceeds maximum 1MB');
  });

  it('should be an instance of AppError', () => {
    const error = new FileTooLargeError(6000000, 5000000);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });
});
