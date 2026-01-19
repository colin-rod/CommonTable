import { test, expect } from '../fixtures/base';

/**
 * E2E Tests: Recipe Forking
 *
 * Tests recipe forking (copying) functionality:
 * - Fork a recipe
 * - Fork with custom title
 * - Verify independence of forked recipe
 *
 * Prerequisites:
 * - Local dev server running
 * - Local Supabase running
 */

test.describe('Recipe Forking', () => {
  test('should fork a recipe with default title', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create original recipe
    const originalTitle = `Original Recipe ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: originalTitle,
      p_description: 'Original description',
      p_servings: 4,
      p_prep_time_minutes: 15,
      p_cook_time_minutes: 30,
      p_ingredients_json: [
        { name: 'Ingredient A', quantity: 2, unit: 'cups' },
        { name: 'Ingredient B', quantity: 1, unit: 'tbsp' },
      ],
      p_steps_json: [
        { position: 1, text: 'First step' },
        { position: 2, text: 'Second step' },
      ],
      p_user_id: userId,
    });

    // Navigate to recipe detail
    await page.goto(`/recipes/${recipe.id}`);

    // Click fork button
    await page.click('button:has-text("Fork")');

    // Verify fork dialog appears
    await expect(page.locator('text=/fork.*recipe/i')).toBeVisible();

    // Verify default title is "Copy of {original title}"
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toHaveValue(`Copy of ${originalTitle}`);

    // Click fork/confirm button
    await page.click('button:has-text("Fork")');

    // Wait for redirect to new recipe
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

    // Verify we're on a different recipe (different ID)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain(recipe.id);

    // Verify forked recipe has correct title
    await expect(page.locator(`text=Copy of ${originalTitle}`)).toBeVisible();

    // Verify all content was copied
    await expect(page.locator('text=Original description')).toBeVisible();
    await expect(page.locator('text=/4.*servings/i')).toBeVisible();
    await expect(page.locator('text=Ingredient A')).toBeVisible();
    await expect(page.locator('text=Ingredient B')).toBeVisible();
    await expect(page.locator('text=First step')).toBeVisible();
    await expect(page.locator('text=Second step')).toBeVisible();

    // Verify forked recipe appears in recipe list
    await page.goto('/recipes');
    await expect(page.locator(`text=Copy of ${originalTitle}`)).toBeVisible();
    await expect(page.locator(`text=${originalTitle}`)).toBeVisible();
  });

  test('should fork recipe with custom title', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create original recipe
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Custom Fork Original ${Date.now()}`,
      p_description: 'Description',
      p_servings: 2,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Navigate and fork
    await page.goto(`/recipes/${recipe.id}`);
    await page.click('button:has-text("Fork")');

    // Modify title
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();
    const customTitle = `My Custom Fork ${Date.now()}`;
    await titleInput.fill(customTitle);

    // Confirm fork
    await page.click('button:has-text("Fork")');

    // Wait for redirect
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

    // Verify custom title is used
    await expect(page.locator(`text=${customTitle}`)).toBeVisible();
  });

  test('should create independent copy when forking', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create original recipe
    const originalTitle = `Independent Original ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: originalTitle,
      p_description: 'Original',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Original Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Original step' }],
      p_user_id: userId,
    });

    // Fork the recipe
    await page.goto(`/recipes/${recipe.id}`);
    await page.click('button:has-text("Fork")');
    await page.click('button:has-text("Fork")');

    // Wait for redirect and capture forked recipe URL
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });
    const forkedUrl = page.url();
    const forkedId = forkedUrl.split('/').pop();

    // Edit the forked recipe
    await page.click('button:has-text("Edit")');
    await page.fill('textarea[name="description"]', 'Forked and modified');
    await page.fill('input[name="servings"]', '8');
    await page.fill('input[name="ingredients[0].name"]', 'Modified Ingredient');
    await page.click('button[type="submit"]:has-text("Save Changes")');

    await page.waitForURL(`/recipes/${forkedId}`, { timeout: 10000 });

    // Verify forked recipe has modifications
    await expect(page.locator('text=Forked and modified')).toBeVisible();
    await expect(page.locator('text=/8.*servings/i')).toBeVisible();
    await expect(page.locator('text=Modified Ingredient')).toBeVisible();

    // Navigate to original recipe
    await page.goto(`/recipes/${recipe.id}`);

    // Verify original recipe is unchanged
    await expect(page.locator('text=Original')).toBeVisible();
    await expect(page.locator('text=/4.*servings/i')).toBeVisible();
    await expect(page.locator('text=Original Ingredient')).toBeVisible();
    await expect(page.locator('text=Original step')).toBeVisible();

    // Verify forked description is not in original
    await expect(page.locator('text=Forked and modified')).not.toBeVisible();
  });

  test('should handle fork validation errors', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Validation Fork ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Navigate and open fork dialog
    await page.goto(`/recipes/${recipe.id}`);
    await page.click('button:has-text("Fork")');

    // Clear title (make it invalid)
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();

    // Try to fork with empty title
    const forkButton = page.locator('button:has-text("Fork")').last();

    // Verify fork button is disabled
    await expect(forkButton).toBeDisabled();

    // Or verify error message appears
    await expect(page.locator('text=/title.*required/i')).toBeVisible();
  });

  test('should fork recipe preserving all metadata', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with full metadata
    const originalTitle = `Full Metadata Recipe ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: originalTitle,
      p_description: 'Complete description',
      p_servings: 6,
      p_prep_time_minutes: 25,
      p_cook_time_minutes: 45,
      p_ingredients_json: [
        { name: 'Ingredient 1', quantity: 3, unit: 'cups' },
        { name: 'Ingredient 2', quantity: 2, unit: 'tbsp' },
        { name: 'Ingredient 3', quantity: 500, unit: 'g' },
      ],
      p_steps_json: [
        { position: 1, text: 'Detailed step 1' },
        { position: 2, text: 'Detailed step 2' },
        { position: 3, text: 'Detailed step 3' },
      ],
      p_user_id: userId,
    });

    // Fork the recipe
    await page.goto(`/recipes/${recipe.id}`);
    await page.click('button:has-text("Fork")');
    await page.click('button:has-text("Fork")');

    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

    // Verify all metadata was copied
    await expect(page.locator('text=Complete description')).toBeVisible();
    await expect(page.locator('text=/6.*servings/i')).toBeVisible();
    await expect(page.locator('text=/25.*min.*prep/i')).toBeVisible();
    await expect(page.locator('text=/45.*min.*cook/i')).toBeVisible();

    // Verify all ingredients
    await expect(page.locator('text=Ingredient 1')).toBeVisible();
    await expect(page.locator('text=Ingredient 2')).toBeVisible();
    await expect(page.locator('text=Ingredient 3')).toBeVisible();

    // Verify all steps
    await expect(page.locator('text=Detailed step 1')).toBeVisible();
    await expect(page.locator('text=Detailed step 2')).toBeVisible();
    await expect(page.locator('text=Detailed step 3')).toBeVisible();
  });

  test('should show fork button only on recipe detail page', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Fork Button Test ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Verify fork button is NOT on recipe list
    await page.goto('/recipes');
    await expect(page.locator('button:has-text("Fork")')).not.toBeVisible();

    // Verify fork button IS on recipe detail
    await page.goto(`/recipes/${recipe.id}`);
    await expect(page.locator('button:has-text("Fork")')).toBeVisible();

    // Verify fork button is NOT on edit page
    await page.goto(`/recipes/${recipe.id}/edit`);
    await expect(page.locator('button:has-text("Fork")')).not.toBeVisible();
  });

  test('should cancel fork operation', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Cancel Fork ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Open fork dialog
    await page.goto(`/recipes/${recipe.id}`);
    await page.click('button:has-text("Fork")');

    // Verify dialog is open
    await expect(page.locator('text=/fork.*recipe/i')).toBeVisible();

    // Cancel
    await page.click('button:has-text("Cancel")');

    // Verify dialog is closed
    await expect(page.locator('text=/fork.*recipe/i')).not.toBeVisible();

    // Verify still on original recipe page
    await expect(page).toHaveURL(`/recipes/${recipe.id}`);

    // Verify no new recipe was created (check recipe list)
    await page.goto('/recipes');
    const recipeCards = await page.locator('[data-testid="recipe-card"]').count();
    // Should only have 1 recipe (the original)
    expect(recipeCards).toBe(1);
  });
});
