# @commontable/types

Shared TypeScript types and interfaces for CommonTable.

## Contents

- **Domain models** - Recipe, User, Household, and other core entities
- **Branded ID types** - RecipeId, UserId, HouseholdId for type-safe identifiers
- **Database schema types** - Auto-generated from Supabase (see `src/database.ts`)
- **Custom error classes** - AppError, ValidationError, NotFoundError, UnauthorizedError, ConflictError, SyncError
- **API request/response types** - Type definitions for API endpoints
- **Zod validation schemas** - Runtime validation schemas for data validation

## Usage

### Importing Types

```typescript
import type { Recipe, RecipeId, User, Household } from '@commontable/types';
import { CreateRecipeSchema } from '@commontable/types';

const recipeId: RecipeId = 'abc123' as RecipeId;
const input = CreateRecipeSchema.parse(data);
```

### Using Error Classes

```typescript
import { NotFoundError, ValidationError } from '@commontable/types';

throw new NotFoundError('Recipe', recipeId);
throw new ValidationError('Invalid recipe data', { errors });
```

### Branded Types

This package uses branded types for IDs to prevent mixing different entity types:

```typescript
type RecipeId = string & { __brand: 'RecipeId' };
type UserId = string & { __brand: 'UserId' };

function getRecipe(id: RecipeId): Promise<Recipe> {
  /* ... */
}

const recipeId = 'abc123' as RecipeId;
const userId = 'user456' as UserId;

getRecipe(userId); // TypeScript error: Type 'UserId' is not assignable to 'RecipeId'
```

## Development

- `pnpm type-check` - Type check without building
- `pnpm clean` - Remove build artifacts

## TypeScript Configuration

This package uses strict TypeScript mode with:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

## Dependencies

- **zod** - Runtime schema validation
