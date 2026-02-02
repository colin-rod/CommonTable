# CommonTable - Claude Development Guide

## Global Skills Enforcement (MANDATORY)

**CRITICAL**: This project activates and enforces **global skills** installed at `~/.agents/skills/`. These skills are **BINDING** and take precedence over default behaviors. Violations will be called out immediately.

### Active Global Skills

#### 1. **test-driven-development** (NON-NEGOTIABLE)

- **Location**: `~/.agents/skills/test-driven-development/`
- **Iron Law**: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
- **Enforcement**:
  - ALWAYS write failing test before implementation
  - Watch test fail with correct error message
  - Write minimal code to pass the test
  - Refactor while keeping tests green
  - If code written before test → DELETE and start over
- **Applies to**: ALL features, bug fixes, refactoring

#### 2. **systematic-debugging** (MANDATORY FOR ALL ISSUES)

- **Location**: `~/.agents/skills/systematic-debugging/`
- **Iron Law**: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
- **Enforcement**:
  - Phase 1: Root cause investigation (read errors, reproduce, trace data flow)
  - Phase 2: Pattern analysis (find working examples, compare differences)
  - Phase 3: Hypothesis testing (one change at a time)
  - Phase 4: Implementation (create failing test, fix, verify)
  - If 3+ fixes failed → STOP and question architecture
- **Applies to**: ALL bugs, test failures, unexpected behavior

#### 3. **verification-before-completion** (ALWAYS REQUIRED)

- **Location**: `~/.agents/skills/verification-before-completion/`
- **Iron Law**: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
- **Enforcement**:
  - BEFORE claiming "done", "fixed", "passing" → run verification command
  - Show fresh output from current conversation turn
  - No "should work", "probably passes", or similar hedging
  - Evidence first, claims second
- **Applies to**: ALL completion claims, commits, PRs, task handoffs

#### 4. **vercel-react-best-practices** (AUTO-INVOKED)

- **Location**: `~/.agents/skills/vercel-react-best-practices/`
- **Enforcement**: 45 performance optimization rules across 8 categories
- **Priority Rules**:
  - CRITICAL: Eliminate waterfalls (parallel data fetching)
  - CRITICAL: Avoid barrel imports (import directly from source)
  - HIGH: Use React.cache() for server-side deduplication
  - MEDIUM: Optimize re-renders (memo, useMemo, useCallback)
- **Applies to**: ALL React/Next.js code in `apps/web/`

#### 5. **react-native-best-practices** (FOR PHASE 2)

- **Location**: `~/.agents/skills/react-native-best-practices/`
- **Enforcement**: FPS optimization, bundle size, TTI, native performance
- **Applies to**: React Native/Expo mobile app (deferred to Phase 2)

#### 6. **ui-ux-pro-max** (DESIGN SYSTEM ALIGNMENT)

- **Location**: `~/.agents/skills/ui-ux-pro-max/`
- **Enforcement**:
  - Accessibility CRITICAL (color contrast 4.5:1, touch targets 44x44px)
  - Focus states visible, keyboard navigation
  - Image optimization, reduced motion support
- **Applies to**: ALL UI/UX design work (aligns with DESIGN_SYSTEM.md)

#### 7. **copywriting** (CONTENT TONE)

- **Location**: `~/.agents/skills/copywriting/`
- **Enforcement**:
  - Clarity over cleverness
  - Benefits over features
  - Specificity over vagueness
  - Customer language over company language
- **Alignment**: Reinforces CommonTable's "calm, neutral, practical" tone
- **Applies to**: Error messages, form labels, page titles, help text

#### 8. **executing-plans** (WORKFLOW MANAGEMENT)

- **Location**: `~/.agents/skills/executing-plans/`
- **Enforcement**:
  - Load plan → Review critically → Execute batch (3 tasks) → Report → Continue
  - STOP when blocked (don't guess)
  - Use TodoWrite to track progress
- **Applies to**: Implementation of written plans with review checkpoints

### Conflict Resolution Hierarchy

When skills or requirements conflict:

1. **Iron Laws (TDD, Debugging, Verification)**: ALWAYS enforced (non-negotiable)
2. **DESIGN_SYSTEM.md**: Overrides general UI/UX advice (project-specific)
3. **CLAUDE.md (this file)**: Project-specific rules override generic best practices
4. **Global skills**: Applied when not in conflict with #1-3

### Skill Conflict Examples

**BLOCKED (violates iron laws)**:

- ❌ "Skip TDD for this quick fix" → Violates test-driven-development
- ❌ "Just try this fix without investigating" → Violates systematic-debugging
- ❌ "Should work now" (without running tests) → Violates verification-before-completion

**BLOCKED (violates DESIGN_SYSTEM.md)**:

- ❌ "Use a playful font instead of Roboto" → Violates Material Design 3 constraints
- ❌ "Add emoji to error messages" → Violates DESIGN_SYSTEM.md + copywriting skill
- ❌ "Use purple gradients" → Violates project aesthetic guidelines

**SUGGESTED (best practices)**:

- ✅ "Use barrel imports for cleaner code" → Suggest direct imports (React best practices)
- ✅ "Add more typography variants" → Suggest staying within allowed 4 variants

### Proactive Skill Invocation

The following skills are invoked AUTOMATICALLY without explicit request:

- ✅ Writing React components → `vercel-react-best-practices` (check waterfalls, barrel imports)
- ✅ Implementing features → `test-driven-development` (failing test first)
- ✅ Debugging issues → `systematic-debugging` (root cause investigation)
- ✅ About to say "done" → `verification-before-completion` (run tests, show output)
- ✅ Designing UI → `ui-ux-pro-max` (accessibility checklist)
- ✅ Writing copy → `copywriting` (clarity, benefits, customer language)
- ✅ Executing a plan → `executing-plans` (batch execution with checkpoints)

---

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
      steps: [{ position: 1, text: 'Boil pasta' }],
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

  private async insertRecipe(tx, id, data, versionId) {
    /* ... */
  }
  private async createInitialVersion(tx, recipeId, versionId, data) {
    /* ... */
  }
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
function getRecipe(id: string): Promise<Recipe> {}

// GOOD
type RecipeId = string & { __brand: 'RecipeId' };
type UserId = string & { __brand: 'UserId' };

function getRecipe(id: RecipeId): Promise<Recipe> {}

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
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().positive().optional(),
        unit: z.string().optional(),
      }),
    )
    .min(1),
  steps: z
    .array(
      z.object({
        position: z.number().int().positive(),
        text: z.string().min(1),
      }),
    )
    .min(1),
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
      main: '#1976d2', // Material Blue
    },
    background: {
      default: '#fafafa', // Warm neutral, not pure white
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
          textTransform: 'none', // No ALL CAPS
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

## Favorites Feature

### Overview

CommonTable implements a **household-level favorites** system that allows all household members to mark recipes as favorites. Unlike per-user favorites, this design promotes shared household preferences and simplifies the collaborative recipe management experience.

### Architecture Decision: Household-Level vs Per-User

**Decision**: Household-level favorites (single `is_favorite` boolean on `recipes` table)

**Rationale**:

- Simpler schema (no junction table needed)
- All household members see the same favorites
- Lower database overhead
- Faster queries (no joins required)
- Aligns with shared household recipe book philosophy
- Easier querying and filtering

**Trade-offs**:

- Cannot track individual user preferences
- All household members share the same favorites list
- Less personalization per user

### Database Schema

```sql
-- Migration: supabase/migrations/20260116000005_add_recipe_favorite.sql

-- Add is_favorite column with default false
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Create partial index for efficient filtering of favorites within a household
CREATE INDEX IF NOT EXISTS idx_recipes_favorite
ON recipes(household_id, is_favorite)
WHERE is_favorite = true;
```

**Key Design Points**:

- `is_favorite` is a boolean flag on the `recipes` table
- Default value is `false`
- Partial index optimizes filtering (`WHERE is_favorite = true`)
- RLS policies enforce household isolation (users can only toggle favorites on their household's recipes)

### Service Layer

**RecipeService.toggleFavorite()**

Location: [packages/api-client/src/services/RecipeService.ts:367-388](packages/api-client/src/services/RecipeService.ts#L367-L388)

```typescript
/**
 * Toggle the favorite status of a recipe
 *
 * @param id - Recipe ID
 * @returns Updated recipe with toggled favorite status
 * @throws {NotFoundError} If recipe does not exist
 * @throws {AppError} If database operation fails
 */
async toggleFavorite(id: RecipeId): Promise<Recipe> {
  try {
    // Get current recipe to check is_favorite status
    const existing = await this.getById(id);

    // Toggle the favorite status
    const { error: updateError } = await this.supabase
      .from('recipes')
      .update({ is_favorite: !existing.is_favorite })
      .eq('id', id);

    if (updateError) throw updateError;

    // Return updated recipe
    return await this.getById(id);
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error('RecipeService.toggleFavorite failed:', error);
    throw new AppError('Failed to toggle favorite', 'UPDATE_ERROR', 500, { id });
  }
}
```

**Implementation Notes**:

- Atomically toggles the `is_favorite` flag
- Fetches current state first to ensure correct toggle operation
- Returns updated recipe after toggle
- Proper error handling with custom error types
- 100% test coverage

### Client Hooks

**useRecipes Hook**

Location: [apps/web/hooks/useRecipes.ts:59-72](apps/web/hooks/useRecipes.ts#L59-L72)

```typescript
/**
 * Toggle favorite status of a recipe
 */
const toggleFavorite = useCallback(
  async (recipeId: RecipeId) => {
    try {
      const updatedRecipe = await recipeService.toggleFavorite(recipeId);

      // Update local state optimistically
      setRecipes((prev) => prev.map((r) => (r.id === recipeId ? updatedRecipe : r)));
    } catch (err) {
      console.error('useRecipes.toggleFavorite failed:', err);
      throw err;
    }
  },
  [recipeService],
);
```

**Features**:

- Optimistic UI updates (star toggles immediately)
- Local state management
- Error propagation for error handling

**useRecipeFilters Hook**

Location: [apps/web/hooks/useRecipeFilters.ts:29-32](apps/web/hooks/useRecipeFilters.ts#L29-L32)

```typescript
// Apply favorites filter
if (showFavoritesOnly) {
  filtered = filtered.filter((recipe) => recipe.is_favorite);
}
```

**Features**:

- Client-side filtering by `is_favorite` flag
- Combines with tag filters (AND logic)
- Works with all sort options

### UI Components

**RecipeListItem Component**

Location: [apps/web/components/recipe/RecipeListItem.tsx:34-37,62-72](apps/web/components/recipe/RecipeListItem.tsx#L34-L37)

```typescript
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material';

// Star icon toggle (filled/unfilled based on is_favorite)
<IconButton
  onClick={(e) => {
    e.stopPropagation(); // Don't navigate when clicking star
    onToggleFavorite(recipe.id);
  }}
  aria-label={recipe.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
>
  {recipe.is_favorite ? <StarIcon /> : <StarBorderIcon />}
</IconButton>
```

**Features**:

- Material Icons (Star/StarBorder)
- Event propagation stopped (clicking star doesn't navigate)
- Accessible aria-labels
- Follows Design System (no custom colors)

**RecipeFilterBar Component**

Location: [apps/web/components/recipes/RecipeFilterBar.tsx:26,91-99](apps/web/components/recipes/RecipeFilterBar.tsx#L26)

```typescript
{/* Favorites Toggle */}
<FormControlLabel
  control={
    <Checkbox
      checked={showFavoritesOnly}
      onChange={(e) => onFavoritesToggle(e.target.checked)}
    />
  }
  label="Favorites only"
/>
```

**Features**:

- Simple checkbox toggle
- Clear label ("Favorites only")
- Material UI FormControlLabel for accessibility

### Server Actions

**toggleRecipeFavorite Action**

Location: [apps/web/app/actions/recipe.ts:292-306](apps/web/app/actions/recipe.ts#L292-L306)

```typescript
/**
 * Toggle the favorite status of a recipe
 *
 * @param id - Recipe ID
 * @returns Updated recipe or error
 */
export async function toggleRecipeFavorite(id: RecipeId): Promise<ActionResult<Recipe>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    const recipe = await service.toggleFavorite(id);

    revalidatePath(`/recipes/${id}`);
    revalidatePath('/recipes');

    return { success: true, data: recipe };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}
```

**Features**:

- Calls `RecipeService.toggleFavorite()`
- Revalidates recipe detail page (`/recipes/[id]`)
- Revalidates recipe list page (`/recipes`)
- Error formatting for UI display

### Testing

**Service Layer** (100% Coverage)

- [packages/api-client/src/services/RecipeService.test.ts:1029-1115](packages/api-client/src/services/RecipeService.test.ts#L1029-L1115)
- Tests toggle from `false` to `true`
- Tests toggle from `true` to `false`
- Tests `NotFoundError` for non-existent recipe

**Hooks** (100% Coverage)

- [apps/web/hooks/useRecipes.test.ts:211-288](apps/web/hooks/useRecipes.test.ts#L211-L288)
- Tests optimistic UI updates
- Tests error handling
- [apps/web/hooks/useRecipeFilters.test.ts:99-165](apps/web/hooks/useRecipeFilters.test.ts#L99-L165)
- Tests favorites filtering
- Tests combined filters (favorites + tags)

**UI Components** (100% Coverage)

- [apps/web/components/recipe/RecipeListItem.test.tsx:64-77,172-192](apps/web/components/recipe/RecipeListItem.test.tsx#L64-L77)
- Tests star icon rendering (filled/unfilled)
- Tests toggle callback
- Tests event propagation prevention
- [apps/web/components/recipes/RecipeFilterBar.test.tsx](apps/web/components/recipes/RecipeFilterBar.test.tsx)
- Tests checkbox rendering
- Tests toggle callback
- Tests accessibility
- [apps/web/components/recipe/RecipeList.test.tsx:131-140,181-194](apps/web/components/recipe/RecipeList.test.tsx#L131-L140)
- Tests integration with RecipeListItem

### User Flows

**Toggle Favorite**:

1. User clicks star icon on recipe list item
2. `RecipeListItem` calls `onToggleFavorite(recipeId)`
3. `useRecipes` hook calls `RecipeService.toggleFavorite()`
4. Service updates database (`is_favorite = !existing.is_favorite`)
5. Local state updated optimistically
6. Star icon toggles immediately (filled ↔ unfilled)

**Filter by Favorites**:

1. User clicks "Favorites only" checkbox in `RecipeFilterBar`
2. `onFavoritesToggle(true)` callback fires
3. `useRecipeFilters` filters recipes by `is_favorite === true`
4. Recipe list updates to show only favorited recipes

**Combined Filters**:

1. User selects tags (e.g., "pasta", "italian")
2. User clicks "Favorites only"
3. `useRecipeFilters` applies AND logic:
   - Recipe must have ALL selected tags
   - Recipe must have `is_favorite === true`
4. Recipes matching ALL criteria are displayed

### Design System Compliance

**Material Icons** ✅

- `Star` (filled): Favorite recipes
- `StarBorder` (unfilled): Non-favorite recipes

**Button Variants** ✅

- Icon-only button for secondary action (favorite toggle)
- Not a primary action (primary actions require text)

**Typography** ✅

- "Favorites only" label uses body1 variant
- Calm, neutral tone (no emojis)

**Spacing** ✅

- Follows 8px base grid
- Proper padding and margins

**Accessibility** ✅

- `aria-label` on star button ("Add to favorites" / "Remove from favorites")
- Checkbox label for "Favorites only"
- Keyboard navigation supported

### Performance Optimizations

**Partial Index**:

```sql
CREATE INDEX idx_recipes_favorite
ON recipes(household_id, is_favorite)
WHERE is_favorite = true;
```

- Only indexes favorite recipes (smaller index)
- Faster filtering when `showFavoritesOnly = true`
- Efficient for large recipe collections

**Optimistic Updates**:

- UI updates immediately without waiting for database response
- Better perceived performance
- Error handling reverts state if toggle fails

**Client-Side Filtering**:

- No additional database queries when filtering
- All recipes loaded once, filtered in memory
- Fast filter interactions

### Future Enhancements

**Per-User Favorites** (Not in MVP):

- Create `recipe_favorites` junction table (`user_id`, `recipe_id`)
- Add RLS policies for per-user access
- Update UI to show "favorited by N people"
- Add "My favorites" vs "Household favorites" views

**Favorite Analytics** (Not in MVP):

- Track favorite count per recipe
- Surface most-favorited recipes
- Use favorites as signal for recipe recommendations

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

## Email Verification and Password Reset

### Email Confirmations

**Email confirmations are ENABLED** in `supabase/config.toml`. Users must verify their email address before signing in.

#### Configuration

```toml
# supabase/config.toml (line 173)
enable_confirmations = true
```

#### Email Flow

1. **User signs up** - Account created, verification email sent
2. **Verification email sent** - User receives email with confirmation link
3. **User clicks link** - Redirected to `/auth/confirm`
4. **Email confirmed** - Supabase automatically exchanges token for session
5. **Redirected to dashboard** - User can now access the app

#### Custom Email Templates

Custom HTML email templates are configured in `supabase/templates/`:

**Confirmation Email** (`supabase/templates/confirm.html`):

- Subject: "Confirm your CommonTable account"
- Material Design 3 styling (calm, neutral tone)
- Single CTA button: "Confirm Email"
- Expires in 1 hour

**Password Reset Email** (`supabase/templates/reset_password.html`):

- Subject: "Reset your CommonTable password"
- Material Design 3 styling
- Single CTA button: "Reset Password"
- Expires in 1 hour

**Template Requirements**:

- Responsive HTML/CSS
- Material Design 3 color palette (#1976d2 primary)
- Calm, neutral tone (no emojis)
- Plain text alternative (not yet implemented in MVP)

#### Email Verification Components

**EmailConfirmation Component** (`apps/web/components/auth/EmailConfirmation.tsx`):

- Displays verification status (verifying, success, error)
- Auto-redirects to dashboard on success (2 seconds)
- Error handling for expired/invalid tokens
- Material Design 3 compliant

**Email Confirmation Page** (`apps/web/app/auth/confirm/page.tsx`):

- Server component that receives error params from Supabase
- Passes error to EmailConfirmation client component
- Token exchange handled automatically by Supabase Auth

#### Resend Verification Email

**ResendVerificationForm Component** (`apps/web/components/auth/ResendVerificationForm.tsx`):

- Allows users to request a new verification email
- Email validation with Zod
- Shows success message after sending
- Material Design 3 compliant

**AuthService Method**:

```typescript
async resendVerificationEmail(email: string): Promise<void> {
  const EmailSchema = z.string().email();
  const validated = this.validate(EmailSchema, email, 'Invalid email format');

  const { error } = await this.supabase.auth.resend({
    type: 'signup',
    email: validated,
  });

  if (error) {
    throw new EmailVerificationError(error.message);
  }
}
```

#### Sign-Up Flow Changes

**Before (email confirmations disabled)**:

- User signs up → Auto-signed in → Redirected to dashboard

**After (email confirmations enabled)**:

- User signs up → Verification message shown → User must verify email before signing in

**SignUpForm Updates**:

- Added `success` prop to show verification message
- Displays: "Account created. Check your email to verify your account."
- No auto-redirect to dashboard

#### Error Handling

**EmailVerificationError** (added to `packages/types/src/errors.ts`):

```typescript
export class EmailVerificationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'EMAIL_VERIFICATION_ERROR', 400, metadata);
  }
}
```

**Error Scenarios**:

1. **Expired Token** - Show "Verification link expired. Request a new one."
2. **Already Verified** - Show "Email already verified. Sign in to continue."
3. **Invalid Token** - Show "Invalid verification link. Contact support."

#### Testing Email Flows Locally

**Inbucket** (local email testing tool):

1. Start Supabase: `pnpm supabase:start`
2. Open Inbucket: http://127.0.0.1:54324
3. Sign up with any email (e.g., `test@example.com`)
4. Check Inbucket for verification email
5. Click verification link to confirm email

**Email Rate Limiting** (local development):

- 2 emails per hour (configured in `supabase/config.toml`)
- Prevents spam during testing
- Production may have different limits

#### Pages and Routes

| Route                       | Purpose                                           |
| --------------------------- | ------------------------------------------------- |
| `/auth/signup`              | User registration with email verification message |
| `/auth/login`               | User login (requires verified email)              |
| `/auth/confirm`             | Email confirmation redirect target                |
| `/auth/resend-verification` | Resend verification email form                    |
| `/auth/forgot-password`     | Request password reset email                      |
| `/auth/reset-password`      | Reset password with email token                   |

#### Password Reset Flow

**Already Implemented** (no changes):

1. User requests reset → Email sent
2. User clicks link → Redirected to `/auth/reset-password`
3. Token validated automatically → User sets new password
4. Password updated → Redirected to login

**Custom Template**: Uses `supabase/templates/reset_password.html`

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
    public metadata?: Record<string, any>,
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
      const { data, error } = await supabase.from('recipes').select('*').eq('id', id).single();

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

### BaseService Helper Methods

All services extend `BaseService` and have access to these protected static helper methods that centralize common patterns:

#### Error Handling

`handleSupabaseError` - Centralized Supabase error handler that maps error codes to typed AppError subclasses:

```typescript
// Centralized error handling replaces verbose try/catch blocks
const { data, error } = await this.supabase
  .from('calendar_entries')
  .select('*')
  .eq('id', id)
  .single();

if (error) {
  BaseService.handleSupabaseError(error, 'CalendarService.getById', { id });
}
if (!data) throw new NotFoundError('CalendarEntry', id);

return BaseService.hydrateDates(data, ['planned_date', 'created_at', 'updated_at']);
```

**Error Code Mapping**:

- `PGRST116` / `PGRST204` → `NotFoundError`
- `23505` (duplicate key) → `ConflictError`
- All other errors → `AppError` with logging

**Before (verbose)**:

```typescript
try {
  const { data, error } = await this.supabase.from('table').select('*').eq('id', id).single();
  if (error) throw error;
  if (!data) throw new NotFoundError('Resource', id);
  return data;
} catch (error) {
  if (error instanceof AppError) throw error;
  console.error('Service.method failed:', error);
  throw new AppError('Failed to fetch resource', 'FETCH_ERROR', 500, { id });
}
```

**After (concise)**:

```typescript
const { data, error } = await this.supabase.from('table').select('*').eq('id', id).single();
if (error) BaseService.handleSupabaseError(error, 'Service.method', { id });
if (!data) throw new NotFoundError('Resource', id);
return data;
```

#### Input Validation

`validateInput` - Zod validation wrapper with consistent error conversion:

```typescript
// Before (7 lines)
try {
  const validated = CreateRecipeSchema.parse(input);
  // Use validated
} catch (error) {
  if (error instanceof z.ZodError) {
    throw new ValidationError('Invalid recipe data', { errors: error.errors });
  }
  throw error;
}

// After (1 line)
const validated = BaseService.validateInput(CreateRecipeSchema, input, 'Invalid recipe data');
```

#### Date Hydration

`hydrateDates` - Convert string date fields to Date objects:

```typescript
// Before (manual field conversion)
return {
  ...entry,
  planned_date: new Date(entry.planned_date),
  created_at: new Date(entry.created_at),
  updated_at: new Date(entry.updated_at),
};

// After (declarative)
return BaseService.hydrateDates(entry, ['planned_date', 'created_at', 'updated_at']);
```

`hydrateDatesArray` - Batch date hydration for arrays:

```typescript
// Before (map with manual conversion)
return (data || []).map((entry) => ({
  ...entry,
  planned_date: new Date(entry.planned_date),
  created_at: new Date(entry.created_at),
  updated_at: new Date(entry.updated_at),
}));

// After (single call)
return BaseService.hydrateDatesArray(data || [], ['planned_date', 'created_at', 'updated_at']);
```

#### Date Serialization

`toDateString` - Convert Date to ISO date string (YYYY-MM-DD format) for database DATE columns:

```typescript
// Before
planned_date: validated.planned_date.toISOString().split('T')[0];

// After
planned_date: BaseService.toDateString(validated.planned_date);
```

**Benefits**:

- Reduces boilerplate by ~30-40% per service
- Consistent error handling across all services
- Type-safe with proper type guards (`unknown` instead of `any`)
- Centralized logging
- Easier to maintain (changes in one place)

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
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate input
    const body = await req.json();
    const { url } = ImportUrlSchema.parse(body);

    // Fetch and parse recipe
    const recipe = await fetchAndParseRecipe(url);

    return new Response(JSON.stringify({ data: recipe }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('recipe-import error:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: error.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
  Close as CloseIcon,
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
      headers: { Authorization: 'Bearer test-token' },
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

**Branch Workflow**:

- Feature branches → PR to `development`
- `development` → PR to `main` (production releases only)

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

#### 2. Configure API Credentials

**Supabase Credentials** (get from [Supabase Dashboard](https://app.supabase.com/project/_/settings/api)):

Go to the "Publishable and secret API keys" tab (NOT the legacy anon/service_role keys):

```env
# apps/web/.env.local

# Public URL (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Publishable Key (safe to expose, RLS enforced)
# Found under "Publishable and secret API keys" tab
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Secret Key (SERVER ONLY - never expose to client, bypasses RLS)
# Found under "Publishable and secret API keys" tab
SUPABASE_SECRET_KEY=sb_secret_...
```

**OpenAI Credentials** (get from [OpenAI Dashboard](https://platform.openai.com/api-keys)):

```env
# OpenAI API Key (for AI-powered features like tag suggestions)
OPENAI_API_KEY=sk-proj-...
```

⚠️ **Security Warning**:

- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SECRET_KEY` is SERVER-ONLY and bypasses Row Level Security
- **NEVER commit `.env.local` to version control** (already in `.gitignore`)
- **NEVER hardcode credentials in `.claude/settings.local.json`** (use environment variables instead)

#### 3. Client vs Server Usage

**Browser/Client Components** (`packages/api-client/src/supabase.ts`):

```typescript
import { createSupabaseClient } from '@commontable/api-client';

const supabase = createSupabaseClient(); // Uses publishable key, RLS enforced
```

**Server-side Admin Operations** (use sparingly, bypasses RLS):

```typescript
import { createSupabaseAdminClient } from '@commontable/api-client';

const supabaseAdmin = createSupabaseAdminClient(); // Uses secret key, bypasses RLS
```

**Note**: This project uses Supabase's **new Publishable/Secret key system**, not the legacy anon/service_role keys.

#### 4. Environment-Specific Configuration

**Development**: Use `.env.development.example` as template
**Production**: Use `.env.production.example` as template

Set environment variables in your deployment platform (Vercel, Netlify, etc.).

### Environment Validation

The app validates required environment variables at startup using Zod schemas (`packages/api-client/src/env.ts`). Missing or invalid variables will throw errors during build/runtime.

### Local Development Infrastructure

**IMPORTANT: This project does NOT use Docker for local development.**

- **Supabase Local Development**: Use the remote Supabase project directly (no local Docker instance)
- **Edge Functions Development**: Deploy and test Edge Functions against the remote Supabase project
- **Database Migrations**: Apply migrations directly to the remote development environment

#### Why No Docker?

This project relies on the Supabase hosted service for development to:

- Avoid Docker dependency and local resource overhead
- Simplify onboarding (no Docker Desktop required)
- Ensure development environment matches production
- Leverage Supabase's managed services (Auth, Storage, Realtime)

#### Edge Functions Development Workflow

Since we don't run Supabase locally, Edge Functions development follows this workflow:

1. **Develop locally** - Write Edge Function code in `supabase/functions/`
2. **Deploy to dev environment** - Test against remote Supabase project
3. **Test via API** - Call deployed function endpoints with curl/Postman
4. **Iterate** - Make changes and redeploy

**Commands:**

```bash
# Deploy Edge Function to development environment
pnpm functions:deploy <function-name>

# View Edge Function logs
supabase functions logs <function-name>

# Test deployed function
curl -X POST https://<project-ref>.supabase.co/functions/v1/<function-name> \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"your": "data"}'
```

**Note:** The `pnpm functions:serve` command will NOT work without Docker. All Edge Function testing must be done against the remote development environment.

---

## Development Workflow

### 1. Start New Feature

```bash
# Create feature branch from development
git checkout development
git pull origin development
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

### Global Skills (Enforced via ~/.agents/skills/)

1. **TDD is non-negotiable** (`test-driven-development`): RED → GREEN → REFACTOR (iron law)
2. **Systematic debugging** (`systematic-debugging`): 4-phase root cause investigation before fixes (iron law)
3. **Verification before completion** (`verification-before-completion`): Evidence before claims, always (iron law)
4. **React performance** (`vercel-react-best-practices`): Eliminate waterfalls, avoid barrel imports, optimize re-renders
5. **Accessibility first** (`ui-ux-pro-max`): Color contrast 4.5:1, touch targets 44x44px, keyboard navigation
6. **Clear copywriting** (`copywriting`): Clarity over cleverness, benefits over features, customer language

### Project-Specific Rules (DESIGN_SYSTEM.md + CLAUDE.md)

7. **Design system is strict**: Follow DESIGN_SYSTEM.md exactly (MUI only, 3 button variants, 4 typography variants, specific spacing)
8. **Types are documentation**: Use strict TypeScript, no `any`
9. **Errors are typed**: Use custom error classes, never generic `Error`
10. **Immutability by default**: Use `readonly`, avoid mutations
11. **Test coverage is mandatory**: Aim for 100% on services and utils
12. **No emojis**: Use Material Icons (@mui/icons-material)
13. **Content is calm**: No jokes, no playful language, neutral tone
14. **Database migrations are idempotent**: Can be run multiple times safely
15. **RLS policies enforce security**: Never bypass with service role client-side
16. **MUI sx prop only**: No custom CSS, no Tailwind, use theme tokens
17. **Lists are primary pattern**: Most content in List components, tables forbidden in MVP

---

## Questions?

Refer to:

- [Implementation Plan](/Users/colinrodrigues/.claude/plans/misty-drifting-giraffe.md)
- [Architecture Document](Technical Architecture Plan.md)
- Linear Issues for detailed task breakdown

Happy coding!
