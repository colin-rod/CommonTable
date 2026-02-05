# Supabase Edge Functions

This directory contains Supabase Edge Functions for CommonTable. Edge Functions are serverless TypeScript/JavaScript functions that run on Deno, deployed at the edge for low latency.

## Directory Structure

```
supabase/functions/
├── _shared/              # Shared utilities (reusable across all functions)
│   ├── cors.ts          # CORS headers and helpers
│   ├── errors.ts        # Error classes and response helpers
│   └── validation.ts    # Request validation utilities
├── example-function/    # Example/template function
│   ├── index.ts         # Main function handler
│   └── schema.ts        # Zod validation schemas
├── deno.json            # Deno configuration and import maps
├── .gitignore
└── README.md            # This file
```

## Development Workflow

### Prerequisites

- Supabase CLI installed (already configured)
- Remote Supabase project (development environment)

**IMPORTANT:** This project does NOT use Docker for local development. All Edge Functions are developed locally and deployed to the remote Supabase development environment for testing.

### Development Process

1. **Write Edge Function code** in `supabase/functions/<function-name>/`
2. **Deploy to development environment** using `pnpm functions:deploy`
3. **Test via deployed endpoint** using curl/Postman
4. **Iterate** - make changes and redeploy

### Testing Edge Functions

Since we don't run Supabase locally, test the deployed function with curl:

```bash
# Get your project URL and anon key from Supabase Dashboard
# https://app.supabase.com/project/<project-ref>/settings/api

curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/example-function \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, Edge Functions!",
    "metadata": {
      "userId": "123"
    }
  }'
```

Expected response:

```json
{
  "data": {
    "message": "Processed: Hello, Edge Functions!",
    "processedAt": "2024-01-15T12:00:00.000Z",
    "metadata": {
      "userId": "123"
    }
  }
}
```

### Viewing Logs

Monitor Edge Function execution in real-time:

```bash
# Follow logs for a specific function
supabase functions logs example-function --follow

# View recent logs
supabase functions logs example-function
```

## Creating New Edge Functions

### 1. Generate Function Scaffold

```bash
pnpm functions:new <function-name>
```

This creates a new directory: `supabase/functions/<function-name>/`

### 2. Copy Template from Example Function

The `example-function` demonstrates best practices:

- CORS handling (preflight + actual requests)
- Authentication validation
- Request validation with Zod schemas
- Typed error handling
- Structured responses

**Template structure:**

```typescript
// schema.ts - Define request/response types
import { z } from 'zod';

export const MyRequestSchema = z.object({
  // Define your schema here
});

export type MyRequest = z.infer<typeof MyRequestSchema>;
```

```typescript
// index.ts - Main handler
import { serve } from 'std/http/server.ts';
import { corsPreflightResponse } from '../_shared/cors.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';
import { validateRequestBody, getAuthToken } from '../_shared/validation.ts';
import { MyRequestSchema } from './schema.ts';

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  try {
    // 2. Validate authentication
    const token = getAuthToken(req);

    // 3. Validate request body
    const validated = await validateRequestBody(req, MyRequestSchema);

    // 4. Business logic
    const result = {
      // Your logic here
    };

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
```

### 3. Implement Business Logic

- Add your business logic in the try block
- Use shared utilities from `_shared/`
- Follow CLAUDE.md error handling conventions
- Use Zod for all input validation

### 4. Deploy and Test

```bash
# Deploy to development environment
pnpm functions:deploy <function-name>

# Test deployed function
curl -X POST https://<project-ref>.supabase.co/functions/v1/<function-name> \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{ "your": "data" }'

# Monitor logs
supabase functions logs <function-name> --follow
```

## Deployment

### Deploy to Development Environment

```bash
# Deploy single function
pnpm functions:deploy <function-name>

# Deploy all functions
pnpm functions:deploy
```

### Deploy to Production

```bash
# Link to production project (one-time setup)
supabase link --project-ref <production-project-ref>

# Deploy to production
pnpm functions:deploy <function-name> --project-ref <production-project-ref>
```

### Verify Deployment

After deployment, test the remote function:

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/<function-name> \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{ "your": "data" }'
```

## Shared Utilities

### `_shared/cors.ts`

```typescript
import { corsHeaders, corsPreflightResponse, withCors } from '../_shared/cors.ts';

// Use in OPTIONS handler
if (req.method === 'OPTIONS') {
  return corsPreflightResponse();
}

// All error/success responses already include CORS headers
```

### `_shared/errors.ts`

```typescript
import {
  EdgeFunctionError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  errorResponse,
  successResponse,
} from '../_shared/errors.ts';

// Throw typed errors
throw new ValidationError('Invalid input', { field: 'email' });
throw new UnauthorizedError('Token expired');
throw new NotFoundError('Recipe', recipeId);

// Return responses
return successResponse({ recipe });
return errorResponse(error);
```

### `_shared/validation.ts`

```typescript
import { validateRequestBody, validateQueryParams, getAuthToken } from '../_shared/validation.ts';

// Validate request body
const data = await validateRequestBody(req, MySchema);

// Validate query params
const params = validateQueryParams(new URL(req.url), ParamsSchema);

// Extract auth token
const token = getAuthToken(req);
```

## Error Handling

All Edge Functions follow CLAUDE.md error handling conventions:

1. **Use typed error classes** (ValidationError, UnauthorizedError, etc.)
2. **Wrap business logic in try-catch**
3. **Return structured error responses** via `errorResponse()`
4. **Log errors** (automatically done in `errorResponse()`)
5. **Never leak internal details** in error messages

Example:

```typescript
try {
  const validated = await validateRequestBody(req, schema);
  // Business logic
  return successResponse(result);
} catch (error) {
  // Automatically handles typed errors and unknown errors
  return errorResponse(error);
}
```

## Authentication

Edge Functions should validate authentication tokens:

```typescript
import { getAuthToken } from '../_shared/validation.ts';
import { createClient } from 'supabase';

const token = getAuthToken(req);

// Verify token with Supabase Auth
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
  global: {
    headers: { Authorization: `Bearer ${token}` },
  },
});

const {
  data: { user },
  error,
} = await supabase.auth.getUser();

if (error || !user) {
  throw new UnauthorizedError('Invalid token');
}
```

## Environment Variables

Edge Functions can access environment variables via `Deno.env.get()`:

```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
```

Set secrets via Supabase CLI:

```bash
supabase secrets set MY_SECRET=value
```

## Debugging

### Remote Debugging

Edge Functions can be debugged via logs:

```bash
# Follow logs in real-time
supabase functions logs <function-name> --follow
```

Add console.log statements to your Edge Function code for debugging:

```typescript
console.log('Request received:', { method: req.method, url: req.url });
console.error('Error occurred:', error);
```

### Logs

View Edge Function logs:

```bash
# View recent logs
supabase functions logs <function-name>

# Follow logs in real-time
supabase functions logs <function-name> --follow

# Filter by log level
supabase functions logs <function-name> --level error
```

## Testing

### Unit Tests (Shared Utilities)

Shared utilities can be tested with Deno's built-in test runner:

```bash
cd supabase/functions/_shared
deno test --allow-env
```

### Integration Tests

Integration tests should call deployed Edge Functions via HTTP:

```typescript
// tests/integration/edge-functions/example-function.test.ts
import { describe, it, expect } from 'vitest';

describe('example-function Edge Function', () => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  it('should process valid requests', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/example-function`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Test' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.message).toContain('Processed: Test');
  });
});
```

## Best Practices

1. **Always handle CORS** - Use `corsPreflightResponse()` for OPTIONS requests
2. **Validate all inputs** - Use Zod schemas and `validateRequestBody()`
3. **Authenticate requests** - Use `getAuthToken()` and verify with Supabase Auth
4. **Use typed errors** - Throw specific error classes (ValidationError, etc.)
5. **Return structured responses** - Use `successResponse()` and `errorResponse()`
6. **Keep functions small** - Single responsibility, one task per function
7. **Use shared utilities** - Reuse code from `_shared/`
8. **Log errors** - All errors are automatically logged by `errorResponse()`
9. **Deploy and test** - Deploy to dev environment and test via API
10. **Follow CLAUDE.md** - Adhere to project conventions (TDD, TypeScript strict mode, etc.)

## CORS Configuration

By default, Edge Functions allow CORS from all origins (`*`). For production, consider restricting to your app's domain:

```typescript
// _shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};
```

## Troubleshooting

### Function not found (404)

- Ensure function is deployed: `pnpm functions:deploy <function-name>`
- Check function name matches directory name
- Verify `index.ts` exists in function directory

### CORS errors in browser

- Ensure `OPTIONS` requests return `corsPreflightResponse()`
- Verify all responses include CORS headers (use `successResponse()` and `errorResponse()`)

### Authentication errors (401)

- Check `Authorization` header is present
- Verify token format: `Bearer <token>`
- Ensure token is valid (not expired)

### Validation errors (400)

- Check request body matches Zod schema
- Verify Content-Type header is `application/json`
- Ensure JSON is valid (no trailing commas, proper quotes)

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Zod Documentation](https://zod.dev/)
- [CLAUDE.md](../../CLAUDE.md) - Project development guidelines
