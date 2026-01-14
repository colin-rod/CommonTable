# CommonTable - Claude Development Guide

## Project Overview

**CommonTable** is a shared household recipe book that helps families plan meals, improve recipes over time, and preserve what they love to cook — together.

### Tech Stack
- **Monorepo**: Turborepo with pnpm workspaces
- **Web**: Next.js 15 (App Router) + TypeScript + Material UI (M3)
- **Mobile**: Deferred to Phase 2 (React Native + Expo)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Offline Storage**: Dexie.js (IndexedDB) for web
- **State**: Zustand
- **UI Framework**: Material UI (Material Design 3) - strict design system
- **PWA**: Progressive Web App with offline support
- **Testing**: Vitest (unit/integration), Playwright (E2E)

---

## Test-Driven Development (TDD) - MANDATORY

### Red-Green-Refactor Discipline

**CRITICAL**: This project follows **strict TDD**. ALL production code must be written test-first.

#### The Process (Non-Negotiable)

1. **RED**: Write a failing test first
   - Test must fail for the right reason (not syntax errors)
   - Test describes the desired behavior
   - Run test suite: verify it fails

2. **GREEN**: Write minimal code to make the test pass
   - Only write enough code to pass the current test
   - No gold-plating, no "while I'm here" changes
   - Run test suite: verify it passes

3. **REFACTOR**: Improve code quality without changing behavior
   - Extract functions, improve naming, remove duplication
   - Run test suite after each refactor: verify still green

#### What Requires Tests FIRST

**Services & Business Logic** (100% TDD required):
- All service methods (`RecipeService`, `CalendarService`, etc.)
- Sync engine logic (`push.ts`, `pull.ts`, `conflicts.ts`)
- Utility functions (unit conversion, ingredient parsing, etc.)
- Database functions and triggers (test with local Supabase)

**React Components** (Pragmatic TDD):
- Business logic in custom hooks (strict TDD)
- Component behavior (user interactions, conditional rendering)
- Form validation logic
- UI can be tested with React Testing Library or visually

**Edge Functions** (TDD via integration tests):
- Input validation
- Business logic
- Error handling
- Response formatting

#### Example TDD Workflow

```typescript
// 1. RED: Write failing test first
describe('RecipeService', () => {
  it('should create a recipe with initial version', async () => {
    const service = new RecipeService();
    const recipe = await service.create({
      title: 'Pasta Carbonara',
      servings: 4,
      ingredients: [{ name: 'pasta', quantity: 400, unit: 'g' }],
      steps: [{ position: 1, text: 'Boil pasta' }]
    });

    expect(recipe.id).toBeDefined();
    expect(recipe.current_version_id).toBeDefined();
    expect(recipe.title).toBe('Pasta Carbonara');
  });
});

// Run test: FAILS (RecipeService.create doesn't exist yet)

// 2. GREEN: Minimal implementation
class RecipeService {
  async create(data: CreateRecipeInput): Promise<Recipe> {
    // Minimal implementation to pass test
    const recipeId = uuid();
    const versionId = uuid();

    const recipe = await db.recipes.insert({
      id: recipeId,
      household_id: getCurrentHouseholdId(),
      title: data.title,
      current_version_id: versionId,
    });

    await db.recipe_versions.insert({
      id: versionId,
      recipe_id: recipeId,
      version_number: 1,
      ingredients_json: data.ingredients,
      steps_json: data.steps,
      servings: data.servings,
    });

    return recipe;
  }
}

// Run test: PASSES

// 3. REFACTOR: Improve without changing behavior
class RecipeService {
  async create(data: CreateRecipeInput): Promise<Recipe> {
    return await db.transaction(async (tx) => {
      const recipeId = uuid();
      const versionId = uuid();

      const recipe = await this.insertRecipe(tx, recipeId, data, versionId);
      await this.createInitialVersion(tx, recipeId, versionId, data);

      return recipe;
    });
  }

  private async insertRecipe(tx, id, data, versionId) { /* ... */ }
  private async createInitialVersion(tx, recipeId, versionId, data) { /* ... */ }
}

// Run test: STILL PASSES
```

#### Test Coverage Requirements

- **Services**: 100% coverage (all branches, all edge cases)
- **Utils**: 100% coverage
- **Sync Engine**: 100% coverage
- **Components**: 80%+ coverage (business logic fully covered)
- **Edge Functions**: 100% coverage (critical path)

#### Enforcement

- CI pipeline runs tests on every PR
- PRs cannot merge if tests fail
- PRs must include tests for new features
- Code review checklist includes "Tests written first?"

---

## TypeScript Strict Mode Patterns

### Configuration

All packages must use strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

### Type Safety Guidelines

#### 1. Never Use `any`

```typescript
// BAD
function parseIngredient(input: any) {
  return input.split(' ');
}

// GOOD
interface IngredientInput {
  raw: string;
}

function parseIngredient(input: IngredientInput): ParsedIngredient {
  // Implementation
}
```

Use `unknown` when type is truly unknown, then narrow with type guards.

#### 2. Discriminated Unions for States

```typescript
// BAD
interface SyncState {
  status: 'idle' | 'syncing' | 'error';
  error?: string;
  lastSync?: Date;
}

// GOOD
type SyncState =
  | { status: 'idle' }
  | { status: 'syncing'; startedAt: Date }
  | { status: 'error'; error: string; failedAt: Date }
  | { status: 'success'; lastSync: Date };

function handleSync(state: SyncState) {
  switch (state.status) {
    case 'idle':
      // state.lastSync doesn't exist (TypeScript error)
      break;
    case 'error':
      console.error(state.error); // error is guaranteed to exist
      break;
    case 'success':
      console.log(state.lastSync); // lastSync is guaranteed
      break;
  }
}
```

#### 3. Branded Types for IDs

```typescript
// BAD
function getRecipe(id: string): Promise<Recipe> { }

// GOOD
type RecipeId = string & { __brand: 'RecipeId' };
type UserId = string & { __brand: 'UserId' };

function getRecipe(id: RecipeId): Promise<Recipe> { }

// Usage
const recipeId = 'abc123' as RecipeId;
const userId = 'user456' as UserId;

getRecipe(userId); // TypeScript error: Type 'UserId' is not assignable to 'RecipeId'
```

#### 4. Readonly by Default

```typescript
// BAD
interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
}

// GOOD
interface Recipe {
  readonly id: string;
  readonly title: string;
  readonly ingredients: readonly Ingredient[];
}

// Or use Readonly utility type
type Recipe = Readonly<{
  id: string;
  title: string;
  ingredients: readonly Ingredient[];
}>;
```

#### 5. Exhaustive Switch Checks

```typescript
type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

function getMealIcon(slot: MealSlot): IconName {
  switch (slot) {
    case 'breakfast':
      return 'coffee';
    case 'lunch':
      return 'sun';
    case 'dinner':
      return 'moon';
    case 'snack':
      return 'cookie';
    default:
      const exhaustiveCheck: never = slot;
      throw new Error(`Unhandled meal slot: ${exhaustiveCheck}`);
  }
}
```

#### 6. Zod for Runtime Validation

Use Zod schemas for:
- Form validation
- API request/response validation
- Edge Function input validation

```typescript
import { z } from 'zod';

const CreateRecipeSchema = z.object({
  title: z.string().min(1).max(200),
  servings: z.number().int().positive().optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().positive().optional(),
    unit: z.string().optional(),
  })).min(1),
  steps: z.array(z.object({
    position: z.number().int().positive(),
    text: z.string().min(1),
  })).min(1),
});

type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;

// Use in service
function createRecipe(input: unknown): Promise<Recipe> {
  const validated = CreateRecipeSchema.parse(input); // Throws if invalid
  return recipeService.create(validated);
}
```

---

## Material UI & Design System (MANDATORY)

### Design System Philosophy

**Source of Truth**: `/Users/colinrodrigues/CommonTable/DESIGN_SYSTEM.md`

This project follows an **extremely strict** Material Design 3 design system. The goal is a calm, Google-like, low-cognitive-load experience. **If a user notices the design, it is likely too loud.**

### Core Constraints (Non-Negotiable)

#### 1. Allowed MUI Components ONLY

**Layout & Structure**:
- `Container`, `Box`, `Stack`, `Divider`

**Surfaces**:
- `Paper`, `Card`, `CardContent`

**Lists** (Primary Pattern):
- `List`, `ListItem`, `ListItemButton`, `ListItemText`

**Inputs**:
- `TextField`, `Select`, `Checkbox`, `Radio`

**Actions**:
- `Button`

**Feedback**:
- `Dialog`, `Snackbar`, `CircularProgress`

**Any component not listed above is FORBIDDEN** without updating DESIGN_SYSTEM.md first.

#### 2. Button Variants (Exactly 3)

```typescript
// ALLOWED BUTTONS - ONLY THESE 3 VARIANTS

// 1. Primary Button
<Button variant="contained" color="primary">
  Add Recipe
</Button>

// 2. Secondary Button
<Button variant="outlined" color="primary">
  Cancel
</Button>

// 3. Destructive Button
<Button variant="contained" color="error">
  Delete Recipe
</Button>

// FORBIDDEN
<Button variant="text">No</Button>  // ❌ Text variant not allowed
<Button variant="contained" color="secondary">No</Button>  // ❌ Secondary color not allowed
<Button variant="contained"><DeleteIcon /></Button>  // ❌ Icon-only primary button forbidden
```

**Button Rules**:
- **Only ONE primary button per screen**
- Primary buttons must contain text (no icon-only primary buttons)
- Button labels must be verbs (e.g., "Add recipe", "Save changes", "Delete")

#### 3. Typography Variants (Exactly 4)

```typescript
// ALLOWED TYPOGRAPHY - ONLY THESE 4 VARIANTS

import { Typography } from '@mui/material';

// 1. Page Title
<Typography variant="h5">My Recipes</Typography>

// 2. Section Header
<Typography variant="h6">Recent Activity</Typography>

// 3. Primary Content
<Typography variant="body1">This is the main recipe description.</Typography>

// 4. Secondary/Meta Content
<Typography variant="body2">Last updated 2 days ago</Typography>

// FORBIDDEN
<Typography variant="h1">No</Typography>  // ❌ h1 not allowed
<Typography variant="h2">No</Typography>  // ❌ h2 not allowed
<Typography variant="h3">No</Typography>  // ❌ h3 not allowed
<Typography variant="h4">No</Typography>  // ❌ h4 not allowed
<Typography variant="subtitle1">No</Typography>  // ❌ subtitle variants not allowed
<Typography variant="caption">No</Typography>  // ❌ caption not allowed
```

**Typography Rules**:
- Max **3 typography variants per screen**
- Line height ≥ 1.4
- Hierarchy via size and weight, **not color**
- No italics, no decorative fonts

#### 4. Spacing System (8px Base)

```typescript
// ALLOWED SPACING VALUES ONLY: 4, 8, 16, 24, 32, 48

import { Box, Stack } from '@mui/material';

// GOOD - Using allowed spacing units
<Box sx={{ padding: 2 }}>  {/* 2 * 8 = 16px */}
<Box sx={{ margin: 3 }}>   {/* 3 * 8 = 24px */}
<Stack spacing={2}>        {/* 16px gap */}
<Stack spacing={4}>        {/* 32px gap */}

// FORBIDDEN
<Box sx={{ padding: '12px' }}>  // ❌ 12 not in allowed list
<Box sx={{ margin: 5 }}>        // ❌ 5 * 8 = 40px not allowed
<Stack spacing={2.5}>           // ❌ 20px not allowed

// Allowed MUI spacing units (multiply by 8):
// 0.5 → 4px
// 1   → 8px
// 2   → 16px
// 3   → 24px
// 4   → 32px
// 6   → 48px
```

**Spacing Rules**:
- Vertical spacing prioritized over horizontal
- No arbitrary spacing (must align to 4, 8, 16, 24, 32, 48)
- Use `Stack` with `spacing` prop for consistent gaps

#### 5. Color System (Material Roles)

```typescript
// ALLOWED COLOR ROLES ONLY

import { useTheme } from '@mui/material/styles';

const theme = useTheme();

// Required roles:
theme.palette.background.default
theme.palette.background.paper
theme.palette.primary.main
theme.palette.text.primary
theme.palette.text.secondary
theme.palette.divider
theme.palette.error.main

// Optional:
theme.palette.action.disabled
theme.palette.action.hover

// FORBIDDEN
<Box sx={{ bgcolor: '#FF5733' }}>  // ❌ Custom hex colors forbidden
<Button sx={{ background: 'linear-gradient(...)' }}>  // ❌ Gradients forbidden
<Box sx={{ bgcolor: 'primary.main', opacity: 0.5 }}>  // ❌ Transparency overlays forbidden
```

**Color Rules**:
- No gradients
- No transparency overlays
- No more than **one accent color** (`primary`) per screen
- `error` used **only** for destructive actions
- Avoid pure white (#FFFFFF) and pure black (#000000)

#### 6. Elevation (Low Only)

```typescript
// ALLOWED ELEVATIONS: 0, 1, 2

<Paper elevation={0}>  // ✅ Flat
<Paper elevation={1}>  // ✅ Subtle shadow
<Paper elevation={2}>  // ✅ Light shadow

// FORBIDDEN
<Paper elevation={3}>  // ❌ Forbidden in MVP
<Paper elevation={8}>  // ❌ Forbidden in MVP
<Paper elevation={24}> // ❌ Forbidden in MVP
```

**Elevation Rules**:
- Use **low elevation only**
- Elevation > 2 is forbidden in MVP

#### 7. Shape

```typescript
// Use theme borderRadius only

import { useTheme } from '@mui/material/styles';

const theme = useTheme();

<Box sx={{ borderRadius: theme.shape.borderRadius }}>  // ✅

// FORBIDDEN
<Box sx={{ borderRadius: '12px' }}>  // ❌ Custom radius values forbidden
<Box sx={{ borderRadius: '50%' }}>   // ❌ Custom radius values forbidden
```

### MUI Theme Configuration

Create a strict theme that enforces DESIGN_SYSTEM.md constraints:

```typescript
// apps/web/lib/theme.ts

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',  // Material Blue
    },
    background: {
      default: '#fafafa',  // Warm neutral, not pure white
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    error: {
      main: '#d32f2f',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h5: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',  // No ALL CAPS
          fontWeight: 500,
        },
      },
    },
  },
});
```

### Prohibited Patterns (DESIGN_SYSTEM.md)

Explicitly **FORBIDDEN**:
- ❌ Using non-approved MUI components
- ❌ Adding button variants beyond the 3 allowed
- ❌ Adding new colors outside the theme
- ❌ Icon-only primary actions
- ❌ One-off component styling (use theme or approved MUI props only)
- ❌ Decorative animations
- ❌ Custom CSS classes (use MUI `sx` prop with theme tokens)
- ❌ Inline styles except on layout primitives like `Box`
- ❌ Emojis anywhere in the UI

### Content & Tone Rules

**Voice**: Calm, neutral, practical, slightly warm

```typescript
// BAD ❌
<Typography>Oops! Something went wrong 😅</Typography>
<Button>🎉 Yay! Add Recipe</Button>
<Alert severity="error">Oh no! 💥</Alert>

// GOOD ✅
<Typography>Couldn't save the recipe. Try again.</Typography>
<Button>Add Recipe</Button>
<Alert severity="error">Failed to save. Check your connection.</Alert>
```

**Rules**:
- No emojis
- No jokes
- No playful language
- Error messages short and neutral

### Page Structure (Mandatory)

All pages must follow this order:

```typescript
import { Container, Typography, Stack, Box } from '@mui/material';

export default function RecipesPage() {
  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        {/* 1. Page Title (h5) */}
        <Typography variant="h5">My Recipes</Typography>

        {/* 2. Optional Page Description (body2) */}
        <Typography variant="body2" color="text.secondary">
          Your household's collection of recipes
        </Typography>

        {/* 3. Primary Content */}
        <Box>
          {/* Recipe list, forms, etc. */}
        </Box>

        {/* 4. Optional Secondary Content */}
        <Box>
          {/* Additional actions, metadata, etc. */}
        </Box>
      </Stack>
    </Container>
  );
}
```

**Rules**:
- Single primary content column
- No competing primary actions
- No complex grid layouts in MVP
- Use `Container`, `Stack`, and `Box` only

### Lists (Critical Pattern)

Lists are the **backbone** of the app. Most content should be displayed in lists.

```typescript
import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';

function RecipeList({ recipes }: { recipes: Recipe[] }) {
  return (
    <List>
      {recipes.map((recipe) => (
        <ListItem key={recipe.id} disablePadding>
          <ListItemButton onClick={() => navigate(recipe.id)}>
            <ListItemText
              primary={recipe.title}
              secondary={`Last cooked: ${formatDate(recipe.last_cooked_at)}`}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
```

**List Rules**:
- Lists are vertically stacked
- Each row contains:
  - Primary text (required)
  - Optional secondary text
  - Optional single action
- Rows that navigate are fully clickable (`ListItemButton`)
- Tables are **forbidden** in MVP

### Forms & Inputs

```typescript
import { TextField, Stack, Button } from '@mui/material';

function RecipeForm({ onSubmit }: RecipeFormProps) {
  return (
    <Stack spacing={3} component="form" onSubmit={onSubmit}>
      {/* Labels always visible (not placeholders) */}
      <TextField
        label="Recipe Title"
        required
        fullWidth
        helperText="Give your recipe a descriptive name"
      />

      <TextField
        label="Servings"
        type="number"
        fullWidth
      />

      {/* One primary button per form */}
      <Button type="submit" variant="contained" color="primary">
        Save Recipe
      </Button>
    </Stack>
  );
}
```

**Form Rules**:
- Labels must always be visible
- Placeholders are not labels
- Errors appear only after user interaction
- Error messages are short and neutral
- Prefer one task per screen (avoid dense forms)

### TypeScript Utilities for Enforcement

Create utilities to prevent invalid combinations:

```typescript
// apps/web/lib/mui-utils.ts

import { ButtonProps } from '@mui/material/Button';

// Enforce allowed button variants
export type AllowedButtonVariant =
  | { variant: 'contained'; color: 'primary' }
  | { variant: 'outlined'; color: 'primary' }
  | { variant: 'contained'; color: 'error' };

export function Button(props: Omit<ButtonProps, 'variant' | 'color'> & AllowedButtonVariant) {
  return <MuiButton {...props} />;
}

// Enforce allowed typography variants
export type AllowedTypographyVariant = 'h5' | 'h6' | 'body1' | 'body2';

// Enforce allowed spacing values
export type AllowedSpacing = 0.5 | 1 | 2 | 3 | 4 | 6;  // Maps to 4, 8, 16, 24, 32, 48
```

### Default Decision Rules

When uncertain:
1. Reduce visual noise
2. Reduce options
3. Prefer text over icons
4. Prefer clarity over delight
5. Prefer reuse over novelty

> **"A boring, predictable UI means the system is working."**

---

## React Best Practices

### Component Patterns

#### 1. Functional Components Only

```typescript
// BAD
class RecipeCard extends React.Component { }

// GOOD
import { ListItem, ListItemButton, ListItemText } from '@mui/material';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (id: RecipeId) => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <ListItem disablePadding>
      <ListItemButton onClick={() => onClick(recipe.id)}>
        <ListItemText
          primary={recipe.title}
          secondary={`Servings: ${recipe.servings}`}
        />
      </ListItemButton>
    </ListItem>
  );
}
```

#### 2. Custom Hooks for Logic

Extract complex logic into custom hooks:

```typescript
// BAD
function RecipeDetail({ id }: { id: RecipeId }) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recipeService.getById(id).then(setRecipe).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <CircularProgress />;
  if (!recipe) return <Typography>Not found</Typography>;

  return <RecipeView recipe={recipe} />;
}

// GOOD
import { CircularProgress, Typography, Box } from '@mui/material';

function useRecipe(id: RecipeId) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    recipeService.getById(id)
      .then((r) => !cancelled && setRecipe(r))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [id]);

  return { recipe, loading, error };
}

function RecipeDetail({ id }: { id: RecipeId }) {
  const { recipe, loading, error } = useRecipe(id);

  if (loading) return <CircularProgress />;
  if (error) return <Typography>Error loading recipe</Typography>;
  if (!recipe) return <Typography>Recipe not found</Typography>;

  return <RecipeView recipe={recipe} />;
}
```

#### 3. Memoization for Performance

Use `memo`, `useMemo`, `useCallback` deliberately:

```typescript
import { List } from '@mui/material';
import { useRouter } from 'next/navigation';

// When component re-renders frequently but props rarely change
export const RecipeCard = memo(function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <ListItem disablePadding>
      <ListItemButton onClick={() => onClick(recipe.id)}>
        <ListItemText primary={recipe.title} />
      </ListItemButton>
    </ListItem>
  );
});

// When computing expensive values
function RecipeList({ recipes }: { recipes: Recipe[] }) {
  const sortedRecipes = useMemo(
    () => recipes.sort((a, b) => b.last_cooked_at - a.last_cooked_at),
    [recipes]
  );

  return (
    <List>
      {sortedRecipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} onClick={handleClick} />
      ))}
    </List>
  );
}

// When passing callbacks to child components
function RecipeList({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();

  const handleClick = useCallback(
    (id: RecipeId) => router.push(`/recipes/${id}`),
    [router]
  );

  return (
    <List>
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} onClick={handleClick} />
      ))}
    </List>
  );
}
```

#### 4. Compound Components

For complex UI with shared state:

```typescript
interface RecipeFormContextValue {
  values: RecipeFormValues;
  errors: RecipeFormErrors;
  setValue: (field: string, value: any) => void;
}

const RecipeFormContext = createContext<RecipeFormContextValue | null>(null);

function useRecipeForm() {
  const context = useContext(RecipeFormContext);
  if (!context) throw new Error('useRecipeForm must be used within RecipeForm');
  return context;
}

export function RecipeForm({ children, onSubmit }: RecipeFormProps) {
  const [values, setValues] = useState<RecipeFormValues>(initialValues);
  const [errors, setErrors] = useState<RecipeFormErrors>({});

  const setValue = useCallback((field: string, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <RecipeFormContext.Provider value={{ values, errors, setValue }}>
      <form onSubmit={onSubmit}>{children}</form>
    </RecipeFormContext.Provider>
  );
}

RecipeForm.Title = function RecipeFormTitle() {
  const { values, errors, setValue } = useRecipeForm();
  return (
    <TextField
      label="Recipe Title"
      value={values.title}
      onChange={(e) => setValue('title', e.target.value)}
      error={!!errors.title}
      helperText={errors.title}
      fullWidth
    />
  );
};

RecipeForm.Servings = function RecipeFormServings() {
  const { values, setValue } = useRecipeForm();
  return (
    <TextField
      label="Servings"
      type="number"
      value={values.servings}
      onChange={(e) => setValue('servings', Number(e.target.value))}
      fullWidth
    />
  );
};

// Usage
<RecipeForm onSubmit={handleSubmit}>
  <RecipeForm.Title />
  <RecipeForm.Servings />
</RecipeForm>
```

#### 5. Error Boundaries

```typescript
// apps/web/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Log to Sentry
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ? this.props.fallback(this.state.error) : <DefaultErrorView />;
    }
    return this.props.children;
  }
}
```

---

## Database Patterns

### Migration Guidelines

#### 1. Naming Conventions

```
supabase/migrations/
  001_initial_schema.sql
  002_rls_policies.sql
  003_add_recipe_forks.sql
  004_add_search_tsvector.sql
```

Format: `{number}_{descriptive_name}.sql`

#### 2. Idempotent Migrations

Always write migrations that can be run multiple times safely:

```sql
-- BAD
CREATE TABLE recipes ( ... );

-- GOOD
CREATE TABLE IF NOT EXISTS recipes ( ... );

-- BAD
ALTER TABLE recipes ADD COLUMN tags TEXT[];

-- GOOD
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'tags'
  ) THEN
    ALTER TABLE recipes ADD COLUMN tags TEXT[];
  END IF;
END $$;
```

#### 3. Down Migrations

Always provide a way to rollback:

```sql
-- Up migration (003_add_recipe_forks.sql)
CREATE TABLE IF NOT EXISTS recipe_forks (
  parent_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  child_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  forked_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  forked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (parent_recipe_id, child_recipe_id)
);

-- Down migration (003_add_recipe_forks_down.sql)
DROP TABLE IF EXISTS recipe_forks;
```

#### 4. RLS Policy Patterns

```sql
-- Helper function for household access
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their household's recipes
CREATE POLICY recipes_household_isolation ON recipes
  FOR ALL
  USING (household_id = get_user_household_id());

-- Policy: Admin-only operations
CREATE POLICY household_members_admin_only ON household_members
  FOR INSERT
  WITH CHECK (
    household_id = get_user_household_id() AND
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'admin'
    )
  );

-- Policy: Insert-only for immutable tables
CREATE POLICY recipe_versions_insert_only ON recipe_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_versions.recipe_id
        AND r.household_id = get_user_household_id()
    )
  );
```

#### 5. Indexes

```sql
-- Household isolation (most queries filter by household_id)
CREATE INDEX idx_recipes_household ON recipes(household_id);
CREATE INDEX idx_calendar_entries_household ON calendar_entries(household_id);

-- Foreign keys (Postgres doesn't auto-index FKs)
CREATE INDEX idx_recipe_versions_recipe ON recipe_versions(recipe_id);
CREATE INDEX idx_cooking_events_recipe ON cooking_events(recipe_id);

-- Common queries
CREATE INDEX idx_recipes_last_cooked ON recipes(household_id, last_cooked_at DESC NULLS LAST);
CREATE INDEX idx_calendar_entries_date ON calendar_entries(household_id, planned_date);

-- Full-text search
CREATE INDEX idx_recipes_search ON recipes USING GIN(search_vector);
```

#### 6. Transactions

Always use transactions for multi-step operations:

```sql
-- Database function example
CREATE OR REPLACE FUNCTION create_recipe_with_version(
  p_household_id UUID,
  p_title TEXT,
  p_ingredients_json JSONB,
  p_steps_json JSONB,
  p_servings INT,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_recipe_id UUID;
  v_version_id UUID;
BEGIN
  v_recipe_id := gen_random_uuid();
  v_version_id := gen_random_uuid();

  -- Insert recipe
  INSERT INTO recipes (id, household_id, title, current_version_id, created_by)
  VALUES (v_recipe_id, p_household_id, p_title, v_version_id, p_user_id);

  -- Insert initial version
  INSERT INTO recipe_versions (
    id, recipe_id, version_number,
    ingredients_json, steps_json, servings,
    created_by
  ) VALUES (
    v_version_id, v_recipe_id, 1,
    p_ingredients_json, p_steps_json, p_servings,
    p_user_id
  );

  RETURN v_recipe_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Error Handling Conventions

### Error Types

```typescript
// packages/types/src/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
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
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'CONFLICT', 409, metadata);
  }
}

export class SyncError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'SYNC_ERROR', 500, metadata);
  }
}
```

### Service Error Handling

```typescript
// packages/api-client/src/services/RecipeService.ts

export class RecipeService {
  async getById(id: RecipeId): Promise<Recipe> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('Recipe', id);

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;

      // Log unexpected errors
      console.error('RecipeService.getById failed:', error);
      throw new AppError('Failed to fetch recipe', 'FETCH_ERROR', 500, { id });
    }
  }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    try {
      const validated = CreateRecipeSchema.parse(input);

      const { data, error } = await supabase.rpc('create_recipe_with_version', {
        p_household_id: getCurrentHouseholdId(),
        p_title: validated.title,
        p_ingredients_json: validated.ingredients,
        p_steps_json: validated.steps,
        p_servings: validated.servings,
        p_user_id: getCurrentUserId(),
      });

      if (error) throw error;

      return data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid recipe data', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('RecipeService.create failed:', error);
      throw new AppError('Failed to create recipe', 'CREATE_ERROR');
    }
  }
}
```

### Component Error Handling

```typescript
// apps/web/app/(dashboard)/recipes/[id]/page.tsx

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const { recipe, loading, error } = useRecipe(params.id as RecipeId);

  if (loading) return <RecipeDetailSkeleton />;

  if (error) {
    if (error instanceof NotFoundError) {
      return <NotFoundView message="Recipe not found" />;
    }
    if (error instanceof UnauthorizedError) {
      redirect('/login');
    }
    return <ErrorView error={error} retry={() => window.location.reload()} />;
  }

  return <RecipeView recipe={recipe!} />;
}
```

### Edge Function Error Handling

```typescript
// supabase/functions/recipe-import/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const { url } = ImportUrlSchema.parse(body);

    // Fetch and parse recipe
    const recipe = await fetchAndParseRecipe(url);

    return new Response(
      JSON.stringify({ data: recipe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('recipe-import error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Icon Libraries (No Emojis)

### Material Icons (Required)

Use **@mui/icons-material** - aligned with Material Design 3:

```typescript
import {
  Coffee,
  WbSunny,
  NightsStay,
  Cookie,
  Restaurant,
  CalendarToday
} from '@mui/icons-material';

function MealIcon({ slot }: { slot: MealSlot }) {
  switch (slot) {
    case 'breakfast': return <Coffee />;
    case 'lunch': return <WbSunny />;
    case 'dinner': return <NightsStay />;
    case 'snack': return <Cookie />;
  }
}
```

### Icon Naming Convention

Always import with descriptive names:

```typescript
// BAD
import { Icon1, Icon2 } from '@mui/icons-material';

// GOOD
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as ConfirmIcon,
  Close as CloseIcon
} from '@mui/icons-material';
```

### Icon Usage Rules (DESIGN_SYSTEM.md)
- **Prefer text over icons**: Never use icon-only primary actions
- **Icon-only buttons are forbidden** for primary actions
- Icons can be used for secondary actions or as decorative elements
- All icons must come from @mui/icons-material (no custom SVGs in MVP)

---

## File Naming Conventions

- **Components**: PascalCase - `RecipeCard.tsx`, `CalendarView.tsx`
- **Hooks**: camelCase with `use` prefix - `useRecipe.ts`, `useSync.ts`
- **Services**: PascalCase - `RecipeService.ts`, `SyncEngine.ts`
- **Utils**: camelCase - `unitConversion.ts`, `dateHelpers.ts`
- **Types**: PascalCase - `Recipe.ts`, `SyncState.ts`
- **Tests**: Same as file + `.test.ts` - `RecipeService.test.ts`, `useRecipe.test.ts`

---

## Testing Patterns

### Service Tests

```typescript
// packages/api-client/src/services/RecipeService.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipeService } from './RecipeService';
import { supabase } from '../supabase';

vi.mock('../supabase');

describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    service = new RecipeService();
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should return recipe when found', async () => {
      const mockRecipe = { id: '123', title: 'Pasta' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
      } as any);

      const result = await service.getById('123' as RecipeId);

      expect(result).toEqual(mockRecipe);
    });

    it('should throw NotFoundError when recipe does not exist', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      await expect(service.getById('999' as RecipeId)).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Hook Tests

```typescript
// apps/web/hooks/useRecipe.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRecipe } from './useRecipe';
import { RecipeService } from '@commontable/api-client';

vi.mock('@commontable/api-client');

describe('useRecipe', () => {
  it('should load recipe on mount', async () => {
    const mockRecipe = { id: '123', title: 'Pasta' };
    vi.mocked(RecipeService.prototype.getById).mockResolvedValue(mockRecipe);

    const { result } = renderHook(() => useRecipe('123' as RecipeId));

    expect(result.current.loading).toBe(true);
    expect(result.current.recipe).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.recipe).toEqual(mockRecipe);
    });
  });

  it('should handle errors', async () => {
    const error = new NotFoundError('Recipe', '999');
    vi.mocked(RecipeService.prototype.getById).mockRejectedValue(error);

    const { result } = renderHook(() => useRecipe('999' as RecipeId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(error);
    });
  });
});
```

### Integration Tests (Edge Functions)

```typescript
// supabase/functions/recipe-import/recipe-import.test.ts

import { describe, it, expect } from 'vitest';
import { serve } from './index.ts';

describe('recipe-import Edge Function', () => {
  it('should return 401 without auth header', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/recipe' }),
    });

    const response = await serve(req);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('authorization');
  });

  it('should return 400 for invalid URL', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-token' },
      body: JSON.stringify({ url: 'not-a-url' }),
    });

    const response = await serve(req);

    expect(response.status).toBe(400);
  });
});
```

---

## Commit Message Format

Use Conventional Commits:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `test`: Adding tests (TDD red/green commits)
- `refactor`: Code refactoring (TDD refactor commits)
- `docs`: Documentation
- `chore`: Tooling, dependencies

**Examples**:
```
test(recipe-service): add failing test for create recipe with version

feat(recipe-service): implement create recipe with version transaction

refactor(recipe-service): extract version creation into helper method

fix(sync-engine): handle concurrent edit conflicts correctly

test(sync-engine): add test for concurrent edit conflict resolution
```

---

## Code Review Checklist

Before submitting PR:

**TDD & Testing**:
- [ ] All tests written BEFORE implementation (TDD)
- [ ] All tests passing
- [ ] Test coverage meets requirements (services 100%, components 80%+)

**TypeScript**:
- [ ] No `any` types (use `unknown` if needed)
- [ ] TypeScript strict mode compliance
- [ ] Zod schemas for validation
- [ ] Discriminated unions for complex states
- [ ] Readonly types where applicable

**MUI & Design System**:
- [ ] Only approved MUI components used (see DESIGN_SYSTEM.md)
- [ ] Only allowed button variants (3 variants only)
- [ ] Only allowed typography variants (h5, h6, body1, body2)
- [ ] Only allowed spacing values (4, 8, 16, 24, 32, 48)
- [ ] No custom colors (theme palette only)
- [ ] Elevation ≤ 2
- [ ] No emojis anywhere
- [ ] Material Icons (@mui/icons-material) used for icons
- [ ] Max 1 primary button per screen
- [ ] Content tone is calm and neutral

**Database**:
- [ ] Migrations are idempotent
- [ ] RLS policies tested
- [ ] Proper indexes on foreign keys and common queries

**Code Quality**:
- [ ] Error handling implemented
- [ ] No console.log (use proper logging)
- [ ] Custom hooks for complex logic
- [ ] Memoization used where appropriate

---

## Environment Setup

### Required Environment Variables

CommonTable requires Supabase credentials configured via environment variables.

#### 1. Create Local Environment File

Copy the example file:
```bash
cd apps/web
cp .env.example .env.local
```

#### 2. Configure Supabase Credentials

Get your credentials from [Supabase Dashboard](https://app.supabase.com/project/_/settings/api):

```env
# apps/web/.env.local

# Public URL (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Anonymous Key (safe to expose, RLS enforced)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key

# Service Role Key (SERVER ONLY - never expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

⚠️ **Security Warning**:
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` is SERVER-ONLY and bypasses Row Level Security
- Never commit `.env.local` to version control

#### 3. Client vs Server Usage

**Browser/Client Components** (`apps/web/lib/supabase/client.ts`):
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient(); // Uses anon key, RLS enforced
```

**Server Components/Actions** (`apps/web/lib/supabase/server.ts`):
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient(); // Uses anon key with cookies, RLS enforced
```

**Admin Operations** (use sparingly):
```typescript
import { createAdminClient } from '@/lib/supabase/server';

const supabaseAdmin = createAdminClient(); // Uses service role, bypasses RLS
```

#### 4. Environment-Specific Configuration

**Development**: Use `.env.development.example` as template
**Production**: Use `.env.production.example` as template

Set environment variables in your deployment platform (Vercel, Netlify, etc.).

### Environment Validation

The app validates required environment variables at startup using Zod schemas (`packages/api-client/src/env.ts`). Missing or invalid variables will throw errors during build/runtime.

---

## Development Workflow

### 1. Start New Feature

```bash
# Create feature branch
git checkout -b feat/recipe-versioning

# Write failing test first
# RED: test fails
pnpm test

# Implement minimal code
# GREEN: test passes
pnpm test

# Refactor
# GREEN: test still passes
pnpm test

# Commit using conventional commits
git commit -m "test(recipe): add failing test for version creation"
git commit -m "feat(recipe): implement version creation"
git commit -m "refactor(recipe): extract version helper"
```

### 2. Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test RecipeService.test.ts
```

### 3. Type Checking

```bash
# Type check all packages
pnpm type-check

# Type check specific package
pnpm --filter @commontable/api-client type-check
```

### 4. Linting

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix
```

---

## Critical Principles Summary

1. **TDD is non-negotiable**: RED → GREEN → REFACTOR
2. **Design system is strict**: Follow DESIGN_SYSTEM.md exactly (MUI only, 3 button variants, 4 typography variants, specific spacing)
3. **Types are documentation**: Use strict TypeScript, no `any`
4. **Errors are typed**: Use custom error classes, never generic `Error`
5. **Immutability by default**: Use `readonly`, avoid mutations
6. **Test coverage is mandatory**: Aim for 100% on services and utils
7. **No emojis**: Use Material Icons (@mui/icons-material)
8. **Content is calm**: No jokes, no playful language, neutral tone
9. **Database migrations are idempotent**: Can be run multiple times safely
10. **RLS policies enforce security**: Never bypass with service role client-side
11. **MUI sx prop only**: No custom CSS, no Tailwind, use theme tokens
12. **Lists are primary pattern**: Most content in List components, tables forbidden in MVP

---

## Questions?

Refer to:
- [Implementation Plan](/Users/colinrodrigues/.claude/plans/misty-drifting-giraffe.md)
- [Architecture Document](Technical Architecture Plan.md)
- Linear Issues for detailed task breakdown

Happy coding!
