import { test, expect } from '../fixtures/base';

/**
 * E2E Tests: Recipe Search
 *
 * Tests recipe search functionality including:
 * - Search by title
 * - Search by ingredient
 * - Clear search
 *
 * Prerequisites:
 * - Local dev server running
 * - Local Supabase running
 */

test.describe('Recipe Search', () => {
  test.beforeEach(async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create multiple test recipes with distinct titles and ingredients
    const recipes = [
      {
        title: 'Chocolate Cake',
        ingredients: [
          { name: 'chocolate', quantity: 200, unit: 'g' },
          { name: 'flour', quantity: 300, unit: 'g' },
          { name: 'eggs', quantity: 3, unit: null },
        ],
      },
      {
        title: 'Vanilla Cupcakes',
        ingredients: [
          { name: 'vanilla extract', quantity: 2, unit: 'tsp' },
          { name: 'flour', quantity: 200, unit: 'g' },
          { name: 'sugar', quantity: 150, unit: 'g' },
        ],
      },
      {
        title: 'Chocolate Chip Cookies',
        ingredients: [
          { name: 'chocolate chips', quantity: 300, unit: 'g' },
          { name: 'butter', quantity: 200, unit: 'g' },
          { name: 'flour', quantity: 250, unit: 'g' },
        ],
      },
      {
        title: 'Strawberry Smoothie',
        ingredients: [
          { name: 'strawberries', quantity: 200, unit: 'g' },
          { name: 'milk', quantity: 250, unit: 'ml' },
          { name: 'honey', quantity: 1, unit: 'tbsp' },
        ],
      },
    ];

    for (const recipe of recipes) {
      await supabaseClient.rpc('create_recipe_with_version', {
        p_household_id: userId,
        p_title: recipe.title,
        p_description: `Test recipe: ${recipe.title}`,
        p_servings: 4,
        p_prep_time_minutes: 10,
        p_cook_time_minutes: 20,
        p_ingredients_json: recipe.ingredients,
        p_steps_json: [{ position: 1, text: 'Make it' }],
        p_user_id: userId,
      });
    }

    // Navigate to recipes page
    await page.goto('/recipes');
  });

  test('should search recipes by title', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Search for "chocolate"
    await searchInput.fill('chocolate');

    // Wait for search results
    await page.waitForTimeout(500); // Debounce

    // Verify only chocolate recipes are shown
    await expect(page.locator('text=Chocolate Cake')).toBeVisible();
    await expect(page.locator('text=Chocolate Chip Cookies')).toBeVisible();

    // Verify non-matching recipes are hidden
    await expect(page.locator('text=Vanilla Cupcakes')).not.toBeVisible();
    await expect(page.locator('text=Strawberry Smoothie')).not.toBeVisible();
  });

  test('should search recipes by ingredient', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    const searchInput = page.locator('input[placeholder*="Search"]');

    // Search for "strawberries" (ingredient)
    await searchInput.fill('strawberries');
    await page.waitForTimeout(500);

    // Verify only strawberry smoothie is shown
    await expect(page.locator('text=Strawberry Smoothie')).toBeVisible();

    // Verify other recipes are hidden
    await expect(page.locator('text=Chocolate Cake')).not.toBeVisible();
    await expect(page.locator('text=Vanilla Cupcakes')).not.toBeVisible();
    await expect(page.locator('text=Chocolate Chip Cookies')).not.toBeVisible();
  });

  test('should clear search and show all recipes', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    const searchInput = page.locator('input[placeholder*="Search"]');

    // First perform a search
    await searchInput.fill('chocolate');
    await page.waitForTimeout(500);

    // Verify filtered results
    await expect(page.locator('text=Chocolate Cake')).toBeVisible();
    await expect(page.locator('text=Vanilla Cupcakes')).not.toBeVisible();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Verify all recipes are shown again
    await expect(page.locator('text=Chocolate Cake')).toBeVisible();
    await expect(page.locator('text=Vanilla Cupcakes')).toBeVisible();
    await expect(page.locator('text=Chocolate Chip Cookies')).toBeVisible();
    await expect(page.locator('text=Strawberry Smoothie')).toBeVisible();
  });

  test('should handle search with no results', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    const searchInput = page.locator('input[placeholder*="Search"]');

    // Search for non-existent term
    await searchInput.fill('nonexistent');
    await page.waitForTimeout(500);

    // Verify no recipes are shown
    await expect(page.locator('text=Chocolate Cake')).not.toBeVisible();
    await expect(page.locator('text=Vanilla Cupcakes')).not.toBeVisible();
    await expect(page.locator('text=Chocolate Chip Cookies')).not.toBeVisible();
    await expect(page.locator('text=Strawberry Smoothie')).not.toBeVisible();

    // Verify empty state message
    await expect(page.locator('text=/no.*recipes.*found/i')).toBeVisible();
  });

  test('should search case-insensitively', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    const searchInput = page.locator('input[placeholder*="Search"]');

    // Search with different cases
    await searchInput.fill('CHOCOLATE');
    await page.waitForTimeout(500);

    // Verify results are still found
    await expect(page.locator('text=Chocolate Cake')).toBeVisible();
    await expect(page.locator('text=Chocolate Chip Cookies')).toBeVisible();

    // Try mixed case
    await searchInput.fill('VaNiLlA');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Vanilla Cupcakes')).toBeVisible();
  });

  test('should search with partial matches', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    const searchInput = page.locator('input[placeholder*="Search"]');

    // Search with partial word
    await searchInput.fill('choc');
    await page.waitForTimeout(500);

    // Verify both chocolate recipes are found
    await expect(page.locator('text=Chocolate Cake')).toBeVisible();
    await expect(page.locator('text=Chocolate Chip Cookies')).toBeVisible();

    // Try another partial
    await searchInput.fill('smooth');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Strawberry Smoothie')).toBeVisible();
  });

  test('should debounce search input', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    const searchInput = page.locator('input[placeholder*="Search"]');

    // Type quickly without waiting
    await searchInput.type('choc', { delay: 50 });

    // Immediately verify no search has happened yet
    // (All recipes still visible during debounce)
    await expect(page.locator('text=Chocolate Cake')).toBeVisible();
    await expect(page.locator('text=Vanilla Cupcakes')).toBeVisible();

    // Wait for debounce to complete
    await page.waitForTimeout(500);

    // Now search should be applied
    await expect(page.locator('text=Chocolate Cake')).toBeVisible();
    await expect(page.locator('text=Vanilla Cupcakes')).not.toBeVisible();
  });

  test('should persist search when navigating back', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    const searchInput = page.locator('input[placeholder*="Search"]');

    // Perform search
    await searchInput.fill('chocolate');
    await page.waitForTimeout(500);

    // Navigate to a recipe detail
    await page.click('text=Chocolate Cake');
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9-]+/);

    // Navigate back to list
    await page.goBack();

    // Verify search is still applied
    await expect(searchInput).toHaveValue('chocolate');
    await expect(page.locator('text=Chocolate Cake')).toBeVisible();
    await expect(page.locator('text=Vanilla Cupcakes')).not.toBeVisible();
  });

  test('should show search icon and clear button', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    const searchInput = page.locator('input[placeholder*="Search"]');

    // Verify search icon is visible
    await expect(page.locator('[data-testid="SearchIcon"]')).toBeVisible();

    // Type in search
    await searchInput.fill('chocolate');

    // Verify clear button appears
    const clearButton = page.locator('button:has([data-testid="ClearIcon"])');
    await expect(clearButton).toBeVisible();

    // Click clear button
    await clearButton.click();

    // Verify search is cleared
    await expect(searchInput).toHaveValue('');

    // Verify clear button is hidden
    await expect(clearButton).not.toBeVisible();
  });
});
