// Custom error classes

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    // captureStackTrace is Node.js specific
    if ('captureStackTrace' in Error) {
      (
        Error as {
          captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        }
      ).captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, metadata);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404, { resource, id });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, metadata);
  }
}

export class SyncError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'SYNC_ERROR', 500, metadata);
  }
}

export class EmailVerificationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'EMAIL_VERIFICATION_ERROR', 400, metadata);
  }
}
