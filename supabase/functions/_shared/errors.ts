import { corsHeaders } from './cors.ts';

/**
 * Base error class for Edge Functions
 */
export class EdgeFunctionError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'EdgeFunctionError';
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends EdgeFunctionError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', metadata);
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends EdgeFunctionError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends EdgeFunctionError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, id });
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends EdgeFunctionError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', metadata);
  }
}

/**
 * Helper to create an error response with proper CORS headers
 */
export function errorResponse(error: unknown): Response {
  console.error('Edge Function error:', error);

  if (error instanceof EdgeFunctionError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        ...(error.metadata && { metadata: error.metadata }),
      }),
      {
        status: error.statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  // Unknown error - don't leak details
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}

/**
 * Helper to create a success response with proper CORS headers
 */
export function successResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
