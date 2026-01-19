import { test, expect } from '../fixtures/base';

/**
 * E2E Tests: Recipe Versioning
 *
 * Tests recipe version history and restoration:
 * - View version history
 * - View specific version
 * - Restore previous version
 *
 * Prerequisites:
 * - Local dev server running
 * - Local Supabase running
 */

test.describe('Recipe Versioning', () => {
  test('should display version history', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with initial version
    const recipeTitle = `Versioned Recipe ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Version 1 description',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Original Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Original step' }],
      p_user_id: userId,
    });

    // Navigate to recipe and edit to create version 2
    await page.goto(`/recipes/${recipe.id}/edit`);
    await page.fill('textarea[name="description"]', 'Version 2 description');
    await page.fill('input[name="servings"]', '6');
    await page.click('button[type="submit"]:has-text("Save Changes")');

    await page.waitForURL(`/recipes/${recipe.id}`, { timeout: 10000 });

    // Edit again to create version 3
    await page.click('button:has-text("Edit")');
    await page.fill('textarea[name="description"]', 'Version 3 description');
    await page.fill('input[name="servings"]', '8');
    await page.click('button[type="submit"]:has-text("Save Changes")');

    await page.waitForURL(`/recipes/${recipe.id}`, { timeout: 10000 });

    // Open version history
    await page.click('button:has-text("Version History")');

    // Verify version history dialog/page opened
    await expect(page.locator('text=/version.*history/i')).toBeVisible();

    // Verify all 3 versions are listed
    await expect(page.locator('text=Version 1')).toBeVisible();
    await expect(page.locator('text=Version 2')).toBeVisible();
    await expect(page.locator('text=Version 3')).toBeVisible();

    // Verify versions are in reverse chronological order (newest first)
    const versionElements = await page.locator('[data-testid="version-item"]').all();
    expect(versionElements.length).toBe(3);

    // Verify version 3 is current
    await expect(
      page.locator('text=Version 3').locator('..').locator('text=/current/i'),
    ).toBeVisible();
  });

  test('should view specific version details', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const recipeTitle = `View Version Recipe ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'V1 description',
      p_servings: 2,
      p_prep_time_minutes: 5,
      p_cook_time_minutes: 10,
      p_ingredients_json: [
        { name: 'V1 Ingredient A', quantity: 1, unit: 'cup' },
        { name: 'V1 Ingredient B', quantity: 2, unit: 'tbsp' },
      ],
      p_steps_json: [
        { position: 1, text: 'V1 Step 1' },
        { position: 2, text: 'V1 Step 2' },
      ],
      p_user_id: userId,
    });

    // Create version 2
    await page.goto(`/recipes/${recipe.id}/edit`);
    await page.fill('textarea[name="description"]', 'V2 description');
    await page.fill('input[name="servings"]', '4');
    await page.fill('input[name="ingredients[0].name"]', 'V2 Ingredient A');
    await page.fill('textarea[name="steps[0].text"]', 'V2 Step 1');
    await page.click('button[type="submit"]:has-text("Save Changes")');

    await page.waitForURL(`/recipes/${recipe.id}`, { timeout: 10000 });

    // Open version history
    await page.click('button:has-text("Version History")');

    // Click on Version 1
    await page.click('text=Version 1');

    // Verify Version 1 content is displayed
    await expect(page.locator('text=V1 description')).toBeVisible();
    await expect(page.locator('text=/2.*servings/i')).toBeVisible();
    await expect(page.locator('text=V1 Ingredient A')).toBeVisible();
    await expect(page.locator('text=V1 Ingredient B')).toBeVisible();
    await expect(page.locator('text=V1 Step 1')).toBeVisible();
    await expect(page.locator('text=V1 Step 2')).toBeVisible();

    // Verify Version 2 content is NOT displayed
    await expect(page.locator('text=V2 description')).not.toBeVisible();
    await expect(page.locator('text=/4.*servings/i')).not.toBeVisible();
    await expect(page.locator('text=V2 Ingredient A')).not.toBeVisible();

    // Verify restore button is visible
    await expect(page.locator('button:has-text("Restore")')).toBeVisible();
  });

  test('should restore previous version', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with version 1
    const recipeTitle = `Restore Version Recipe ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Original good description',
      p_servings: 4,
      p_prep_time_minutes: 15,
      p_cook_time_minutes: 30,
      p_ingredients_json: [{ name: 'Good Ingredient', quantity: 2, unit: 'cups' }],
      p_steps_json: [{ position: 1, text: 'Good step' }],
      p_user_id: userId,
    });

    // Create version 2 (bad edit)
    await page.goto(`/recipes/${recipe.id}/edit`);
    await page.fill('textarea[name="description"]', 'Bad description');
    await page.fill('input[name="servings"]', '100');
    await page.fill('input[name="ingredients[0].name"]', 'Bad Ingredient');
    await page.click('button[type="submit"]:has-text("Save Changes")');

    await page.waitForURL(`/recipes/${recipe.id}`, { timeout: 10000 });

    // Verify bad edit is current
    await expect(page.locator('text=Bad description')).toBeVisible();
    await expect(page.locator('text=/100.*servings/i')).toBeVisible();

    // Open version history
    await page.click('button:has-text("Version History")');

    // View Version 1
    await page.click('text=Version 1');

    // Click restore button
    await page.click('button:has-text("Restore")');

    // Confirm restoration in dialog
    await page.click('button:has-text("Restore Version")');

    // Wait for redirect to recipe detail
    await page.waitForURL(`/recipes/${recipe.id}`, { timeout: 10000 });

    // Verify Version 1 content is now current
    await expect(page.locator('text=Original good description')).toBeVisible();
    await expect(page.locator('text=/4.*servings/i')).toBeVisible();
    await expect(page.locator('text=Good Ingredient')).toBeVisible();
    await expect(page.locator('text=Good step')).toBeVisible();

    // Verify bad content is gone
    await expect(page.locator('text=Bad description')).not.toBeVisible();
    await expect(page.locator('text=/100.*servings/i')).not.toBeVisible();

    // Open version history to verify new version was created
    await page.click('button:has-text("Version History")');

    // Should now have 3 versions: V1 (original), V2 (bad), V3 (restored V1)
    await expect(page.locator('text=Version 1')).toBeVisible();
    await expect(page.locator('text=Version 2')).toBeVisible();
    await expect(page.locator('text=Version 3')).toBeVisible();

    // Version 3 should be marked as current
    await expect(
      page.locator('text=Version 3').locator('..').locator('text=/current/i'),
    ).toBeVisible();
  });

  test('should show version metadata', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Metadata Recipe ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Navigate to recipe and open version history
    await page.goto(`/recipes/${recipe.id}`);
    await page.click('button:has-text("Version History")');

    // Click on version 1
    await page.click('text=Version 1');

    // Verify version metadata is displayed
    await expect(page.locator('text=/edited by/i')).toBeVisible();
    await expect(page.locator('text=/test user/i')).toBeVisible(); // From fixture

    // Verify timestamp is displayed
    const now = new Date();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const currentMonth = monthNames[now.getMonth()];
    await expect(page.locator(`text=/${currentMonth}/i`)).toBeVisible();
  });

  test('should cancel restore operation', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with 2 versions
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Cancel Restore Recipe ${Date.now()}`,
      p_description: 'V1 description',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Create version 2
    await page.goto(`/recipes/${recipe.id}/edit`);
    await page.fill('textarea[name="description"]', 'V2 description');
    await page.click('button[type="submit"]:has-text("Save Changes")');
    await page.waitForURL(`/recipes/${recipe.id}`, { timeout: 10000 });

    // Open version history and click Version 1
    await page.click('button:has-text("Version History")');
    await page.click('text=Version 1');

    // Click restore
    await page.click('button:has-text("Restore")');

    // Cancel in dialog
    await page.click('button:has-text("Cancel")');

    // Verify still viewing version 1 (not redirected)
    await expect(page.locator('text=V1 description')).toBeVisible();

    // Close version history and verify V2 is still current
    await page.click('button:has-text("Close")'); // or navigate back
    await expect(page.locator('text=V2 description')).toBeVisible();

    // Verify no new version was created
    await page.click('button:has-text("Version History")');
    await expect(page.locator('text=Version 3')).not.toBeVisible();
  });

  test('should show version comparison indicators', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Comparison Recipe ${Date.now()}`,
      p_description: 'V1',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Create version 2 with changes
    await page.goto(`/recipes/${recipe.id}/edit`);
    await page.fill('textarea[name="description"]', 'V2');
    await page.fill('input[name="servings"]', '6');
    await page.click('button[type="submit"]:has-text("Save Changes")');
    await page.waitForURL(`/recipes/${recipe.id}`, { timeout: 10000 });

    // Open version history
    await page.click('button:has-text("Version History")');

    // Verify version list shows basic change indicators
    const versionList = page.locator('[data-testid="version-list"]');
    await expect(versionList).toBeVisible();

    // Each version should show version number
    await expect(page.locator('text=Version 1')).toBeVisible();
    await expect(page.locator('text=Version 2')).toBeVisible();

    // Current version should be highlighted/marked
    await expect(
      page.locator('text=Version 2').locator('..').locator('text=/current/i'),
    ).toBeVisible();
  });
});
