import { test, expect } from '../fixtures/base';

/**
 * E2E Tests: User Authentication - Login Flow
 *
 * Tests the complete login workflow from UI to database.
 *
 * Prerequisites:
 * - Local dev server running (pnpm web:dev) or configured via webServer in playwright.config.ts
 * - Local Supabase running (supabase start)
 */

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    // Start from login page
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Login|Sign in|CommonTable/i);

    // Verify form elements exist
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Enter invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify error message appears
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show error for empty fields', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');

    // Verify error messages appear
    await expect(page.locator('text=/email.*required/i')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page, supabaseClient }) => {
    // Create test user
    const timestamp = Date.now();
    const email = `testlogin${timestamp}@example.com`;
    const password = 'TestPassword123!';

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: 'Test Login User',
        },
      },
    });

    expect(error).toBeNull();

    // Fill login form
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Verify user is logged in (check for user-specific element)
    await expect(page.locator('text=Test Login User')).toBeVisible({ timeout: 5000 });
  });

  test('should show error for incorrect password', async ({ page, supabaseClient }) => {
    // Create test user
    const timestamp = Date.now();
    const email = `testwrongpass${timestamp}@example.com`;
    const password = 'CorrectPassword123!';

    await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: 'Test User',
        },
      },
    });

    // Try to login with wrong password
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'WrongPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify error message appears
    await expect(page.locator('text=/invalid.*credentials|incorrect.*password/i')).toBeVisible({
      timeout: 5000,
    });

    // Verify still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error for non-existent user', async ({ page }) => {
    // Try to login with non-existent email
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify error message appears
    await expect(page.locator('text=/invalid.*credentials|user.*not.*found/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should persist session after page reload', async ({ page, supabaseClient }) => {
    // Create and login test user
    const timestamp = Date.now();
    const email = `testpersist${timestamp}@example.com`;
    const password = 'TestPassword123!';

    await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: 'Test Persist User',
        },
      },
    });

    // Login
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Reload page
    await page.reload();

    // Verify still on dashboard (session persisted)
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
    await expect(page.locator('text=Test Persist User')).toBeVisible();
  });

  test('should navigate to signup page from login', async ({ page }) => {
    // Look for signup link
    const signupLink = page.locator('a:has-text("Sign up")');
    await expect(signupLink).toBeVisible();

    // Click signup link
    await signupLink.click();

    // Verify navigation to signup page
    await expect(page).toHaveURL(/\/signup/, { timeout: 5000 });
  });

  test('should navigate to forgot password page from login', async ({ page }) => {
    // Look for forgot password link
    const forgotLink = page.locator('a:has-text("Forgot password")');
    await expect(forgotLink).toBeVisible();

    // Click forgot password link
    await forgotLink.click();

    // Verify navigation to forgot password page
    await expect(page).toHaveURL(/\/forgot-password/, { timeout: 5000 });
  });
});
