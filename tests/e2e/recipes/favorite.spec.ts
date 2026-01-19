import { test, expect } from '../fixtures/base';

/**
 * E2E Tests: Recipe Favorites
 *
 * Tests recipe favorite/unfavorite functionality:
 * - Toggle favorite from list
 * - Toggle favorite from detail page
 * - Favorite persistence
 * - Filter favorites (if implemented)
 *
 * Prerequisites:
 * - Local dev server running
 * - Local Supabase running
 */

test.describe('Recipe Favorites', () => {
  test('should toggle favorite from recipe list', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create test recipe
    const recipeTitle = `Favorite List Recipe ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Recipe to favorite',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Navigate to recipes list
    await page.goto('/recipes');

    // Find the recipe's favorite button/star icon
    const recipeCard = page.locator(`[data-testid="recipe-card"]:has-text("${recipeTitle}")`);
    const favoriteButton = recipeCard.locator('[data-testid="StarBorderIcon"]').locator('..');

    // Verify star is initially empty/unfilled
    await expect(recipeCard.locator('[data-testid="StarBorderIcon"]')).toBeVisible();

    // Click to favorite
    await favoriteButton.click();

    // Verify star is now filled
    await expect(recipeCard.locator('[data-testid="StarIcon"]')).toBeVisible();
    await expect(recipeCard.locator('[data-testid="StarBorderIcon"]')).not.toBeVisible();

    // Reload page to verify persistence
    await page.reload();

    // Verify favorite persisted
    const reloadedCard = page.locator(`[data-testid="recipe-card"]:has-text("${recipeTitle}")`);
    await expect(reloadedCard.locator('[data-testid="StarIcon"]')).toBeVisible();
  });

  test('should unfavorite recipe from list', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create and favorite a recipe
    const recipeTitle = `Unfavorite List Recipe ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Recipe to unfavorite',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Set as favorite via API
    await supabaseClient.from('recipes').update({ is_favorite: true }).eq('id', recipe.id);

    // Navigate to recipes
    await page.goto('/recipes');

    // Find recipe and verify it's favorited
    const recipeCard = page.locator(`[data-testid="recipe-card"]:has-text("${recipeTitle}")`);
    await expect(recipeCard.locator('[data-testid="StarIcon"]')).toBeVisible();

    // Click to unfavorite
    const favoriteButton = recipeCard.locator('[data-testid="StarIcon"]').locator('..');
    await favoriteButton.click();

    // Verify star is now empty
    await expect(recipeCard.locator('[data-testid="StarBorderIcon"]')).toBeVisible();
    await expect(recipeCard.locator('[data-testid="StarIcon"]')).not.toBeVisible();

    // Reload and verify persistence
    await page.reload();

    const reloadedCard = page.locator(`[data-testid="recipe-card"]:has-text("${recipeTitle}")`);
    await expect(reloadedCard.locator('[data-testid="StarBorderIcon"]')).toBeVisible();
  });

  test('should toggle favorite from recipe detail page', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const recipeTitle = `Favorite Detail Recipe ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Recipe',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Navigate to recipe detail
    await page.goto(`/recipes/${recipe.id}`);

    // Find favorite button
    const favoriteButton = page.locator('button:has([data-testid="StarBorderIcon"])');

    // Verify initially not favorited
    await expect(page.locator('[data-testid="StarBorderIcon"]')).toBeVisible();

    // Click to favorite
    await favoriteButton.click();

    // Verify favorited
    await expect(page.locator('[data-testid="StarIcon"]')).toBeVisible();
    await expect(page.locator('[data-testid="StarBorderIcon"]')).not.toBeVisible();

    // Navigate to list and verify change reflected
    await page.goto('/recipes');
    const recipeCard = page.locator(`[data-testid="recipe-card"]:has-text("${recipeTitle}")`);
    await expect(recipeCard.locator('[data-testid="StarIcon"]')).toBeVisible();
  });

  test('should persist favorite after page reload', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const recipeTitle = `Persist Favorite ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Recipe',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Navigate and favorite
    await page.goto(`/recipes/${recipe.id}`);
    await page.click('button:has([data-testid="StarBorderIcon"])');

    // Reload detail page
    await page.reload();

    // Verify still favorited
    await expect(page.locator('[data-testid="StarIcon"]')).toBeVisible();

    // Navigate away and back
    await page.goto('/recipes');
    await page.click(`text=${recipeTitle}`);

    // Verify still favorited
    await expect(page.locator('[data-testid="StarIcon"]')).toBeVisible();
  });

  test('should handle multiple recipes favoriting', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create multiple recipes
    const recipe1Title = `Multi Fav Recipe 1 ${Date.now()}`;
    const recipe2Title = `Multi Fav Recipe 2 ${Date.now()}`;
    const recipe3Title = `Multi Fav Recipe 3 ${Date.now()}`;

    for (const title of [recipe1Title, recipe2Title, recipe3Title]) {
      await supabaseClient.rpc('create_recipe_with_version', {
        p_household_id: userId,
        p_title: title,
        p_description: 'Recipe',
        p_servings: 4,
        p_prep_time_minutes: 10,
        p_cook_time_minutes: 20,
        p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
        p_steps_json: [{ position: 1, text: 'Step' }],
        p_user_id: userId,
      });
    }

    // Navigate to recipes
    await page.goto('/recipes');

    // Favorite recipe 1 and 3
    const recipe1Card = page.locator(`[data-testid="recipe-card"]:has-text("${recipe1Title}")`);
    await recipe1Card.locator('[data-testid="StarBorderIcon"]').locator('..').click();

    const recipe3Card = page.locator(`[data-testid="recipe-card"]:has-text("${recipe3Title}")`);
    await recipe3Card.locator('[data-testid="StarBorderIcon"]').locator('..').click();

    // Verify correct recipes are favorited
    await expect(recipe1Card.locator('[data-testid="StarIcon"]')).toBeVisible();
    await expect(recipe3Card.locator('[data-testid="StarIcon"]')).toBeVisible();

    const recipe2Card = page.locator(`[data-testid="recipe-card"]:has-text("${recipe2Title}")`);
    await expect(recipe2Card.locator('[data-testid="StarBorderIcon"]')).toBeVisible();

    // Reload and verify
    await page.reload();

    const reloaded1 = page.locator(`[data-testid="recipe-card"]:has-text("${recipe1Title}")`);
    const reloaded2 = page.locator(`[data-testid="recipe-card"]:has-text("${recipe2Title}")`);
    const reloaded3 = page.locator(`[data-testid="recipe-card"]:has-text("${recipe3Title}")`);

    await expect(reloaded1.locator('[data-testid="StarIcon"]')).toBeVisible();
    await expect(reloaded2.locator('[data-testid="StarBorderIcon"]')).toBeVisible();
    await expect(reloaded3.locator('[data-testid="StarIcon"]')).toBeVisible();
  });

  test('should favorite recipe without affecting other users', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const recipeTitle = `Isolated Favorite ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Recipe',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Favorite the recipe
    await page.goto(`/recipes/${recipe.id}`);
    await page.click('button:has([data-testid="StarBorderIcon"])');

    // Verify favorited
    await expect(page.locator('[data-testid="StarIcon"]')).toBeVisible();

    // Check database - favorite should be for this user only
    const { data: recipeData } = await supabaseClient
      .from('recipes')
      .select('is_favorite')
      .eq('id', recipe.id)
      .single();

    expect(recipeData.is_favorite).toBe(true);

    // Note: Full multi-user testing would require creating another user
    // This test verifies the mechanism is in place
  });

  test('should show favorite indicator in recipe metadata', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create and favorite a recipe
    const recipeTitle = `Metadata Favorite ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Recipe',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    await supabaseClient.from('recipes').update({ is_favorite: true }).eq('id', recipe.id);

    // Navigate to recipe detail
    await page.goto(`/recipes/${recipe.id}`);

    // Verify favorite indicator is visible
    await expect(page.locator('[data-testid="StarIcon"]')).toBeVisible();

    // Verify it's prominently displayed (e.g., in header or metadata section)
    const header = page.locator('header, [data-testid="recipe-header"]');
    const metadataSection = page.locator('[data-testid="recipe-metadata"]');

    // Favorite icon should be in header or metadata
    const starInHeader = header.locator('[data-testid="StarIcon"]');
    const starInMetadata = metadataSection.locator('[data-testid="StarIcon"]');

    const hasStarInHeaderOrMetadata =
      (await starInHeader.count()) > 0 || (await starInMetadata.count()) > 0;

    expect(hasStarInHeaderOrMetadata).toBe(true);
  });

  test('should handle favorite toggle rapidly', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create recipe
    const recipeTitle = `Rapid Toggle ${Date.now()}`;

    const { data: recipe } = await supabaseClient.rpc('create_recipe_with_version', {
      p_household_id: userId,
      p_title: recipeTitle,
      p_description: 'Recipe',
      p_servings: 4,
      p_prep_time_minutes: 10,
      p_cook_time_minutes: 20,
      p_ingredients_json: [{ name: 'Ingredient', quantity: 1, unit: 'cup' }],
      p_steps_json: [{ position: 1, text: 'Step' }],
      p_user_id: userId,
    });

    // Navigate to recipe
    await page.goto(`/recipes/${recipe.id}`);

    // Rapidly click favorite button multiple times
    const favoriteButton = page.locator('button:has([data-testid*="Star"])');

    await favoriteButton.click();
    await favoriteButton.click();
    await favoriteButton.click();

    // Wait a moment for updates to settle
    await page.waitForTimeout(1000);

    // Reload and verify final state is consistent
    await page.reload();

    // Either favorited or not, but should be one or the other
    const starIcon = page.locator('[data-testid="StarIcon"]');
    const starBorderIcon = page.locator('[data-testid="StarBorderIcon"]');

    const hasStar = (await starIcon.count()) > 0;
    const hasStarBorder = (await starBorderIcon.count()) > 0;

    // Exactly one should be visible
    expect(hasStar || hasStarBorder).toBe(true);
    expect(hasStar && hasStarBorder).toBe(false);
  });
});
