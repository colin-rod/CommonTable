# Issue 3.1 - Storage Bucket + Image Upload Pipeline - Implementation Status

## ✅ Completed Components

### Database & Storage Infrastructure

- ✅ Migration `20260118000001` - Helper functions for storage RLS
  - `public.get_household_id_from_storage_path()`
  - `public.get_recipe_id_from_storage_path()`
  - `public.user_belongs_to_household()`
  - `public.recipe_belongs_to_household()`
- ✅ Migration `20260118000002` - Added `is_public` column to `recipe_images`
- ✅ Storage bucket `recipe-images` created (manual setup via Dashboard)
- ✅ RLS policies created for `storage.objects` (SELECT, INSERT, UPDATE, DELETE)

### Type System

- ✅ Error types (`packages/types/src/errors.ts`):
  - `StorageError`
  - `ImageLimitExceededError`
  - `InvalidFileTypeError`
  - `FileTooLargeError`
- ✅ Zod schemas (`packages/types/src/schemas/recipe-image.ts`):
  - `UploadRecipeImageInputSchema`
  - `UpdateRecipeImageInputSchema`
  - `ReorderRecipeImagesInputSchema`
  - `IMAGE_CONSTRAINTS` constant
- ✅ Updated `RecipeImage` type with `is_public` field

### Service Layer

- ✅ `RecipeImageService` (`packages/api-client/src/services/RecipeImageService.ts`)
  - Methods: upload, delete, update, getByRecipe, reorder, getSignedUrl, getPublicUrl
  - **20 tests passing** ✅

### Utilities

- ✅ Image compression (`apps/web/lib/image/compress.ts`)
  - Functions: compressImage, getImageDimensions, isImageFile, createImagePreviewUrl, revokeImagePreviewUrl

### Hooks

- ✅ `useRecipeImages` (`apps/web/hooks/useRecipeImages.ts`)
  - Manages images state with upload, delete, update, reorder capabilities
  - **14 tests passing** ✅

### UI Components

- ✅ `ImageUploader` (`apps/web/components/recipe/ImageUploader.tsx`)
  - Drag-drop upload with validation and preview
  - **17 tests passing** ✅
- ✅ `ImageGallery` (`apps/web/components/recipe/ImageGallery.tsx`)
  - Grid display with edit/delete actions
- ✅ `ImageEditorDialog` (`apps/web/components/recipe/ImageEditorDialog.tsx`)
  - Edit alt text, primary status, public status
- ✅ `ImageManagement` (`apps/web/components/recipe/ImageManagement.tsx`)
  - Combined component integrating uploader, gallery, and editor
- ✅ `RecipeDetailView` updated to display primary image with signed URLs

### Dependencies

- ✅ `browser-image-compression` added to `apps/web/package.json`

---

## 📋 Next Steps (Integration)

### 1. Update RecipeForm Component

**File**: `apps/web/components/recipe/RecipeForm.tsx`

Add image management section in edit mode:

```typescript
import { ImageManagement } from './ImageManagement';

// Inside RecipeForm component, after recipe is created:
{recipeId && (
  <>
    <Divider />
    <ImageManagement
      recipeId={recipeId}
      userId={userId}
    />
  </>
)}
```

### 2. Update Recipe Detail Page

**File**: `apps/web/app/(dashboard)/recipes/[id]/page.tsx`

Pass `getImageUrl` function to RecipeDetailView:

```typescript
import { RecipeImageService } from '@commontable/api-client';

const recipeImageService = new RecipeImageService();

<RecipeDetailView
  recipe={recipe}
  primaryImage={primaryImage}
  getImageUrl={(image) => recipeImageService.getSignedUrl(image.storage_path)}
/>
```

### 3. Manual Testing Checklist

Once integrated, test the following flows:

- [ ] Upload an image via drag-drop
- [ ] Upload an image via file picker
- [ ] Verify image appears in gallery
- [ ] Set an image as primary (cover photo)
- [ ] View primary image on recipe detail page
- [ ] Edit image alt text
- [ ] Toggle image public status
- [ ] Delete an image
- [ ] Verify max 10 images limit
- [ ] Verify 5MB file size limit
- [ ] Verify file type validation (JPEG, PNG, WebP only)
- [ ] Verify household isolation (can only see own household's images)

---

## 🧪 Test Summary

| Component          | Tests  | Status             |
| ------------------ | ------ | ------------------ |
| RecipeImageService | 20     | ✅ Passing         |
| useRecipeImages    | 14     | ✅ Passing         |
| ImageUploader      | 17     | ✅ Passing         |
| **Total**          | **51** | **✅ All Passing** |

---

## 📁 Files Created/Modified

### New Files

- `supabase/migrations/20260118000001_create_recipe_images_bucket.sql`
- `supabase/migrations/20260118000002_add_recipe_image_visibility.sql`
- `supabase/manual-setup-storage-policies.sql` (reference only)
- `packages/types/src/schemas/recipe-image.ts`
- `packages/api-client/src/services/RecipeImageService.ts`
- `packages/api-client/src/services/RecipeImageService.test.ts`
- `apps/web/lib/image/compress.ts`
- `apps/web/hooks/useRecipeImages.ts`
- `apps/web/hooks/useRecipeImages.test.ts`
- `apps/web/components/recipe/ImageUploader.tsx`
- `apps/web/components/recipe/ImageUploader.test.tsx`
- `apps/web/components/recipe/ImageGallery.tsx`
- `apps/web/components/recipe/ImageEditorDialog.tsx`
- `apps/web/components/recipe/ImageManagement.tsx`

### Modified Files

- `packages/types/src/errors.ts` - Added storage-related errors
- `packages/types/src/models.ts` - Added `is_public` to RecipeImage
- `packages/types/src/index.ts` - Export new schemas
- `packages/api-client/src/index.ts` - Export RecipeImageService
- `apps/web/components/recipe/RecipeDetailView.tsx` - Display primary image
- `apps/web/package.json` - Added browser-image-compression

---

## 🎯 Issue 3.1 Status: **READY FOR INTEGRATION**

All core functionality has been implemented and tested. The remaining work is integrating the components into the RecipeForm and testing the end-to-end flow.
