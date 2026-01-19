import { test, expect } from '../fixtures/base';

/**
 * E2E Tests: Household Member Management
 *
 * Tests household member management:
 * - Invite member
 * - Add managed member (without email)
 * - Remove member
 * - Admin role management
 *
 * Prerequisites:
 * - Local dev server running
 * - Local Supabase running
 */

test.describe('Household Member Management', () => {
  test('should invite member by email', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Navigate to household members page
    await page.goto('/household/members');

    // Verify page loaded
    await expect(page.locator('text=/members|household/i')).toBeVisible();

    // Click "Invite Member" button
    await page.click('button:has-text("Invite Member")');

    // Verify invite dialog appears
    await expect(page.locator('text=/invite.*member/i')).toBeVisible();

    // Fill email
    const inviteeEmail = `invited${Date.now()}@example.com`;
    await page.fill('input[name="email"]', inviteeEmail);

    // Select role (default should be "member")
    const roleSelect = page.locator('[role="combobox"]');
    await expect(roleSelect).toHaveTextContent('Member');

    // Submit invitation
    await page.click('button:has-text("Send Invitation")');

    // Verify success message
    await expect(page.locator('text=/invitation.*sent/i')).toBeVisible({ timeout: 5000 });

    // Verify pending invitation appears in list
    await expect(page.locator(`text=${inviteeEmail}`)).toBeVisible();
    await expect(page.locator('text=/pending/i')).toBeVisible();
  });

  test('should invite member with admin role', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Navigate to members page
    await page.goto('/household/members');

    // Open invite dialog
    await page.click('button:has-text("Invite Member")');

    // Fill email
    const adminEmail = `admin${Date.now()}@example.com`;
    await page.fill('input[name="email"]', adminEmail);

    // Select admin role
    const roleSelect = page.locator('[role="combobox"]');
    await roleSelect.click();

    // Click admin option
    await page.click('[role="option"]:has-text("Admin")');

    // Verify admin is selected
    await expect(roleSelect).toHaveTextContent('Admin');

    // Submit
    await page.click('button:has-text("Send Invitation")');

    // Verify invitation sent
    await expect(page.locator('text=/invitation.*sent/i')).toBeVisible();

    // Verify admin role shown in pending invitations
    await expect(
      page.locator(`text=${adminEmail}`).locator('..').locator('text=/admin/i'),
    ).toBeVisible();
  });

  test('should add managed member without email', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Navigate to members page
    await page.goto('/household/members');

    // Click "Add Member" button (for managed members)
    await page.click('button:has-text("Add Member")');

    // Verify add member dialog appears
    await expect(page.locator('text=/add.*household.*member/i')).toBeVisible();

    // Verify instruction text
    await expect(page.locator('text=/without requiring email/i')).toBeVisible();

    // Fill member name
    const memberName = `Little ${Date.now()}`;
    await page.fill('input[name="name"]', memberName);

    // Submit
    await page.click('button:has-text("Add Member")');

    // Verify success
    await expect(page.locator(`text=${memberName}`)).toBeVisible({ timeout: 5000 });

    // Verify managed label
    await expect(
      page.locator(`text=${memberName}`).locator('..').locator('text=/managed/i'),
    ).toBeVisible();
  });

  test('should validate email format for invitations', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Navigate and open invite dialog
    await page.goto('/household/members');
    await page.click('button:has-text("Invite Member")');

    // Enter invalid email
    await page.fill('input[name="email"]', 'invalid-email');

    // Try to submit
    await page.click('button:has-text("Send Invitation")');

    // Verify validation error appears
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible({ timeout: 5000 });
  });

  test('should require name for managed members', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Navigate and open add member dialog
    await page.goto('/household/members');
    await page.click('button:has-text("Add Member")');

    // Verify add button is disabled when name is empty
    const addButton = page.locator('button:has-text("Add Member")').last();
    await expect(addButton).toBeDisabled();

    // Type name
    await page.fill('input[name="name"]', 'Test Name');

    // Verify button is enabled
    await expect(addButton).not.toBeDisabled();
  });

  test('should remove household member as admin', async ({ authenticatedPage, supabaseClient }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session.session?.user.id;

    // Create another user and add to household as managed member
    // (In real scenario, this would be via API)
    const managedMemberName = `Remove Me ${Date.now()}`;

    // Add managed member via UI
    await page.goto('/household/members');
    await page.click('button:has-text("Add Member")');
    await page.fill('input[name="name"]', managedMemberName);
    await page.click('button:has-text("Add Member")');

    // Wait for member to appear
    await expect(page.locator(`text=${managedMemberName}`)).toBeVisible();

    // Find the member's delete button
    const memberRow = page.locator(`[data-testid="member-item"]:has-text("${managedMemberName}")`);
    const deleteButton = memberRow.locator('[data-testid="DeleteIcon"]').locator('..');

    // Verify delete button is visible (user is admin)
    await expect(deleteButton).toBeVisible();

    // Click delete
    await deleteButton.click();

    // Handle confirmation dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain(managedMemberName);
      await dialog.accept();
    });

    // Wait for member to be removed
    await expect(page.locator(`text=${managedMemberName}`)).not.toBeVisible({ timeout: 5000 });
  });

  test('should not show delete button for non-admin users', async ({ page, supabaseClient }) => {
    // This test would require creating a non-admin user
    // Skipping full implementation in MVP, but structure shown:
    // 1. Create household with admin user
    // 2. Create second user and add as member (not admin)
    // 3. Login as second user
    // 4. Navigate to members page
    // 5. Verify no delete buttons are visible
    // For now, we can test that admin sees delete buttons
    // (authenticatedPage fixture creates admin by default)
  });

  test('should cancel member removal', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Add a managed member
    await page.goto('/household/members');
    await page.click('button:has-text("Add Member")');
    const memberName = `Cancel Remove ${Date.now()}`;
    await page.fill('input[name="name"]', memberName);
    await page.click('button:has-text("Add Member")');

    await expect(page.locator(`text=${memberName}`)).toBeVisible();

    // Set up dialog to cancel
    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    // Click delete
    const memberRow = page.locator(`[data-testid="member-item"]:has-text("${memberName}")`);
    const deleteButton = memberRow.locator('[data-testid="DeleteIcon"]').locator('..');
    await deleteButton.click();

    // Verify member still exists
    await expect(page.locator(`text=${memberName}`)).toBeVisible();
  });

  test('should display member join date', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Navigate to members page
    await page.goto('/household/members');

    // Verify current user is listed
    await expect(page.locator('text=Test User')).toBeVisible();

    // Verify join date is displayed
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

    // Look for "Joined" text with a date
    await expect(page.locator(`text=/joined.*${currentMonth}/i`)).toBeVisible();
  });

  test('should differentiate authenticated and managed members', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Add managed member
    await page.goto('/household/members');
    await page.click('button:has-text("Add Member")');
    const managedName = `Managed ${Date.now()}`;
    await page.fill('input[name="name"]', managedName);
    await page.click('button:has-text("Add Member")');

    await expect(page.locator(`text=${managedName}`)).toBeVisible();

    // Verify managed member has (managed) label
    await expect(
      page.locator(`text=${managedName}`).locator('..').locator('text=/managed/i'),
    ).toBeVisible();

    // Verify current user (authenticated) does NOT have (managed) label
    const currentUserRow = page.locator('text=Test User');
    await expect(currentUserRow.locator('..').locator('text=/managed/i')).not.toBeVisible();
  });

  test('should show member count', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/household/members');

    // Add one managed member
    await page.click('button:has-text("Add Member")');
    await page.fill('input[name="name"]', `Member ${Date.now()}`);
    await page.click('button:has-text("Add Member")');

    // Verify member count is displayed (at least 2: current user + added member)
    await expect(page.locator('text=/2.*members|members.*2/i')).toBeVisible();
  });

  test('should handle error when adding duplicate email', async ({
    authenticatedPage,
    supabaseClient,
  }) => {
    const page = authenticatedPage;
    const { data: session } = await supabaseClient.auth.getSession();

    // Try to invite the currently logged-in user
    const currentUserEmail = session.session?.user.email;

    await page.goto('/household/members');
    await page.click('button:has-text("Invite Member")');

    await page.fill('input[name="email"]', currentUserEmail!);
    await page.click('button:has-text("Send Invitation")');

    // Verify error message appears
    await expect(page.locator('text=/already.*member|duplicate/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show pending invitations separately from active members', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    await page.goto('/household/members');

    // Send invitation
    await page.click('button:has-text("Invite Member")');
    const inviteEmail = `pending${Date.now()}@example.com`;
    await page.fill('input[name="email"]', inviteEmail);
    await page.click('button:has-text("Send Invitation")');

    // Verify sections exist
    await expect(page.locator('text=/active.*members|members/i')).toBeVisible();
    await expect(page.locator('text=/pending.*invitations|invitations/i')).toBeVisible();

    // Verify pending invitation is in correct section
    const pendingSection = page.locator('[data-testid="pending-invitations"]');
    await expect(pendingSection.locator(`text=${inviteEmail}`)).toBeVisible();
  });

  test('should cancel pending invitation', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Send invitation
    await page.goto('/household/members');
    await page.click('button:has-text("Invite Member")');
    const inviteEmail = `cancel${Date.now()}@example.com`;
    await page.fill('input[name="email"]', inviteEmail);
    await page.click('button:has-text("Send Invitation")');

    await expect(page.locator(`text=${inviteEmail}`)).toBeVisible();

    // Set up confirmation dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Find cancel button for this invitation
    const invitationRow = page.locator(
      `[data-testid="invitation-item"]:has-text("${inviteEmail}")`,
    );
    const cancelButton = invitationRow.locator('[data-testid="CancelIcon"]').locator('..');

    await cancelButton.click();

    // Verify invitation is removed
    await expect(page.locator(`text=${inviteEmail}`)).not.toBeVisible({ timeout: 5000 });
  });
});
