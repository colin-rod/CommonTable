/**
 * Utility types and functions for Next.js Server Actions
 */

/**
 * Standard result type for server actions
 */
export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Format error for server action response
 * Extracts user-friendly error message from Error objects
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}
