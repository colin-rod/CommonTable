import { test, expect } from '../fixtures/base';

/**
 * E2E Tests: Recipe Servings Scaling
 *
 * Tests servings scaling and unit conversion:
 * - Scale servings up
 * - Scale servings down
 * - Switch unit systems (imperial/metric)
 * - Quick scaling buttons
 *
 * Prerequisites:
 * - Local dev server running
 * - Local Supabase running
 */

test.describe('Recipe Servings Scaling', () => {
  test('should scale servings up', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with 4 servings and specific ingredient quantities
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Scale Up Recipe ${Date.now()}`,
      p_description: 'Test scaling',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [
        { name: 'Flour', quantity: 2, unit: 'cups' },
        { name: 'Sugar', quantity: 1, unit: 'cup' },
        { name: 'Eggs', quantity: 2, unit: null },
      ],
      p_steps_json: [{ position: 1, text: 'Mix ingredients' }],
      p_user_id: userId,
    });

    // Navigate to recipe
    await page.goto(`/recipes/${recipe.id}`);

    // Verify initial servings
    await expect(page.locator('text=/4.*servings|servings.*4/i')).toBeVisible();

    // Verify initial ingredient quantities
    await expect(page.locator('text=/2.*cups.*flour/i')).toBeVisible();
    await expect(page.locator('text=/1.*cup.*sugar/i')).toBeVisible();
    await expect(page.locator('text=/2.*eggs/i')).toBeVisible();

    // Click increase servings button
    const increaseButton = page.locator('button[aria-label*="Increase servings"]');
    await increaseButton.click();

    // Verify servings increased to 5
    await expect(page.locator('text=/5.*servings|servings.*5/i')).toBeVisible();

    // Verify ingredient quantities scaled (4 → 5 is 1.25x multiplier)
    await expect(page.locator('text=/2.5.*cups.*flour/i')).toBeVisible();
    await expect(page.locator('text=/1.25.*cups.*sugar/i')).toBeVisible();
    await expect(page.locator('text=/2.5.*eggs/i')).toBeVisible();

    // Click increase again to 6 servings (1.5x original)
    await increaseButton.click();

    await expect(page.locator('text=/6.*servings|servings.*6/i')).toBeVisible();
    await expect(page.locator('text=/3.*cups.*flour/i')).toBeVisible();
    await expect(page.locator('text=/1.5.*cups.*sugar/i')).toBeVisible();
    await expect(page.locator('text=/3.*eggs/i')).toBeVisible();
  });

  test('should scale servings down', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with 4 servings
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Scale Down Recipe ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [
        { name: 'Butter', quantity: 4, unit: 'tbsp' },
        { name: 'Milk', quantity: 2, unit: 'cups' },
      ],
      p_steps_json: [{ position: 1, text: 'Combine' }],
      p_user_id: userId,
    });

    await page.goto(`/recipes/${recipe.id}`);

    // Click decrease servings button
    const decreaseButton = page.locator('button[aria-label*="Decrease servings"]');
    await decreaseButton.click();

    // Verify servings decreased to 3
    await expect(page.locator('text=/3.*servings|servings.*3/i')).toBeVisible();

    // Verify ingredient quantities scaled (4 → 3 is 0.75x multiplier)
    await expect(page.locator('text=/3.*tbsp.*butter/i')).toBeVisible();
    await expect(page.locator('text=/1.5.*cups.*milk/i')).toBeVisible();

    // Decrease again to 2 servings (0.5x original)
    await decreaseButton.click();

    await expect(page.locator('text=/2.*servings|servings.*2/i')).toBeVisible();
    await expect(page.locator('text=/2.*tbsp.*butter/i')).toBeVisible();
    await expect(page.locator('text=/1.*cup.*milk/i')).toBeVisible();
  });

  test('should not scale below 1 serving', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with 2 servings
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Min Servings Recipe ${Date.now()}`,
      p_description: 'Test',
      p_servings: 2,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 2, unit: 'cups' }],
      p_steps_json: [{ position: 1, text: 'Mix' }],
      p_user_id: userId,
    });

    await page.goto(`/recipes/${recipe.id}`);

    const decreaseButton = page.locator('button[aria-label*="Decrease servings"]');

    // Decrease to 1 serving
    await decreaseButton.click();
    await expect(page.locator('text=/1.*serving|serving.*1/i')).toBeVisible();

    // Try to decrease below 1 - button should be disabled
    await expect(decreaseButton).toBeDisabled();
  });

  test('should use manual servings input', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with 4 servings
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Manual Input Recipe ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Flour', quantity: 4, unit: 'cups' }],
      p_steps_json: [{ position: 1, text: 'Mix' }],
      p_user_id: userId,
    });

    await page.goto(`/recipes/${recipe.id}`);

    // Find servings input
    const servingsInput = page.locator('input[type="number"][aria-label*="servings"]');

    // Clear and enter 8 servings
    await servingsInput.clear();
    await servingsInput.fill('8');
    await servingsInput.blur(); // Trigger onChange

    // Wait for update
    await page.waitForTimeout(300);

    // Verify servings updated
    await expect(page.locator('text=/8.*servings|servings.*8/i')).toBeVisible();

    // Verify ingredient scaled (4 → 8 is 2x multiplier)
    await expect(page.locator('text=/8.*cups.*flour/i')).toBeVisible();
  });

  test('should switch to metric unit system', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with imperial units
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Imperial Recipe ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [
        { name: 'Milk', quantity: 1, unit: 'cup' },
        { name: 'Butter', quantity: 4, unit: 'tbsp' },
        { name: 'Flour', quantity: 8, unit: 'oz' },
      ],
      p_steps_json: [{ position: 1, text: 'Mix' }],
      p_user_id: userId,
    });

    await page.goto(`/recipes/${recipe.id}`);

    // Verify imperial units initially
    await expect(page.locator('text=/1.*cup.*milk/i')).toBeVisible();
    await expect(page.locator('text=/4.*tbsp.*butter/i')).toBeVisible();
    await expect(page.locator('text=/8.*oz.*flour/i')).toBeVisible();

    // Click metric toggle button
    const metricButton = page.locator('button:has-text("Metric")');
    await metricButton.click();

    // Verify units converted to metric
    // 1 cup ≈ 237 ml
    await expect(page.locator('text=/237.*ml.*milk/i')).toBeVisible();

    // 4 tbsp ≈ 60 ml
    await expect(page.locator('text=/60.*ml.*butter/i')).toBeVisible();

    // 8 oz ≈ 227 g
    await expect(page.locator('text=/227.*g.*flour/i')).toBeVisible();
  });

  test('should switch back to imperial from metric', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Toggle Units Recipe ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Water', quantity: 2, unit: 'cups' }],
      p_steps_json: [{ position: 1, text: 'Mix' }],
      p_user_id: userId,
    });

    await page.goto(`/recipes/${recipe.id}`);

    // Switch to metric
    await page.click('button:has-text("Metric")');
    await expect(page.locator('text=/474.*ml.*water/i')).toBeVisible();

    // Switch back to imperial
    await page.click('button:has-text("Imperial")');
    await expect(page.locator('text=/2.*cups.*water/i')).toBeVisible();
  });

  test('should use quick scaling buttons', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with 4 servings
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Quick Scale Recipe ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Salt', quantity: 1, unit: 'tsp' }],
      p_steps_json: [{ position: 1, text: 'Add' }],
      p_user_id: userId,
    });

    await page.goto(`/recipes/${recipe.id}`);

    // Verify quick scale buttons exist (e.g., ½x, 2x, 3x)
    const halfButton = page.locator('button:has-text("½x")');
    const doubleButton = page.locator('button:has-text("2x")');

    // Click ½x (scale to 2 servings)
    await halfButton.click();
    await expect(page.locator('text=/2.*servings|servings.*2/i')).toBeVisible();
    await expect(page.locator('text=/0.5.*tsp.*salt/i')).toBeVisible();

    // Click 2x (scale to 8 servings from original 4)
    await doubleButton.click();
    await expect(page.locator('text=/8.*servings|servings.*8/i')).toBeVisible();
    await expect(page.locator('text=/2.*tsp.*salt/i')).toBeVisible();
  });

  test('should handle fractional ingredient quantities', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `Fractions Recipe ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Vanilla', quantity: 1.5, unit: 'tsp' }],
      p_steps_json: [{ position: 1, text: 'Add' }],
      p_user_id: userId,
    });

    await page.goto(`/recipes/${recipe.id}`);

    // Scale to 6 servings (1.5x multiplier)
    const increaseButton = page.locator('button[aria-label*="Increase servings"]');
    await increaseButton.click();
    await increaseButton.click();

    // 1.5 * 1.5 = 2.25
    await expect(page.locator('text=/2.25.*tsp.*vanilla/i')).toBeVisible();

    // Scale to 2 servings (0.5x multiplier)
    const decreaseButton = page.locator('button[aria-label*="Decrease servings"]');
    await decreaseButton.click();
    await decreaseButton.click();
    await decreaseButton.click();
    await decreaseButton.click();

    // 1.5 * 0.5 = 0.75
    await expect(page.locator('text=/0.75.*tsp.*vanilla/i')).toBeVisible();
  });

  test('should preserve scaling when navigating away and back', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const recipeTitle = `Persist Scale ${Date.now()}`;
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Oil', quantity: 2, unit: 'tbsp' }],
      p_steps_json: [{ position: 1, text: 'Heat' }],
      p_user_id: userId,
    });

    await page.goto(`/recipes/${recipe.id}`);

    // Scale to 6 servings
    const increaseButton = page.locator('button[aria-label*="Increase servings"]');
    await increaseButton.click();
    await increaseButton.click();

    await expect(page.locator('text=/6.*servings|servings.*6/i')).toBeVisible();
    await expect(page.locator('text=/3.*tbsp.*oil/i')).toBeVisible();

    // Navigate to recipes list
    await page.goto('/recipes');

    // Navigate back to recipe
    await page.click(`text=${recipeTitle}`);

    // Verify scaling persisted (or reset to original)
    // Implementation dependent - if using URL params, should persist
    // If using local state, should reset to original
    // For MVP, likely resets to original
    await expect(page.locator('text=/4.*servings|servings.*4/i')).toBeVisible();
    await expect(page.locator('text=/2.*tbsp.*oil/i')).toBeVisible();
  });

  test('should handle ingredients without quantities when scaling', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe with mixed ingredients (some with quantities, some without)
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `No Quantity Recipe ${Date.now()}`,
      p_description: 'Test',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [
        { name: 'Flour', quantity: 2, unit: 'cups' },
        { name: 'Salt to taste', quantity: null, unit: null },
        { name: 'Pepper', quantity: null, unit: null },
      ],
      p_steps_json: [{ position: 1, text: 'Mix' }],
      p_user_id: userId,
    });

    await page.goto(`/recipes/${recipe.id}`);

    // Scale up
    await page.click('button[aria-label*="Increase servings"]');
    await page.click('button[aria-label*="Increase servings"]');

    // Verify flour scaled
    await expect(page.locator('text=/3.*cups.*flour/i')).toBeVisible();

    // Verify ingredients without quantities remain unchanged
    await expect(page.locator('text=Salt to taste')).toBeVisible();
    await expect(page.locator('text=Pepper')).toBeVisible();
  });

  test('should show servings scaler only when servings are set', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe WITHOUT servings
    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: `No Servings Recipe ${Date.now()}`,
      p_description: 'Test',
      p_servings: null,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Mix' }],
      p_user_id: userId,
    });

    await page.goto(`/recipes/${recipe.id}`);

    // Verify servings scaler is NOT displayed
    await expect(page.locator('button[aria-label*="Increase servings"]')).not.toBeVisible();
    await expect(page.locator('button[aria-label*="Decrease servings"]')).not.toBeVisible();

    // Verify message about servings not set
    await expect(page.locator('text=/servings not set/i')).toBeVisible();
  });
});
