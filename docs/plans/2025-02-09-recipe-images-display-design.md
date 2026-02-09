# Recipe Images Display - Design Document

**Date**: 2025-02-09
**Status**: Ready for Implementation
**Author**: Claude (via brainstorming skill)

---

## Overview

Add recipe image display throughout the application, making images the hero element on both list and grid views. Images will be fetched efficiently via batch queries and displayed prominently above recipe content.

### Goals

- Display primary recipe images in list view (RecipeListItem)
- Display primary recipe images in grid view (RecipeCard - already supported)
- Efficient batch loading of images (no N+1 queries)
- Graceful handling of recipes without images
- Non-breaking: images are progressive enhancement

### Non-Goals (MVP)

- Auto-refresh expired signed URLs (user must reload page after 1 hour)
- Image gallery view (only primary image shown)
- Lazy loading images on scroll (load all visible images upfront)
- Client-side image caching beyond session

---

## Architecture & Data Flow

### Current State

- ✅ `RecipeImageService` handles uploads, storage, signed URL generation
- ✅ `useRecipeImages` provides image management for single recipes
- ✅ `useRecipe` loads primary image via `recipeService.getPrimaryImage()`
- ✅ `RecipeDetailView` displays primary image when available
- ✅ `RecipeCard` accepts `imageUrl` prop but isn't wired up

### Gaps to Fill

1. Recipe list queries don't include primary image data
2. `useRecipes` hook doesn't fetch images
3. `RecipeListItem` doesn't display images
4. `RecipeGrid` doesn't pass `imageUrl` to `RecipeCard`

### Proposed Data Flow

```
Recipe List Page (/recipes)
  ↓
useRecipesWithImages (NEW)
  - Fetches recipes (existing useRecipes)
  - Fetches primary images in batch
  - Maps images to recipes
  - Generates signed URLs on demand
  ↓
RecipeList / RecipeGrid
  - Receives recipes + imageUrls Map
  - Passes imageUrl to each item/card
  ↓
RecipeListItem (UPDATED) / RecipeCard (existing)
  - Displays wide hero image at top
  - Falls back to no image if null
```

### Key Decisions

- **Batch loading**: Single query for all primary images (efficient)
- **Lazy URL generation**: Generate signed URLs only when needed
- **Map data structure**: `Map<RecipeId, string>` for O(1) lookup
- **Placeholder images**: No placeholder - clean display when missing
- **Reuse patterns**: Follow `useRecipe` hook pattern for consistency

---

## Component Updates

### RecipeListItem Enhancement

**New Layout** (image as hero element):

```
┌─────────────────────────────────────┐
│                                     │
│        Hero Image (16:9)            │
│          (max-height: 200px)        │
│                                     │
├─────────────────────────────────────┤
│  Recipe Title                    ⭐ │
│  Last cooked: 2 days ago · pasta    │
│  [Active] [Italian] [Dinner]       │
└─────────────────────────────────────┘
```

**Changes**:

- Add `imageUrl?: string | null` prop
- Add `imageLoading?: boolean` prop for skeleton state
- Use `Box` with `component="img"` for hero image
- Image: width 100%, max-height 200px, `object-fit: cover`
- Show `Skeleton` while loading
- No image display if `imageUrl` is null (clean, no placeholder)
- Image sits above existing `ListItemButton` content
- Entire card remains clickable (image + content navigate to detail)

### RecipeCard Updates

- Already supports `imageUrl` prop ✅
- Currently uses placeholder path (line 43)
- Will receive real signed URLs instead

### RecipeList Component

- Add `imageUrls?: Map<RecipeId, string>` prop
- Add `imagesLoading?: boolean` prop
- Pass `imageUrl` and `imageLoading` from map to each `RecipeListItem`

### RecipeGrid Component

- Add `imageUrls?: Map<RecipeId, string>` prop
- Pass `imageUrl` from map to each `RecipeCard`

### Design System Compliance

- ✅ Uses MUI `Box` component (allowed)
- ✅ Uses `Skeleton` component (allowed)
- ✅ Elevation ≤ 1 (within limit of 2)
- ✅ No custom colors, respects theme
- ✅ Image aspect ratio 16:9 (standard)
- ✅ No emojis, calm neutral tone

---

## New Hook: useRecipesWithImages

### Purpose

Extend `useRecipes` to also load primary images efficiently.

### Hook Signature

```typescript
function useRecipesWithImages() {
  return {
    recipes: Recipe[];
    imageUrls: Map<RecipeId, string>;
    imagesLoading: boolean;
    toggleFavorite: (id: RecipeId) => Promise<void>;
    // ... other existing useRecipes returns
  };
}
```

### Implementation Strategy

1. **Compose with useRecipes** - Don't duplicate logic
2. **Batch fetch primary images** - Single query with `IN` clause
3. **Generate signed URLs** - Parallel generation via `Promise.all()`
4. **Cache in Map** - `Map<RecipeId, string>` for O(1) lookup
5. **Handle expiration gracefully** - URLs expire in 1 hour (user reloads page)

### Key Implementation

```typescript
const loadPrimaryImages = async (recipes: Recipe[]) => {
  const recipeIds = recipes.map((r) => r.id);

  // Batch query
  const imageMap = await recipeService.getPrimaryImagesForRecipes(recipeIds);

  // Generate signed URLs in parallel
  const urlMap = new Map<RecipeId, string>();

  await Promise.all(
    Array.from(imageMap.entries()).map(async ([recipeId, image]) => {
      try {
        const url = image.is_public
          ? imageService.getPublicUrl(image.storage_path)
          : await imageService.getSignedUrl(image.storage_path);
        urlMap.set(recipeId, url);
      } catch (err) {
        console.error(`Failed to generate URL for recipe ${recipeId}:`, err);
        // Continue without this image
      }
    }),
  );

  return urlMap;
};
```

### Performance

- **Single batch query** instead of N queries
- **Parallel URL generation** using `Promise.all()`
- **Only visible recipes** (respects pagination/filtering)
- **Local state caching** during session

---

## Service Layer Updates

### RecipeService - New Method

```typescript
/**
 * Get primary images for multiple recipes in a single query
 *
 * @param recipeIds - Array of recipe IDs
 * @returns Map of recipe ID to primary image
 */
async getPrimaryImagesForRecipes(
  recipeIds: RecipeId[]
): Promise<Map<RecipeId, RecipeImage>> {
  if (recipeIds.length === 0) {
    return new Map();
  }

  const { data, error } = await this.supabase
    .from('recipe_images')
    .select('*')
    .in('recipe_id', recipeIds)
    .eq('is_primary', true);

  if (error) {
    BaseService.handleSupabaseError(
      error,
      'RecipeService.getPrimaryImagesForRecipes',
      { recipeIds }
    );
  }

  const imageMap = new Map<RecipeId, RecipeImage>();
  (data || []).forEach((image) => {
    imageMap.set(image.recipe_id as RecipeId, image as RecipeImage);
  });

  return imageMap;
}
```

### Why a New Method?

- **Efficiency**: Single query vs N queries
- **Consistency**: Follows `getPrimaryImage()` pattern
- **Type safety**: Returns `Map<RecipeId, RecipeImage>`
- **Error handling**: Uses `BaseService.handleSupabaseError`

### RecipeImageService

No changes needed - existing methods work perfectly:

- ✅ `getSignedUrl(storagePath)` - for private images
- ✅ `getPublicUrl(storagePath)` - for public images

---

## Testing Strategy (TDD)

### Test Coverage Requirements

- **Services**: 100% coverage (all branches, edge cases)
- **Hooks**: 80%+ coverage (business logic fully covered)
- **Components**: 80%+ coverage (rendering, interactions)

### 1. RecipeService.getPrimaryImagesForRecipes()

```typescript
describe('RecipeService.getPrimaryImagesForRecipes', () => {
  it('should return empty map when no recipe IDs provided');
  it('should fetch primary images for multiple recipes');
  it('should handle recipes without primary images');
  it('should handle database errors');
});
```

### 2. useRecipesWithImages Hook

```typescript
describe('useRecipesWithImages', () => {
  it('should load recipes and their primary images');
  it('should generate signed URLs for primary images');
  it('should handle recipes without images gracefully');
  it('should handle image load failures');
  it('should cancel stale requests on filter changes');
});
```

### 3. RecipeListItem Component

```typescript
describe('RecipeListItem with image', () => {
  it('should render hero image when imageUrl provided');
  it('should not render image when imageUrl is null');
  it('should show skeleton while image is loading');
  it('should preserve existing functionality (favorite, navigation)');
});
```

### 4. RecipeGrid Component

```typescript
describe('RecipeGrid with images', () => {
  it('should pass imageUrls to RecipeCard components');
  it('should handle missing imageUrls gracefully');
});
```

### TDD Workflow

**RED → GREEN → REFACTOR** (mandatory per CLAUDE.md)

1. **RED**: Write failing test first
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Improve while keeping tests green

---

## Error Handling & Edge Cases

### 1. Recipes Without Primary Images

- **Behavior**: No entry in `imageUrls` Map
- **UI**: Recipe renders without image (clean, no placeholder)
- **No error needed**: Expected state, not a failure

### 2. Image Load Failures

- **Behavior**: Catch silently, log to console
- **UI**: Recipe displays without image
- **Non-blocking**: Continue loading other images

```typescript
try {
  const url = await imageService.getSignedUrl(storagePath);
  urlMap.set(recipeId, url);
} catch (err) {
  console.error(`Failed to generate URL for ${recipeId}:`, err);
  // Continue without this image
}
```

### 3. Signed URL Expiration (1 hour)

- **Behavior**: URLs expire after 1 hour
- **Solution (MVP)**: User must refresh page
- **Future**: Auto-refresh URLs before expiration (not in this design)
- **UI**: Browser shows broken image icon if expired

### 4. Batch Query Performance

- **Scenario**: User has 1000+ recipes
- **Solution**: Only fetch images for visible recipes (respects pagination)
- **Performance**: Scales well up to ~100 recipes per page

### 5. Network Failures

- **Behavior**: Log error, set `imagesLoading = false`
- **UI**: Recipe list shows without images
- **No error banner**: Images are non-critical feature

### 6. Race Conditions (Filter Changes)

- **Solution**: Use cleanup function in `useEffect`
- **Implementation**: Cancel stale requests

```typescript
useEffect(() => {
  let cancelled = false;

  const load = async () => {
    const urls = await fetchImageUrls(recipes);
    if (!cancelled) setImageUrls(urls);
  };

  load();
  return () => {
    cancelled = true;
  };
}, [recipes]);
```

### 7. Private vs Public Images

- **Check**: Use `image.is_public` flag
- **Public**: Use `getPublicUrl()` (faster, no expiration)
- **Private**: Use `getSignedUrl()` (expires in 1 hour)

```typescript
const url = image.is_public
  ? imageService.getPublicUrl(image.storage_path)
  : await imageService.getSignedUrl(image.storage_path);
```

### Non-Breaking Principle

Images are **progressive enhancement**. If anything fails, the recipe list works perfectly without images. No user-facing errors, no broken layouts.

---

## Implementation Plan

### Files to Create

1. **`apps/web/hooks/useRecipesWithImages.ts`** (NEW)
   - Wraps `useRecipes` hook
   - Adds batch image loading
   - Returns `{ recipes, imageUrls, imagesLoading, ... }`

2. **`apps/web/hooks/useRecipesWithImages.test.ts`** (NEW)
   - Integration tests for hook
   - 80%+ coverage

### Files to Modify

3. **`packages/api-client/src/services/RecipeService.ts`** (UPDATE)
   - Add `getPrimaryImagesForRecipes()` method
   - ~20 lines of code

4. **`packages/api-client/src/services/RecipeService.test.ts`** (UPDATE)
   - Add test suite for new method
   - 100% coverage

5. **`apps/web/components/recipe/RecipeListItem.tsx`** (UPDATE)
   - Add `imageUrl` and `imageLoading` props
   - Add hero image display
   - Add skeleton loader
   - ~30 lines added

6. **`apps/web/components/recipe/RecipeListItem.test.tsx`** (UPDATE)
   - Test image rendering, skeleton, missing image

7. **`apps/web/components/recipe/RecipeList.tsx`** (UPDATE)
   - Add `imageUrls` and `imagesLoading` props
   - Pass to each `RecipeListItem`
   - ~5 lines changed

8. **`apps/web/components/recipe/RecipeList.test.tsx`** (UPDATE)
   - Test prop passing

9. **`apps/web/components/recipe/RecipeGrid.tsx`** (UPDATE)
   - Add `imageUrls` prop
   - Pass to each `RecipeCard`
   - ~5 lines changed

10. **`apps/web/components/recipe/RecipeGrid.test.tsx`** (UPDATE)
    - Test prop passing

11. **`apps/web/app/(dashboard)/recipes/page.tsx`** (UPDATE)
    - Replace `useRecipes` with `useRecipesWithImages`
    - Pass `imageUrls` to components
    - ~10 lines changed

### Implementation Order (TDD)

**Phase 1: Service Layer**

1. Write failing tests for `RecipeService.getPrimaryImagesForRecipes()` ❌ RED
2. Implement method ✅ GREEN
3. Refactor ✅ REFACTOR

**Phase 2: Hook Layer** 4. Write failing tests for `useRecipesWithImages` ❌ RED 5. Implement hook ✅ GREEN 6. Refactor ✅ REFACTOR

**Phase 3: Component Layer** 7. Write failing tests for `RecipeListItem` with image ❌ RED 8. Update `RecipeListItem` ✅ GREEN 9. Refactor ✅ REFACTOR

**Phase 4: Integration** 10. Update `RecipeList` and `RecipeGrid` props 11. Update recipes page to use new hook 12. Run full test suite

**Phase 5: Verification** 13. Run tests: `pnpm test` 14. Type check: `pnpm type-check` 15. Visual verification: Load `/recipes` page 16. Test edge cases: No image, network failure

### Estimated Changes

- **New files**: 2 (hook + test)
- **Modified files**: 9
- **Lines added**: ~120
- **Lines changed**: ~30
- **Test coverage**: 100% services, 80%+ components/hooks

---

## Design System Compliance

### Material Design 3 Checklist

**✅ Allowed MUI Components Only**

- `Box` for image container ✅
- `Skeleton` for loading state ✅
- No forbidden components ✅

**✅ Typography (4 variants only)**

- No new variants introduced ✅

**✅ Spacing System (8px base)**

- Uses theme spacing units ✅
- `borderRadius: 1` = 8px ✅

**✅ Color System (Material Roles)**

- No custom colors ✅
- No gradients or overlays ✅

**✅ Elevation (Low Only)**

- RecipeListItem: elevation 0 ✅
- RecipeCard: elevation 1 (existing) ✅

**✅ No Emojis**

- Calm, neutral tone ✅

**✅ Accessibility**

- All images have `alt` attribute ✅
- Skeleton has `aria-label` ✅
- Keyboard navigation preserved ✅

---

## Verification Checklist

**Before claiming "done" (verification-before-completion skill):**

- [ ] Run all tests: `pnpm test` (must pass)
- [ ] Type check: `pnpm type-check` (must pass)
- [ ] Lint: `pnpm lint` (must pass)
- [ ] Visual verification:
  - [ ] Navigate to `/recipes`
  - [ ] Verify images display in list view
  - [ ] Verify images display in grid view
  - [ ] Verify recipes without images render cleanly
  - [ ] Test favorite toggle still works
  - [ ] Test navigation to recipe detail

**Performance verification:**

- [ ] No N+1 queries (check network tab)
- [ ] Batch query executes once per page load
- [ ] Page load time < 1 second for 50 recipes

**Edge case verification:**

- [ ] Recipe without image displays cleanly
- [ ] Network failure doesn't break list
- [ ] Filter changes cancel stale requests

---

## Success Criteria

- ✅ Images display prominently in list and grid views
- ✅ Batch loading (single query for all images)
- ✅ Graceful handling of missing images
- ✅ No N+1 query problem
- ✅ Non-breaking (recipes work with or without images)
- ✅ 100% test coverage on services
- ✅ 80%+ test coverage on components/hooks
- ✅ Design system compliance (Material Design 3)
- ✅ TDD workflow followed (RED → GREEN → REFACTOR)

---

## Future Enhancements (Not in MVP)

- Auto-refresh expired signed URLs
- Image gallery view (multiple images per recipe)
- Lazy loading on scroll (Intersection Observer)
- Client-side image caching (IndexedDB)
- Image optimization on server (thumbnails, WebP conversion)
- Progressive image loading (blur-up effect)

---

**Status**: Ready for Implementation
**Next Step**: Begin TDD implementation (Phase 1: Service Layer)
