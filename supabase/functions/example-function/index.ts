import { serve } from 'std/http/server.ts';

import { corsPreflightResponse } from '../_shared/cors.ts';
import { errorResponse, successResponse, UnauthorizedError } from '../_shared/errors.ts';
import { validateRequestBody, getAuthToken } from '../_shared/validation.ts';

import { ExampleRequestSchema, type ExampleResponse } from './schema.ts';

/**
 * Example Edge Function
 *
 * Demonstrates best practices for Supabase Edge Functions:
 * - CORS handling
 * - Authentication validation
 * - Request validation with Zod
 * - Typed error handling
 * - Structured responses
 *
 * Usage:
 *   POST /functions/v1/example-function
 *   Headers:
 *     - Authorization: Bearer <token>
 *     - Content-Type: application/json
 *   Body:
 *     {
 *       "message": "Hello, Edge Functions!",
 *       "metadata": {
 *         "userId": "123",
 *         "timestamp": "2024-01-01T00:00:00Z"
 *       }
 *     }
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  try {
    // Validate authentication
    const token = getAuthToken(req);
    if (!token) {
      throw new UnauthorizedError('Missing authorization token');
    }

    // Note: In production, you would verify the token with Supabase Auth
    // const supabaseClient = createClient(...)
    // const { data: { user }, error } = await supabaseClient.auth.getUser(token)
    // if (error || !user) throw new UnauthorizedError()

    // Validate request body
    const validated = await validateRequestBody(req, ExampleRequestSchema);

    // Business logic
    const result: ExampleResponse = {
      message: `Processed: ${validated.message}`,
      processedAt: new Date().toISOString(),
      ...(validated.metadata && { metadata: validated.metadata }),
    };

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
