import { test, expect } from '../fixtures/base';

/**
 * E2E Tests: Recipe CRUD Operations
 *
 * Tests the complete recipe create, read, update, delete workflow.
 *
 * Prerequisites:
 * - Local dev server running
 * - Local Supabase running
 */

test.describe('Recipe CRUD', () => {
  test('should create a new recipe', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Navigate to recipes page
    await page.goto('/recipes');

    // Click "Add Recipe" button
    await page.click('button:has-text("Add Recipe")');

    // Wait for recipe form/page
    await expect(page).toHaveURL(/\/recipes\/new/, { timeout: 5000 });

    // Fill in recipe details
    const recipeTitle = `Test Recipe ${Date.now()}`;
    await page.fill('input[name="title"]', recipeTitle);
    await page.fill('textarea[name="description"]', 'A delicious test recipe');

    // Fill servings
    await page.fill('input[name="servings"]', '4');

    // Fill prep and cook times
    await page.fill('input[name="prepTime"]', '15');
    await page.fill('input[name="cookTime"]', '30');

    // Add ingredients
    await page.click('button:has-text("Add Ingredient")');
    await page.fill('input[name="ingredients[0].name"]', 'Test Ingredient 1');
    await page.fill('input[name="ingredients[0].quantity"]', '2');
    await page.fill('input[name="ingredients[0].unit"]', 'cups');

    await page.click('button:has-text("Add Ingredient")');
    await page.fill('input[name="ingredients[1].name"]', 'Test Ingredient 2');
    await page.fill('input[name="ingredients[1].quantity"]', '1');
    await page.fill('input[name="ingredients[1].unit"]', 'tbsp');

    // Add steps
    await page.click('button:has-text("Add Step")');
    await page.fill('textarea[name="steps[0].text"]', 'First test step');

    await page.click('button:has-text("Add Step")');
    await page.fill('textarea[name="steps[1].text"]', 'Second test step');

    // Submit form
    await page.click('button[type="submit"]:has-text("Save Recipe")');

    // Wait for redirect to recipe detail page
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/, { timeout: 10000 });

    // Verify recipe details are displayed
    await expect(page.locator(`text=${recipeTitle}`)).toBeVisible();
    await expect(page.locator('text=A delicious test recipe')).toBeVisible();
    await expect(page.locator('text=4 servings')).toBeVisible();
    await expect(page.locator('text=Test Ingredient 1')).toBeVisible();
    await expect(page.locator('text=Test Ingredient 2')).toBeVisible();
    await expect(page.locator('text=First test step')).toBeVisible();
    await expect(page.locator('text=Second test step')).toBeVisible();

    // Verify recipe appears in list
    await page.goto('/recipes');
    await expect(page.locator(`text=${recipeTitle}`)).toBeVisible();
  });

  test('should view recipe details', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;

    // Create test recipe via API
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    const recipeTitle = `View Test Recipe ${Date.now()}`;

    const { data: recipe, error } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId, // Using userId as household_id for test
      p_title: recipeTitle,
      p_description: 'Recipe for viewing test',
      p_servings: 6,
      p_prep_time_minutes: 20,
      p_cook_time_minutes: 40,
      p_ingredients_json: [
        { name: 'Ingredient A', quantity: 3, unit: 'cups' },
        { name: 'Ingredient B', quantity: 2, unit: 'tsp' },
      ],
      p_steps_json: [
        { position: 1, text: 'Step one' },
        { position: 2, text: 'Step two' },
      ],
      p_user_id: userId,
    });

    if (error) throw error;

    // Navigate to recipe detail page
    await page.goto(`/recipes/${recipe.id}`);

    // Verify all details are displayed
    await expect(page.locator(`text=${recipeTitle}`)).toBeVisible();
    await expect(page.locator('text=Recipe for viewing test')).toBeVisible();
    await expect(page.locator('text=6 servings')).toBeVisible();
    await expect(page.locator('text=/20.*min.*prep/i')).toBeVisible();
    await expect(page.locator('text=/40.*min.*cook/i')).toBeVisible();
    await expect(page.locator('text=Ingredient A')).toBeVisible();
    await expect(page.locator('text=Ingredient B')).toBeVisible();
    await expect(page.locator('text=Step one')).toBeVisible();
    await expect(page.locator('text=Step two')).toBeVisible();
  });

  test('should edit an existing recipe', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;

    // Create test recipe
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    const originalTitle = `Edit Test Recipe ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: originalTitle,
      p_description: 'Original description',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Original Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Original step' }],
      p_user_id: userId,
    });

    // Navigate to recipe detail
    await page.goto(`/recipes/${recipe.id}`);

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Wait for edit form
    await expect(page).toHaveURL(`/recipes/${recipe.id}/edit`, { timeout: 5000 });

    // Modify recipe details
    const updatedTitle = `Updated Recipe ${Date.now()}`;
    await page.fill('input[name="title"]', updatedTitle);
    await page.fill('textarea[name="description"]', 'Updated description');
    await page.fill('input[name="servings"]', '8');

    // Modify first ingredient
    await page.fill('input[name="ingredients[0].name"]', 'Updated Ingredient');
    await page.fill('input[name="ingredients[0].quantity"]', '2');

    // Submit form
    await page.click('button[type="submit"]:has-text("Save Changes")');

    // Wait for redirect back to detail page
    await page.waitForURL(`/recipes/${recipe.id}`, { timeout: 10000 });

    // Verify changes are saved
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
    await expect(page.locator('text=Updated description')).toBeVisible();
    await expect(page.locator('text=8 servings')).toBeVisible();
    await expect(page.locator('text=Updated Ingredient')).toBeVisible();
    await expect(page.locator('text=2 cup')).toBeVisible();

    // Verify new version was created
    await page.click('button:has-text("Version History")');
    await expect(page.locator('text=Version 2')).toBeVisible();
  });

  test('should delete a recipe', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;

    // Create test recipe
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    const recipeTitle = `Delete Test Recipe ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Recipe to be deleted',
      p_servings: 2,
      p_prep_time_minutes: 5,
      p_cook_time_minutes: 10,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: null }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Navigate to recipe detail
    await page.goto(`/recipes/${recipe.id}`);

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Confirm deletion in dialog
    await page.click('button:has-text("Delete Recipe")');

    // Wait for redirect to recipe list
    await expect(page).toHaveURL('/recipes', { timeout: 10000 });

    // Verify recipe is no longer in list
    await expect(page.locator(`text=${recipeTitle}`)).not.toBeVisible();

    // Verify recipe detail page is not accessible
    const response = await page.goto(`/recipes/${recipe.id}`);
    expect(response?.status()).toBe(404);
  });

  test('should handle create validation errors', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Navigate to create recipe page
    await page.goto('/recipes/new');

    // Try to submit without required fields
    await page.click('button[type="submit"]:has-text("Save Recipe")');

    // Verify validation errors appear
    await expect(page.locator('text=/title.*required/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/at least.*ingredient/i')).toBeVisible();
    await expect(page.locator('text=/at least.*step/i')).toBeVisible();

    // Verify still on create page
    await expect(page).toHaveURL(/\/recipes\/new/);
  });

  test('should preserve unsaved changes warning', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Navigate to create recipe page
    await page.goto('/recipes/new');

    // Fill in some data
    await page.fill('input[name="title"]', 'Unsaved Recipe');
    await page.fill('textarea[name="description"]', 'Some description');

    // Try to navigate away
    // Set up dialog handler before navigation
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('unsaved changes');
      await dialog.dismiss();
    });

    await page.goto('/recipes');

    // Verify we're back on recipes page (dialog was dismissed)
    await expect(page).toHaveURL('/recipes');
  });
});
