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
