# Recipe Discovery & Shortlist Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build visual recipe discovery with smart filters and a household-level shortlist that bridges browsing to meal planning.

**Architecture:** Phase 1 establishes data layer (migration + ShortlistService + Zustand store). Phase 2 builds visual recipe grid with filters. Phase 3 adds shortlist UI (FAB + drawer). Phase 4 integrates calendar modal. All following strict TDD (RED→GREEN→REFACTOR).

**Tech Stack:** Next.js 15, TypeScript, Material UI, Supabase (PostgreSQL + Realtime), Zustand, Vitest

**Design Reference:** [2026-01-28-recipe-discovery-shortlist-design.md](./2026-01-28-recipe-discovery-shortlist-design.md)

---

## Phase 1: Data Layer & Services

### Task 1.1: Create recipe_shortlists Migration

**Files:**

- Create: `supabase/migrations/20260128000001_create_recipe_shortlists.sql`

**Step 1: Create migration file**

```bash
cd supabase/migrations
touch 20260128000001_create_recipe_shortlists.sql
```

**Step 2: Write idempotent migration**

```sql
-- Migration: Create recipe_shortlists table for household-level meal planning
-- Description: Allows household members to shortlist recipes before adding to calendar

-- Step 1: Create recipe_shortlists table
CREATE TABLE IF NOT EXISTS recipe_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, recipe_id)
);

-- Add table comment
COMMENT ON TABLE recipe_shortlists IS 'Household-level shortlist for meal planning. All household members see same shortlisted recipes.';

-- Add column comments
COMMENT ON COLUMN recipe_shortlists.household_id IS 'The household this shortlist entry belongs to';
COMMENT ON COLUMN recipe_shortlists.recipe_id IS 'The recipe being shortlisted';
COMMENT ON COLUMN recipe_shortlists.added_by_user_id IS 'User who added this recipe to shortlist';
COMMENT ON COLUMN recipe_shortlists.added_at IS 'Timestamp when recipe was shortlisted';

-- Step 2: Create index for fast household lookups
CREATE INDEX IF NOT EXISTS idx_recipe_shortlists_household ON recipe_shortlists(household_id);

-- Step 3: Enable Row Level Security
ALTER TABLE recipe_shortlists ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy for household isolation
CREATE POLICY recipe_shortlists_household_isolation ON recipe_shortlists
  FOR ALL
  USING (household_id = get_user_household_id());

COMMENT ON POLICY recipe_shortlists_household_isolation ON recipe_shortlists IS 'Users can only access shortlist entries for their household';
```

**Step 3: Test migration locally**

Run: `pnpm db:push`
Expected: Migration applied successfully, no errors

**Step 4: Verify table and RLS in Supabase Dashboard**

1. Go to Supabase Dashboard → Table Editor
2. Verify `recipe_shortlists` table exists
3. Go to SQL Editor, run:
   ```sql
   SELECT * FROM recipe_shortlists; -- Should return empty (RLS blocks access without household)
   ```

**Step 5: Commit migration**

```bash
git add supabase/migrations/20260128000001_create_recipe_shortlists.sql
git commit -m "feat(db): add recipe_shortlists table for household meal planning

- Household-level shortlist (collaborative)
- RLS policies enforce household isolation
- Track who added each recipe
- Unique constraint prevents duplicates"
```

---

### Task 1.2: Add ShortlistItem Type

**Files:**

- Modify: `packages/types/src/index.ts`

**Step 1: Add ShortlistItem type definition**

Find the section with other type exports and add:

```typescript
/**
 * Shortlist item with recipe and user attribution
 */
export interface ShortlistItem {
  id: string;
  recipe: Recipe;
  addedBy: {
    id: UserId;
    name: string;
  };
  addedAt: Date;
}
```

**Step 2: Export the type**

Ensure it's exported from the main index:

```typescript
export type { ShortlistItem } from './index';
```

**Step 3: Type check**

Run: `pnpm --filter @commontable/types type-check`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/types/src/index.ts
git commit -m "feat(types): add ShortlistItem type for meal planning"
```

---

### Task 1.3: Implement ShortlistService (TDD - Part 1: add method)

**Files:**

- Create: `packages/api-client/src/services/ShortlistService.test.ts`
- Create: `packages/api-client/src/services/ShortlistService.ts`

**Step 1: Write failing test for add method**

Create `packages/api-client/src/services/ShortlistService.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShortlistService } from './ShortlistService';
import { NotFoundError } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
} as unknown as SupabaseClient;

describe('ShortlistService', () => {
  let service: ShortlistService;

  beforeEach(() => {
    service = new ShortlistService(mockSupabase);
    vi.clearAllMocks();
  });

  describe('add', () => {
    it('should add recipe to household shortlist', async () => {
      const recipeId = 'recipe-123' as any;
      const userId = 'user-456' as any;
      const householdId = 'household-789' as any;

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      await service.add(recipeId, userId, householdId);

      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_shortlists');
    });

    it('should be idempotent (no error if already exists)', async () => {
      const recipeId = 'recipe-123' as any;
      const userId = 'user-456' as any;
      const householdId = 'household-789' as any;

      // Simulate unique constraint violation (23505)
      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key' },
        }),
      } as any);

      // Should not throw
      await expect(service.add(recipeId, userId, householdId)).resolves.not.toThrow();
    });

    it('should throw NotFoundError if recipe does not exist', async () => {
      const recipeId = 'nonexistent' as any;
      const userId = 'user-456' as any;
      const householdId = 'household-789' as any;

      // Simulate foreign key violation (23503)
      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23503', message: 'foreign key violation' },
        }),
      } as any);

      await expect(service.add(recipeId, userId, householdId)).rejects.toThrow(NotFoundError);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @commontable/api-client test ShortlistService`
Expected: FAIL - "ShortlistService is not defined"

**Step 3: Write minimal implementation**

Create `packages/api-client/src/services/ShortlistService.ts`:

```typescript
import { NotFoundError, type RecipeId, type UserId, type HouseholdId } from '@commontable/types';
import { BaseService } from './BaseService';

/**
 * Service for managing household recipe shortlists
 */
export class ShortlistService extends BaseService {
  /**
   * Add recipe to household shortlist
   * Idempotent: No error if already exists
   *
   * @param recipeId - Recipe to add
   * @param userId - User adding the recipe
   * @param householdId - Household ID
   * @throws {NotFoundError} If recipe does not exist
   */
  async add(recipeId: RecipeId, userId: UserId, householdId: HouseholdId): Promise<void> {
    const { error } = await this.supabase.from('recipe_shortlists').insert({
      recipe_id: recipeId,
      added_by_user_id: userId,
      household_id: householdId,
    });

    // Idempotent: ignore duplicate key errors (23505)
    if (error && error.code === '23505') {
      return;
    }

    // Foreign key violation: recipe doesn't exist
    if (error && error.code === '23503') {
      throw new NotFoundError('Recipe', recipeId);
    }

    if (error) {
      throw error;
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @commontable/api-client test ShortlistService`
Expected: PASS - All 3 tests pass

**Step 5: Commit**

```bash
git add packages/api-client/src/services/ShortlistService.ts packages/api-client/src/services/ShortlistService.test.ts
git commit -m "test(shortlist): add failing tests for ShortlistService.add

feat(shortlist): implement ShortlistService.add method

- Idempotent: ignores duplicate entries
- Validates recipe exists (foreign key)
- Proper error handling"
```

---

### Task 1.4: Implement ShortlistService (TDD - Part 2: remove method)

**Files:**

- Modify: `packages/api-client/src/services/ShortlistService.test.ts`
- Modify: `packages/api-client/src/services/ShortlistService.ts`

**Step 1: Write failing test for remove method**

Add to `ShortlistService.test.ts` after the `add` describe block:

```typescript
describe('remove', () => {
  it('should remove recipe from shortlist', async () => {
    const recipeId = 'recipe-123' as any;
    const householdId = 'household-789' as any;

    vi.mocked(mockSupabase.from).mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any);

    await service.remove(recipeId, householdId);

    expect(mockSupabase.from).toHaveBeenCalledWith('recipe_shortlists');
  });

  it('should be idempotent (no error if not in shortlist)', async () => {
    const recipeId = 'recipe-123' as any;
    const householdId = 'household-789' as any;

    vi.mocked(mockSupabase.from).mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any);

    // Should not throw even if nothing deleted
    await expect(service.remove(recipeId, householdId)).resolves.not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @commontable/api-client test ShortlistService`
Expected: FAIL - "service.remove is not a function"

**Step 3: Write minimal implementation**

Add to `ShortlistService.ts`:

```typescript
  /**
   * Remove recipe from household shortlist
   * Idempotent: No error if doesn't exist
   *
   * @param recipeId - Recipe to remove
   * @param householdId - Household ID
   */
  async remove(recipeId: RecipeId, householdId: HouseholdId): Promise<void> {
    const { error } = await this.supabase
      .from('recipe_shortlists')
      .delete()
      .eq('recipe_id', recipeId)
      .eq('household_id', householdId);

    if (error) {
      throw error;
    }
  }
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @commontable/api-client test ShortlistService`
Expected: PASS - All 5 tests pass

**Step 5: Commit**

```bash
git add packages/api-client/src/services/ShortlistService.ts packages/api-client/src/services/ShortlistService.test.ts
git commit -m "test(shortlist): add tests for ShortlistService.remove

feat(shortlist): implement ShortlistService.remove method

- Idempotent: no error if not in shortlist
- Filters by recipe and household"
```

---

### Task 1.5: Implement ShortlistService (TDD - Part 3: getAll method)

**Files:**

- Modify: `packages/api-client/src/services/ShortlistService.test.ts`
- Modify: `packages/api-client/src/services/ShortlistService.ts`

**Step 1: Write failing test for getAll method**

Add to `ShortlistService.test.ts`:

```typescript
describe('getAll', () => {
  it('should return all shortlisted recipes with user attribution', async () => {
    const householdId = 'household-789' as any;
    const mockData = [
      {
        id: 'shortlist-1',
        recipe_id: 'recipe-123',
        added_by_user_id: 'user-456',
        added_at: '2026-01-28T10:00:00Z',
        recipes: {
          id: 'recipe-123',
          title: 'Pasta Carbonara',
          household_id: 'household-789',
        },
        profiles: {
          id: 'user-456',
          full_name: 'John Doe',
        },
      },
    ];

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    } as any);

    const result = await service.getAll(householdId);

    expect(result).toHaveLength(1);
    expect(result[0].recipe.title).toBe('Pasta Carbonara');
    expect(result[0].addedBy.name).toBe('John Doe');
  });

  it('should return empty array if no recipes shortlisted', async () => {
    const householdId = 'household-789' as any;

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any);

    const result = await service.getAll(householdId);

    expect(result).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @commontable/api-client test ShortlistService`
Expected: FAIL - "service.getAll is not a function"

**Step 3: Write minimal implementation**

Add to `ShortlistService.ts`:

```typescript
import type { ShortlistItem } from '@commontable/types';

// ... existing code ...

  /**
   * Get all shortlisted recipes for household
   * Includes recipe details and user attribution
   *
   * @param householdId - Household ID
   * @returns Array of shortlist items with recipe and user details
   */
  async getAll(householdId: HouseholdId): Promise<ShortlistItem[]> {
    const { data, error } = await this.supabase
      .from('recipe_shortlists')
      .select(
        `
        id,
        recipe_id,
        added_by_user_id,
        added_at,
        recipes!inner(*),
        profiles!inner(id, full_name)
      `,
      )
      .eq('household_id', householdId);

    if (error) {
      throw error;
    }

    return (
      data?.map((item: any) => ({
        id: item.id,
        recipe: item.recipes,
        addedBy: {
          id: item.profiles.id,
          name: item.profiles.full_name,
        },
        addedAt: new Date(item.added_at),
      })) || []
    );
  }
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @commontable/api-client test ShortlistService`
Expected: PASS - All 7 tests pass

**Step 5: Commit**

```bash
git add packages/api-client/src/services/ShortlistService.ts packages/api-client/src/services/ShortlistService.test.ts
git commit -m "test(shortlist): add tests for ShortlistService.getAll

feat(shortlist): implement ShortlistService.getAll method

- Returns recipes with user attribution
- Joins recipes and profiles tables
- Returns empty array if no shortlisted recipes"
```

---

### Task 1.6: Export ShortlistService

**Files:**

- Modify: `packages/api-client/src/services/index.ts`

**Step 1: Export ShortlistService**

Add to the exports:

```typescript
export { ShortlistService } from './ShortlistService';
```

**Step 2: Type check**

Run: `pnpm --filter @commontable/api-client type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/api-client/src/services/index.ts
git commit -m "feat(shortlist): export ShortlistService from api-client"
```

---

### Task 1.7: Create Zustand Shortlist Store

**Files:**

- Create: `apps/web/stores/useShortlistStore.ts`
- Create: `apps/web/stores/useShortlistStore.test.ts`

**Step 1: Write failing test for Zustand store**

Create `apps/web/stores/useShortlistStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useShortlistStore } from './useShortlistStore';
import type { ShortlistItem } from '@commontable/types';

// Mock ShortlistService
vi.mock('@commontable/api-client', () => ({
  ShortlistService: vi.fn().mockImplementation(() => ({
    getAll: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  })),
}));

describe('useShortlistStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useShortlistStore.setState({
      items: [],
      loading: false,
      error: null,
    });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useShortlistStore());

    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load shortlist items', async () => {
    const mockItems: ShortlistItem[] = [
      {
        id: '1',
        recipe: { id: 'recipe-1', title: 'Pasta' } as any,
        addedBy: { id: 'user-1', name: 'John' },
        addedAt: new Date(),
      },
    ];

    const { result } = renderHook(() => useShortlistStore());

    act(() => {
      result.current.load('household-123' as any);
    });

    await waitFor(() => {
      expect(result.current.items).toEqual(mockItems);
    });
  });

  it('should get shortlist count', () => {
    const { result } = renderHook(() => useShortlistStore());

    useShortlistStore.setState({
      items: [
        {
          id: '1',
          recipe: { id: 'recipe-1' } as any,
          addedBy: { id: 'user-1', name: 'John' },
          addedAt: new Date(),
        },
      ],
    });

    expect(result.current.getCount()).toBe(1);
  });

  it('should check if recipe is in shortlist', () => {
    const { result } = renderHook(() => useShortlistStore());

    useShortlistStore.setState({
      items: [
        {
          id: '1',
          recipe: { id: 'recipe-1' } as any,
          addedBy: { id: 'user-1', name: 'John' },
          addedAt: new Date(),
        },
      ],
    });

    expect(result.current.hasRecipe('recipe-1' as any)).toBe(true);
    expect(result.current.hasRecipe('recipe-2' as any)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web test useShortlistStore`
Expected: FAIL - "Cannot find module './useShortlistStore'"

**Step 3: Write minimal implementation**

Create `apps/web/stores/useShortlistStore.ts`:

```typescript
import { create } from 'zustand';
import { ShortlistService } from '@commontable/api-client';
import type { ShortlistItem, HouseholdId, RecipeId, UserId } from '@commontable/types';
import { createClient } from '@/lib/supabase/client';

interface ShortlistStore {
  items: ShortlistItem[];
  loading: boolean;
  error: string | null;

  // Actions
  load: (householdId: HouseholdId) => Promise<void>;
  add: (recipeId: RecipeId, userId: UserId, householdId: HouseholdId) => Promise<void>;
  remove: (recipeId: RecipeId, householdId: HouseholdId) => Promise<void>;

  // Selectors
  getCount: () => number;
  hasRecipe: (recipeId: RecipeId) => boolean;
}

export const useShortlistStore = create<ShortlistStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  load: async (householdId: HouseholdId) => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const service = new ShortlistService(supabase);
      const items = await service.getAll(householdId);
      set({ items, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  add: async (recipeId: RecipeId, userId: UserId, householdId: HouseholdId) => {
    try {
      const supabase = createClient();
      const service = new ShortlistService(supabase);
      await service.add(recipeId, userId, householdId);
      // Reload after add
      await get().load(householdId);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  remove: async (recipeId: RecipeId, householdId: HouseholdId) => {
    try {
      const supabase = createClient();
      const service = new ShortlistService(supabase);
      await service.remove(recipeId, householdId);
      // Reload after remove
      await get().load(householdId);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  getCount: () => get().items.length,

  hasRecipe: (recipeId: RecipeId) => get().items.some((item) => item.recipe.id === recipeId),
}));
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter web test useShortlistStore`
Expected: PASS - All tests pass

**Step 5: Commit**

```bash
git add apps/web/stores/useShortlistStore.ts apps/web/stores/useShortlistStore.test.ts
git commit -m "test(shortlist): add tests for useShortlistStore

feat(shortlist): implement Zustand shortlist store

- Load, add, remove actions
- Selectors for count and hasRecipe
- Error handling and loading states"
```

---

## Phase 2: Recipe Discovery UI

### Task 2.1: Create RecipeCard Component (TDD)

**Files:**

- Create: `apps/web/components/recipe/RecipeCard.tsx`
- Create: `apps/web/components/recipe/RecipeCard.test.tsx`

**Step 1: Write failing test**

Create `apps/web/components/recipe/RecipeCard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeCard } from './RecipeCard';
import type { Recipe } from '@commontable/types';

const mockRecipe: Recipe = {
  id: 'recipe-1',
  title: 'Pasta Carbonara',
  tags: ['pasta', 'italian', 'quick'],
  last_cooked_at: new Date('2026-01-25'),
  household_id: 'household-1',
} as any;

describe('RecipeCard', () => {
  it('should render recipe title', () => {
    render(
      <RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />,
    );

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
  });

  it('should render tags (first 3)', () => {
    render(
      <RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />,
    );

    expect(screen.getByText('pasta')).toBeInTheDocument();
    expect(screen.getByText('italian')).toBeInTheDocument();
    expect(screen.getByText('quick')).toBeInTheDocument();
  });

  it('should render last cooked date', () => {
    render(
      <RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />,
    );

    expect(screen.getByText(/Last cooked:/)).toBeInTheDocument();
  });

  it('should show "Never cooked" if no last_cooked_at', () => {
    const recipe = { ...mockRecipe, last_cooked_at: null };
    render(<RecipeCard recipe={recipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

    expect(screen.getByText('Never cooked')).toBeInTheDocument();
  });

  it('should call onAddToShortlist when button clicked', () => {
    const onAddToShortlist = vi.fn();
    render(
      <RecipeCard recipe={mockRecipe} onAddToShortlist={onAddToShortlist} isInShortlist={false} />,
    );

    const button = screen.getByRole('button', { name: /add to shortlist/i });
    fireEvent.click(button);

    expect(onAddToShortlist).toHaveBeenCalledWith('recipe-1');
  });

  it('should show "Added ✓" when isInShortlist is true', () => {
    render(
      <RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={true} />,
    );

    expect(screen.getByText(/Added/)).toBeInTheDocument();
  });

  it('should navigate to recipe detail when card clicked', () => {
    const { container } = render(
      <RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />,
    );

    const card = container.querySelector('[data-testid="recipe-card"]');
    expect(card).toHaveAttribute('href', '/recipes/recipe-1');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web test RecipeCard`
Expected: FAIL - "Cannot find module './RecipeCard'"

**Step 3: Write minimal implementation**

Create `apps/web/components/recipe/RecipeCard.tsx`:

```typescript
'use client';

import type { Recipe, RecipeId } from '@commontable/types';
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Button,
  Chip,
  Box,
  Stack,
} from '@mui/material';
import { BookmarkBorder as BookmarkIcon, Check as CheckIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export interface RecipeCardProps {
  recipe: Recipe;
  onAddToShortlist: (recipeId: RecipeId) => void;
  isInShortlist: boolean;
}

/**
 * RecipeCard component
 * Displays a recipe with image, title, tags, rating, last cooked date
 * and an "Add to Shortlist" button
 */
export function RecipeCard({ recipe, onAddToShortlist, isInShortlist }: RecipeCardProps) {
  const handleAddToShortlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    onAddToShortlist(recipe.id);
  };

  // Format last cooked date
  const lastCookedText = recipe.last_cooked_at
    ? `Last cooked: ${formatDistanceToNow(new Date(recipe.last_cooked_at), { addSuffix: true })}`
    : 'Never cooked';

  // Show first 3 tags
  const displayTags = recipe.tags?.slice(0, 3) || [];

  return (
    <Link href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none' }}>
      <Card data-testid="recipe-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Placeholder for image - will be implemented later */}
        <CardMedia
          component="div"
          sx={{
            height: 200,
            bgcolor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No image
          </Typography>
        </CardMedia>

        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="body1" gutterBottom>
            {recipe.title}
          </Typography>

          {/* Tags */}
          {displayTags.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
              {displayTags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>
          )}

          {/* Last cooked */}
          <Typography variant="body2" color="text.secondary">
            {lastCookedText}
          </Typography>
        </CardContent>

        <CardActions>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={isInShortlist ? <CheckIcon /> : <BookmarkIcon />}
            onClick={handleAddToShortlist}
            aria-label={isInShortlist ? 'Added to shortlist' : 'Add to shortlist'}
          >
            {isInShortlist ? 'Added' : 'Add to Shortlist'}
          </Button>
        </CardActions>
      </Card>
    </Link>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter web test RecipeCard`
Expected: PASS - All tests pass

**Step 5: Commit**

```bash
git add apps/web/components/recipe/RecipeCard.tsx apps/web/components/recipe/RecipeCard.test.tsx
git commit -m "test(recipe): add tests for RecipeCard component

feat(recipe): implement RecipeCard component

- Rich recipe card with title, tags, last cooked
- Add to Shortlist button with state
- Placeholder for image (implemented later)
- Material Design 3 compliant"
```

---

## Checkpoint: Phase 1 Complete

At this point, you have:

- ✅ Database migration for recipe_shortlists
- ✅ ShortlistService with full test coverage
- ✅ Zustand store for shortlist state
- ✅ RecipeCard component

**Remaining tasks:**

- Phase 2: RecipeGrid, WhatCanICookPanel, update RecipesPage
- Phase 3: ShortlistFAB, ShortlistDrawer
- Phase 4: AddToCalendarModal, calendar integration
- Phase 5: Polish (loading states, error handling, accessibility)

**Next:** Continue with Task 2.2 (RecipeGrid with infinite scroll) or take a break and resume later.

---

## Implementation Notes

### Testing Requirements

- All services: 100% coverage (MANDATORY)
- All components: 80%+ coverage
- Run tests after each task: `pnpm test`
- Type check after each task: `pnpm type-check`

### Commit Guidelines

- Frequent commits (every task step)
- Conventional commit format: `feat:`, `test:`, `refactor:`, `fix:`
- Include context in commit messages

### Design System Compliance

- Only approved MUI components (see DESIGN_SYSTEM.md)
- Typography: h5, h6, body1, body2 only
- Spacing: 8, 16, 24, 32 only (MUI units: 1, 2, 3, 4)
- No emojis in production code
- Material Icons from @mui/icons-material

### References

- Design: [2026-01-28-recipe-discovery-shortlist-design.md](./2026-01-28-recipe-discovery-shortlist-design.md)
- CLAUDE.md: TDD workflow, TypeScript patterns, MUI constraints
- DESIGN_SYSTEM.md: Material UI component restrictions

### Getting Help

- Read CLAUDE.md for TDD examples
- Check existing services for patterns (RecipeService, CalendarService)
- Review existing components for MUI usage patterns
