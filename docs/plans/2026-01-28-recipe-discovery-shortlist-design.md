# Recipe Discovery & Shortlist Design

**Date**: 2026-01-28
**Status**: Approved
**Authors**: Claude + User

## Overview

This design enhances recipe discovery and meal planning by introducing visual recipe cards, smart filtering, and a household-level shortlist system that bridges discovery and calendar planning.

## Problem Statement

Current pain points:

1. **Discovery**: Recipe list is text-only with limited filtering. Hard to find recipes by ingredients, recency, or visual preview.
2. **Meal Planning**: High friction to add recipes to calendar. No way to collect recipes before planning the week.
3. **Visual Context**: No recipe images visible in list view. Users can't quickly identify recipes visually.

## Goals

1. Make recipe discovery more visual and contextual
2. Reduce friction in meal planning workflow
3. Enable "collect now, plan later" behavior via shortlist
4. Improve filtering with ingredient search and recency filters

## Non-Goals (MVP)

- Per-user shortlists (household-level only)
- Batch calendar planning (multi-day assignment)
- Ingredient inventory management
- Automatic recipe suggestions based on shortlist

---

## Design

### 1. Enhanced Recipe Discovery

#### Recipe Card Visual Structure

Replace plain list with grid of rich recipe cards.

**Card Layout:**

```
┌─────────────────────────┐
│   [Recipe Image]        │  ← Primary image thumbnail (or placeholder)
├─────────────────────────┤
│ Recipe Title            │  ← Typography variant="body1"
├─────────────────────────┤
│ ⭐ 4.5 | pasta, quick   │  ← Rating (if exists) + Tags (first 2-3)
│ Last cooked: 3 days ago │  ← Last cooked date or "Never cooked"
├─────────────────────────┤
│ [Add to Shortlist] ⭐   │  ← Button (outlined, changes to "Added ✓")
└─────────────────────────┘
```

**Grid Behavior:**

- Responsive: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)
- Infinite scroll: Load more recipes as user scrolls
- Click card → Navigate to recipe detail page
- Click "Add to Shortlist" → Adds to shortlist, button shows "Added ✓"

**Image Handling:**

- Query `recipe_images` table for primary image (`is_primary = true`)
- Fallback: First image by `display_order`
- Fallback: Placeholder image if no images exist
- Use `RecipeImageService.getPublicUrl()` for signed URLs
- Lazy load images for performance

---

### 2. "What Can I Cook?" Filter Panel

Collapsible panel above recipe grid with contextual filters.

**Panel Structure:**

```
┌─────────────────────────────────────────────────┐
│ ▼ What can I cook?                              │  ← Collapsible header (h6)
├─────────────────────────────────────────────────┤
│ Ingredient Search: [_______________] 🔍         │  ← TextField
│                                                  │
│ ☐ Haven't made in 30+ days                     │  ← Checkbox
│ ☐ New recipes (never cooked or rated)          │  ← Checkbox
│ ☐ Favorites only                                │  ← Checkbox (moved from RecipeFilterBar)
│                                                  │
│ [Existing filters: tags, sort]                  │  ← RecipeFilterBar (minus favorites)
└─────────────────────────────────────────────────┘
```

**Filter Logic:**

| Filter                   | Condition                                                                 |
| ------------------------ | ------------------------------------------------------------------------- |
| Ingredient Search        | Recipe contains ALL typed ingredients (AND logic)                         |
| Haven't made in 30+ days | `last_cooked_at IS NULL` OR `last_cooked_at < NOW() - INTERVAL '30 days'` |
| New recipes              | `last_cooked_at IS NULL` AND no ratings exist                             |
| Favorites only           | `is_favorite = true`                                                      |

**Behavior:**

- Default: Expanded on first visit
- State saved to localStorage
- All filters use AND logic (must match all selected filters)
- Ingredient search debounced (500ms)

---

### 3. Global Shortlist System

Household-level temporary collection of recipes for meal planning.

#### Floating Access Button

- **Location**: Fixed position, bottom-right corner (Material Design FAB pattern)
- **Icon**: Bookmark icon with badge showing count (e.g., "3")
- **Color**: Primary theme color
- **Visibility**: Available on all pages (global)

#### Shortlist Drawer

Opens from right side when FAB clicked.

**Drawer Structure:**

```
┌─────────────────────────────────┐
│ Shortlist (3)            [X]    │  ← Header with close button
├─────────────────────────────────┤
│                                  │
│ ┌─────────────────────────────┐ │
│ │ Pasta Carbonara             │ │
│ │ Added by John               │ │  ← Attribution
│ │ [View] [Remove] [+Calendar] │ │  ← Action buttons
│ └─────────────────────────────┘ │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ Chicken Tacos               │ │
│ │ Added by Sarah              │ │
│ │ [View] [Remove] [+Calendar] │ │
│ └─────────────────────────────┘ │
│                                  │
│ [Empty state if no recipes]     │
│                                  │
└─────────────────────────────────┘
```

**Drawer Specs:**

- Width: 400px (desktop), full-width (mobile)
- Backdrop overlay (click outside to close)
- Smooth slide-in animation

**Action Buttons:**

- **View**: Navigate to `/recipes/[id]` (opens in same tab)
- **Remove**: Remove from shortlist (no confirmation, instant)
- **Add to Calendar**: Opens calendar slot picker modal

---

### 4. Calendar Integration

#### Add to Calendar Modal

Opens when "Add to Calendar" clicked from shortlist.

**Modal Structure:**

```
┌─────────────────────────────────────────────┐
│ Add Pasta Carbonara to Calendar      [X]    │  ← Header with recipe title
├─────────────────────────────────────────────┤
│                                              │
│ Select date and meal slot:                  │
│                                              │
│ Date: [Date Picker] ────────────────────    │  ← MUI DatePicker (next 30 days)
│                                              │
│ Meal Slot:                                   │
│ ○ Breakfast  ○ Lunch  ○ Dinner  ○ Snack    │  ← Radio buttons
│                                              │
│ Notes (optional):                            │
│ [Text field for notes]                       │  ← TextField multiline
│                                              │
│         [Cancel]  [Add to Calendar]          │  ← Action buttons
└─────────────────────────────────────────────┘
```

**Modal Behavior:**

- Date picker defaults to today
- Meal slot defaults to none selected (user must choose)
- Form validation: Date and meal slot required
- On success:
  - Modal closes
  - Recipe auto-removed from shortlist
  - Success snackbar: "Added Pasta Carbonara to Monday Dinner"
  - Calendar page revalidated (if open)

---

## Data Model

### New Table: recipe_shortlists

```sql
CREATE TABLE recipe_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, recipe_id)
);

-- Index for fast household lookups
CREATE INDEX idx_recipe_shortlists_household ON recipe_shortlists(household_id);

-- RLS: Household isolation
ALTER TABLE recipe_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY recipe_shortlists_household_isolation ON recipe_shortlists
  FOR ALL
  USING (household_id = get_user_household_id());
```

**Key Design Decisions:**

| Decision                        | Rationale                                             |
| ------------------------------- | ----------------------------------------------------- |
| Household-level shortlist       | Collaborative planning - all members see same recipes |
| UNIQUE(household_id, recipe_id) | Prevent duplicate entries per household               |
| Track added_by_user_id          | Attribution for "Added by [Name]"                     |
| Auto-remove on calendar add     | Shortlist is temporary staging area                   |
| Cross-device sync (database)    | Users access shortlist from any device                |

---

## Services

### ShortlistService

```typescript
class ShortlistService extends BaseService {
  /**
   * Add recipe to household shortlist
   * Idempotent: No error if already exists
   */
  async add(recipeId: RecipeId, userId: UserId): Promise<void>;

  /**
   * Remove recipe from household shortlist
   * Idempotent: No error if doesn't exist
   */
  async remove(recipeId: RecipeId): Promise<void>;

  /**
   * Get all shortlisted recipes for household
   * Includes recipe details and user attribution
   */
  async getAll(householdId: HouseholdId): Promise<ShortlistItem[]>;

  /**
   * Clear entire household shortlist
   */
  async clear(householdId: HouseholdId): Promise<void>;
}

interface ShortlistItem {
  id: string;
  recipe: Recipe;
  addedBy: {
    id: UserId;
    name: string;
  };
  addedAt: Date;
}
```

---

## Component Architecture

### New Components

| Component            | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| `RecipeCard`         | Rich recipe card with image, metadata, shortlist button |
| `RecipeGrid`         | Grid container with infinite scroll                     |
| `WhatCanICookPanel`  | Collapsible filter panel                                |
| `ShortlistFAB`       | Floating action button with badge                       |
| `ShortlistDrawer`    | Drawer with shortlisted recipes                         |
| `AddToCalendarModal` | Calendar slot picker modal                              |

### Modified Components

| Component         | Changes                                  |
| ----------------- | ---------------------------------------- |
| `RecipesPage`     | Replace list with grid, add filter panel |
| `RecipeFilterBar` | Remove favorites filter (moved to panel) |

### State Management

**Zustand Store: useShortlistStore**

```typescript
interface ShortlistStore {
  items: ShortlistItem[];
  loading: boolean;
  error: string | null;

  // Actions
  load: (householdId: HouseholdId) => Promise<void>;
  add: (recipeId: RecipeId, userId: UserId) => Promise<void>;
  remove: (recipeId: RecipeId) => Promise<void>;
  clear: (householdId: HouseholdId) => Promise<void>;

  // Selectors
  getCount: () => number;
  hasRecipe: (recipeId: RecipeId) => boolean;
}
```

**Realtime Sync:**

- Subscribe to `recipe_shortlists` table changes
- Update store when other household members add/remove items
- Optimistic updates for local actions

---

## Design System Compliance

### Material UI Components Used

| Component                                         | Usage                                     |
| ------------------------------------------------- | ----------------------------------------- |
| `Grid`                                            | Recipe card grid layout                   |
| `Card`, `CardMedia`, `CardContent`, `CardActions` | Recipe cards                              |
| `Fab`                                             | Floating shortlist button                 |
| `Drawer`                                          | Shortlist drawer                          |
| `Dialog`                                          | Add to calendar modal                     |
| `TextField`                                       | Ingredient search, notes field            |
| `Checkbox`                                        | Filter toggles                            |
| `RadioGroup`, `Radio`                             | Meal slot selector                        |
| `Button`                                          | All actions (contained primary, outlined) |
| `Badge`                                           | FAB count indicator                       |
| `Snackbar`                                        | Success feedback                          |
| `CircularProgress`                                | Loading states                            |

### Typography Variants

- **h6**: Section headers ("What can I cook?", "Shortlist")
- **body1**: Recipe card title, primary text
- **body2**: Recipe card metadata, secondary text

### Spacing

All spacing follows 8px grid: 8, 16, 24, 32 (MUI spacing units: 1, 2, 3, 4)

### Icons

From `@mui/icons-material`:

- `Bookmark` / `BookmarkBorder` - Shortlist FAB
- `Close` - Close drawer/modal
- `CalendarToday` - Calendar picker
- `Search` - Ingredient search
- `Visibility` - View recipe
- `Delete` - Remove from shortlist
- `Add` - Add to calendar

### Accessibility

- All buttons have `aria-label` attributes
- FAB includes `aria-label="View shortlist, X recipes"`
- Keyboard navigation supported (Tab, Enter, Escape)
- Focus states visible on all interactive elements
- Alt text for recipe images

---

## Testing Strategy

### Service Layer (100% Coverage Required)

**ShortlistService Tests:**

```typescript
describe('ShortlistService', () => {
  describe('add', () => {
    it('should add recipe to household shortlist');
    it('should be idempotent (no error if already exists)');
    it('should throw NotFoundError if recipe does not exist');
    it('should enforce household isolation via RLS');
  });

  describe('remove', () => {
    it('should remove recipe from shortlist');
    it('should be idempotent (no error if not in shortlist)');
  });

  describe('getAll', () => {
    it('should return all shortlisted recipes with user attribution');
    it('should return empty array if no recipes shortlisted');
    it("should only return recipes for user's household");
  });

  describe('clear', () => {
    it('should remove all recipes from household shortlist');
  });
});
```

### Component Tests (80%+ Coverage)

**RecipeCard Tests:**

- Renders image (or placeholder)
- Shows title, tags, rating, last cooked date
- "Add to Shortlist" button click
- Button shows "Added ✓" when in shortlist
- Navigation on card click

**ShortlistDrawer Tests:**

- Opens/closes correctly
- Displays shortlisted recipes with attribution
- View button navigates to recipe detail
- Remove button removes from shortlist
- Add to Calendar button opens modal
- Empty state when no recipes

**AddToCalendarModal Tests:**

- Form validation (date and meal slot required)
- Success flow: adds to calendar, removes from shortlist
- Error handling
- Cancel button closes modal

**WhatCanICookPanel Tests:**

- Ingredient filter updates recipe list
- Checkboxes filter correctly (AND logic)
- Collapsible state persists to localStorage
- All filters work together

### Integration Tests

**End-to-End Flow:**

1. User filters recipes by ingredient
2. User adds recipe to shortlist
3. Recipe appears in shortlist drawer for all household members
4. User opens calendar modal from shortlist
5. User selects date and meal slot
6. Recipe added to calendar, removed from shortlist
7. Calendar page shows new entry

**Cross-Device Sync:**

- User A adds recipe to shortlist on desktop
- User B sees recipe in shortlist on mobile (same household)
- User B removes recipe
- User A sees removal in real-time

---

## Performance Considerations

### Infinite Scroll Implementation

- Load 20 recipes per page initially
- Fetch next 20 when user scrolls to bottom
- Use `IntersectionObserver` API for scroll detection
- Loading indicator at bottom while fetching

### Image Optimization

- Lazy load images (native `loading="lazy"` attribute)
- Use signed URLs from `RecipeImageService.getPublicUrl()`
- Placeholder image during load (skeleton or default icon)
- Future enhancement: Generate/serve thumbnail versions (150x150)

### Realtime Sync

- Supabase realtime subscription to `recipe_shortlists` table
- Debounce updates (500ms) to avoid excessive re-renders
- Unsubscribe on component unmount to prevent memory leaks

### Caching

- Recipe grid cached in memory (React Query or similar)
- Invalidate cache on shortlist changes
- Shortlist drawer loads data on-demand (not on page load)

---

## Migration Path

### Phase 1: Data & Services

1. Create `recipe_shortlists` migration
2. Implement `ShortlistService` with tests
3. Create Zustand store with realtime sync

### Phase 2: Recipe Discovery

1. Build `RecipeCard` component
2. Replace list with `RecipeGrid` + infinite scroll
3. Add `WhatCanICookPanel` with filters
4. Update `RecipesPage` integration

### Phase 3: Shortlist UI

1. Build `ShortlistFAB` and `ShortlistDrawer`
2. Integrate with recipe cards ("Add to Shortlist" button)
3. Implement View/Remove actions

### Phase 4: Calendar Integration

1. Build `AddToCalendarModal`
2. Integrate with existing calendar service
3. Auto-remove from shortlist on add
4. Add success feedback

### Phase 5: Polish

1. Loading states and skeletons
2. Empty states and error handling
3. Accessibility audit
4. Performance optimization

---

## Open Questions / Future Enhancements

### Out of Scope for MVP

- **Ingredient inventory**: Track what's in your pantry
- **Smart suggestions**: Recommend recipes based on shortlist patterns
- **Batch calendar planning**: Assign multiple recipes to multiple days at once
- **Shortlist sorting/filtering**: Organize shortlist by tags, date added, etc.
- **Recipe notes in shortlist**: Add planning notes before adding to calendar
- **Shareable shortlists**: Export or share shortlist with others

### Post-MVP Considerations

- **Per-user shortlists**: Allow individual members to have private shortlists
- **Shortlist analytics**: Track which recipes are shortlisted most often
- **Meal prep mode**: Group shortlisted recipes by prep tasks (chop vegetables, marinate, etc.)
- **Grocery list integration**: Generate shopping list from shortlisted recipes

---

## Success Metrics

### Qualitative

- Users find recipes faster via visual cards and filters
- Planning a week of meals feels less tedious
- Shortlist provides clear staging area for planning

### Quantitative (Post-Launch)

- Time to find and add recipe to calendar (target: <30 seconds)
- Shortlist usage rate (% of recipes planned via shortlist vs direct)
- Filter adoption (% of users using ingredient/recency filters)
- Infinite scroll engagement (avg recipes viewed per session)

---

## Conclusion

This design introduces visual recipe discovery, smart filtering, and a collaborative shortlist system that bridges browsing and planning. By reducing friction in the meal planning workflow and making recipe discovery more contextual, we enable households to plan meals more efficiently while maintaining the calm, practical aesthetic of CommonTable.

The phased implementation approach ensures each component is thoroughly tested (TDD) and complies with the strict Material Design 3 guidelines outlined in DESIGN_SYSTEM.md.
