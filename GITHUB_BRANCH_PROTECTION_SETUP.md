# GitHub Branch Protection Setup Instructions

This document provides step-by-step instructions for configuring branch protection rules on GitHub for the CommonTable repository.

## Prerequisites

- Admin access to the GitHub repository
- `development` branch already created and pushed to GitHub

## Step 1: Change Default Branch

1. Navigate to the GitHub repository: https://github.com/colin-rod/CommonTable
2. Click **Settings** (top navigation)
3. In the left sidebar, click **General**
4. Scroll to the **Default branch** section
5. Click the **Switch to another branch** button
6. Select `development` from the dropdown
7. Click **Update**
8. Confirm the change by clicking **I understand, update the default branch**

## Step 2: Configure Branch Protection for `main`

### Navigate to Branch Protection Rules

1. In GitHub Settings, click **Branches** in the left sidebar
2. Under **Branch protection rules**, click **Add branch protection rule**

### Configure Protection for `main`

**Branch name pattern**: `main`

#### Protect matching branches

- [x] **Require a pull request before merging**
  - [x] **Require approvals**: 1
  - [x] **Dismiss stale pull request approvals when new commits are pushed**
  - [ ] **Require review from Code Owners** (optional - only if you have CODEOWNERS file)

- [x] **Require status checks to pass before merging**
  - [x] **Require branches to be up to date before merging**
  - **Status checks that are required** (add these 4):
    - `lint`
    - `type-check`
    - `test`
    - `build`

- [x] **Require conversation resolution before merging**

- [x] **Do not allow bypassing the above settings**

- [x] **Restrict who can push to matching branches**
  - Note: This option restricts direct pushes to `main` (PRs from `development` are still allowed)

- [ ] **Allow force pushes** (keep unchecked - NO force pushes)

- [ ] **Allow deletions** (keep unchecked - NO deletions)

#### Save

Click **Create** to save the branch protection rule.

## Step 3: Configure Branch Protection for `development`

### Add Another Branch Protection Rule

1. Click **Add branch protection rule** again

### Configure Protection for `development`

**Branch name pattern**: `development`

#### Protect matching branches

- [x] **Require a pull request before merging**
  - [x] **Require approvals**: 1
  - [x] **Dismiss stale pull request approvals when new commits are pushed**
  - [ ] **Require review from Code Owners** (optional)

- [x] **Require status checks to pass before merging**
  - [x] **Require branches to be up to date before merging**
  - **Status checks that are required** (add these 4):
    - `lint`
    - `type-check`
    - `test`
    - `build`

- [x] **Require conversation resolution before merging**

- [ ] **Do not allow bypassing the above settings** (optional - allow admins to bypass for hotfixes)

- [x] **Restrict who can push to matching branches** (optional - prevents direct pushes)

- [ ] **Allow force pushes** (keep unchecked - NO force pushes)

- [ ] **Allow deletions** (keep unchecked - NO deletions)

#### Save

Click **Create** to save the branch protection rule.

## Step 4: Verify Configuration

### Verify Default Branch

1. Navigate to the repository home page
2. Verify that the default branch dropdown shows `development`

### Verify Branch Protection Rules

1. Go to Settings → Branches
2. Verify two branch protection rules exist:
   - `main` - with required status checks and PR requirements
   - `development` - with required status checks and PR requirements

### Test the Configuration

1. Try to push directly to `main`:

   ```bash
   git checkout main
   git commit --allow-empty -m "test: verify branch protection"
   git push origin main
   ```

   **Expected result**: Push should be rejected with a message about branch protection

2. Create a test feature branch and PR:

   ```bash
   git checkout development
   git pull origin development
   git checkout -b test/verify-ci
   echo "# Test" >> test.md
   git add test.md
   git commit -m "test: verify CI runs on PR"
   git push -u origin test/verify-ci
   ```

3. Open a PR from `test/verify-ci` to `development` on GitHub
4. Verify CI runs automatically
5. Verify all 4 status checks appear: `lint`, `type-check`, `test`, `build`
6. Close the PR without merging (cleanup)
7. Delete the test branch:
   ```bash
   git push origin --delete test/verify-ci
   git branch -D test/verify-ci
   ```

## Step 5: Update Team Members

Notify all team members to:

1. Pull the latest changes:

   ```bash
   git fetch origin
   git checkout development
   git pull origin development
   ```

2. Update their local default branch tracking:

   ```bash
   git branch --set-upstream-to=origin/development development
   ```

3. Delete any local `main` branch (optional):
   ```bash
   git branch -d main
   ```

## Troubleshooting

### Status Checks Not Appearing

If the required status checks (`lint`, `type-check`, `test`, `build`) don't appear in the dropdown:

1. Ensure you've pushed at least one commit to `development` that triggers the CI workflow
2. Wait for the CI workflow to complete
3. Return to branch protection settings - the status checks should now be available
4. If still not visible, the CI workflow may not have run yet or failed to register the checks

### Cannot Merge PR

If you cannot merge a PR even though all checks pass:

1. Verify all required status checks are green
2. Verify the PR has the required number of approvals (1)
3. Verify all conversations are resolved
4. Check if "Require branches to be up to date" is enabled - you may need to update your branch with the latest `development`

### Accidentally Pushed to `main`

If you accidentally pushed directly to `main` before branch protection was set up:

1. Contact a repository admin to force-push the correct state to `main`
2. Or, open a PR from `development` to `main` to sync the branches

## Next Steps

- Review the [README.md](./README.md) for the updated branching strategy
- Review the [CLAUDE.md](./CLAUDE.md) for updated development workflow
- Familiarize yourself with the new PR template at `.github/pull_request_template.md`

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Required Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
