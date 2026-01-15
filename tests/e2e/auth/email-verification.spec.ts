import { test, expect } from '../fixtures/base';

/**
 * E2E Tests: Email Verification Flow
 *
 * Tests the complete email verification workflow:
 * - User signs up
 * - Receives verification email (via Inbucket)
 * - Clicks verification link
 * - Email confirmed
 * - Can now sign in
 *
 * Prerequisites:
 * - Local dev server running (pnpm web:dev)
 * - Local Supabase running (supabase start)
 * - Inbucket running (http://127.0.0.1:54324)
 * - Email confirmations enabled in supabase/config.toml
 */

test.describe('Email Verification', () => {
  test('should require email verification before allowing login', async ({ page }) => {
    // 1. Sign up with new user
    const timestamp = Date.now();
    const email = `testverify${timestamp}@example.com`;
    const password = 'TestPassword123!';

    await page.goto('/auth/signup');

    await page.fill('input[name="display_name"]', 'Test Verify User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirm_password"]', password);

    await page.click('button[type="submit"]');

    // 2. Verify success message appears (not auto-redirected to dashboard)
    await expect(
      page.locator('text=/Account created.*Check your email to verify your account/i'),
    ).toBeVisible({ timeout: 5000 });

    // 3. Verify user cannot sign in before verification
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should see error message (email not confirmed)
    await expect(page.locator('text=/email.*not.*confirmed|verify.*email/i')).toBeVisible({
      timeout: 5000,
    });

    // Verify still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show verification status on email confirmation page', async ({ page }) => {
    // Navigate to confirmation page without valid token
    await page.goto('/auth/confirm?error=invalid_token&error_description=Token+expired');

    // Should see error message
    await expect(page.locator('text=/Verification failed/i')).toBeVisible();
    await expect(page.locator('text=/expired|invalid/i')).toBeVisible();
  });

  test('should show already verified message for previously verified email', async ({ page }) => {
    await page.goto(
      '/auth/confirm?error=already_confirmed&error_description=Email+already+verified',
    );

    // Should see already verified message with sign-in button
    await expect(page.locator('text=/already verified/i')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should allow resending verification email', async ({ page }) => {
    const email = `testresend${Date.now()}@example.com`;

    await page.goto('/auth/resend-verification');

    // Verify page title and form
    await expect(page.locator('text=/Resend verification email/i')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();

    // Fill email and submit
    await page.fill('input[name="email"]', email);
    await page.click('button[type="submit"]');

    // Should see success message (even if email doesn't exist, Supabase won't reveal)
    await expect(page.locator('text=/Verification email sent.*Check your inbox/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show validation error for invalid email in resend form', async ({ page }) => {
    await page.goto('/auth/resend-verification');

    // Enter invalid email
    await page.fill('input[name="email"]', 'not-an-email');
    await page.click('button[type="submit"]');

    // Should see validation error
    await expect(page.locator('text=/Invalid email/i')).toBeVisible();
  });

  test('should navigate to login from resend verification page', async ({ page }) => {
    await page.goto('/auth/resend-verification');

    // Find and click "Sign in" link
    const signInLink = page.locator('a:has-text("Sign in")');
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    // Verify navigation to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should redirect to dashboard if already authenticated on signup page', async ({
    page,
    supabaseClient,
  }) => {
    // Create and sign in test user
    const timestamp = Date.now();
    const email = `testauthcheck${timestamp}@example.com`;
    const password = 'TestPassword123!';

    await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: 'Test Auth Check User',
        },
        emailRedirectTo: 'http://localhost:3000/auth/confirm',
      },
    });

    // Manually confirm email (bypass email verification for this test)
    const { data: user } = await supabaseClient.auth.getUser();
    if (user?.user?.id) {
      // Use admin client to confirm email
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

      await adminClient.auth.admin.updateUserById(user.user.id, {
        email_confirm: true,
      });
    }

    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Now try to access signup page
    await page.goto('/auth/signup');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('should redirect to dashboard if already authenticated on resend verification page', async ({
    page,
    supabaseClient,
  }) => {
    // Create and sign in test user
    const timestamp = Date.now();
    const email = `testresendauth${timestamp}@example.com`;
    const password = 'TestPassword123!';

    await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: 'Test Resend Auth User',
        },
        emailRedirectTo: 'http://localhost:3000/auth/confirm',
      },
    });

    // Manually confirm email
    const { data: user } = await supabaseClient.auth.getUser();
    if (user?.user?.id) {
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

      await adminClient.auth.admin.updateUserById(user.user.id, {
        email_confirm: true,
      });
    }

    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Now try to access resend verification page
    await page.goto('/auth/resend-verification');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });
});
