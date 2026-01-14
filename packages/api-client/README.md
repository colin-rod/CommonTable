# @commontable/api-client

Supabase client and service layer for CommonTable.

## Contents

- **Supabase client initialization** - Configured clients for browser and server contexts
- **BaseService abstract class** - Foundation for all data services
- **Environment variable validation** - Zod-based env validation with caching
- **Type re-exports** - Convenient access to all `@commontable/types`

## Usage

### Creating a Supabase Client

```typescript
import { createClient } from '@commontable/api-client';

const supabase = createClient();

// Use the client
const { data, error } = await supabase
  .from('recipes')
  .select('*')
  .eq('household_id', householdId);
```

### Extending BaseService

```typescript
import { BaseService } from '@commontable/api-client';
import type { Recipe, RecipeId } from '@commontable/api-client';

export class RecipeService extends BaseService {
  async getById(id: RecipeId): Promise<Recipe> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Recipe', id);

    return data;
  }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    // Implementation
  }
}
```

### Environment Validation

```typescript
import { validateEnv, getEnv } from '@commontable/api-client';

// Validate on startup
const env = validateEnv();

// Or use cached version
const env = getEnv();

console.log(env.NEXT_PUBLIC_SUPABASE_URL);
console.log(env.NODE_ENV);
```

### Using Re-exported Types

```typescript
// Instead of importing from @commontable/types
import type { Recipe, RecipeId } from '@commontable/api-client';

// All types from @commontable/types are available
```

## Development

- `pnpm type-check` - Type check without building
- `pnpm clean` - Remove build artifacts

## Required Environment Variables

This package requires these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - (Optional) Service role key for server-side operations
- `NODE_ENV` - Environment (defaults to 'development')

See [apps/web/.env.example](../../apps/web/.env.example) for example configuration.

## Dependencies

- **@commontable/types** - Shared types and validation schemas
- **@supabase/supabase-js** - Supabase JavaScript client
- **zod** - Runtime schema validation

## TypeScript Configuration

This package uses strict TypeScript mode with:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- Path aliases to `@commontable/types` for better IDE support
