import { z } from 'zod';

import { ValidationError } from './errors.ts';

/**
 * Validate request body against a Zod schema
 *
 * @throws ValidationError if validation fails
 */
export async function validateRequestBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<z.infer<T>> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request body', { errors: error.errors });
    }
    throw new ValidationError('Failed to parse request body');
  }
}

/**
 * Validate URL query parameters against a Zod schema
 *
 * @throws ValidationError if validation fails
 */
export function validateQueryParams<T extends z.ZodTypeAny>(url: URL, schema: T): z.infer<T> {
  try {
    const params = Object.fromEntries(url.searchParams.entries());
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', { errors: error.errors });
    }
    throw new ValidationError('Failed to parse query parameters');
  }
}

/**
 * Extract and validate Authorization header
 *
 * @throws UnauthorizedError if authorization header is missing or invalid
 */
export function getAuthToken(req: Request): string {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    throw new ValidationError('Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new ValidationError('Invalid Authorization header format');
  }

  return token;
}
