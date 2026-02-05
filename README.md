# CommonTable

[![CI](https://github.com/YOUR_USERNAME/CommonTable/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/CommonTable/actions/workflows/ci.yml)

A shared household recipe book that helps families plan meals, improve recipes over time, and preserve what they love to cook — together.

## Tech Stack

- **Monorepo**: Turborepo with pnpm workspaces
- **Web**: Next.js 15 (App Router) + TypeScript + Material UI (M3)
- **Mobile**: Deferred to Phase 2 (React Native + Expo)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Offline Storage**: Dexie.js (IndexedDB) for web
- **State**: Zustand
- **UI Framework**: Material UI (Material Design 3) - strict design system
- **PWA**: Progressive Web App with offline support
- **Testing**: Vitest (unit/integration), Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Clone repository
git clone https://github.com/colin-rod/CommonTable.git
cd CommonTable
git checkout development  # Default branch

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your Supabase credentials

# Run development server
pnpm dev
```

The web app will be available at [http://localhost:3000](http://localhost:3000).

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Run all apps in development mode
pnpm web:dev          # Run web app only

# Building
pnpm build            # Build all apps and packages
pnpm web:build        # Build web app only

# Testing (TDD required - see CLAUDE.md)
pnpm test             # Run tests in all packages
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm test:integration # Run integration tests (requires local Supabase)

# Code Quality
pnpm type-check       # Type check all packages
pnpm lint             # Lint all packages
pnpm lint:fix         # Lint and auto-fix
pnpm format           # Format all files with Prettier
pnpm format:check     # Check formatting

# Cleanup
pnpm clean            # Remove build artifacts and caches

# Database (Supabase Remote)
pnpm db:migrate       # Create new migration file
pnpm db:push          # Push migrations to remote Supabase
pnpm db:pull          # Pull remote schema to local migrations
pnpm db:types         # Generate TypeScript types from remote schema
```

### Integration Tests

Integration tests are opt-in and run against the local Supabase stack.

```bash
supabase start
RUN_INTEGRATION_TESTS=true pnpm test:integration
```

### Supabase Setup

> **Important**: This project uses **remote Supabase only** (no Docker/local database).
> All development and testing is done against the remote development environment.
> This simplifies onboarding and ensures the development environment matches production.

#### 1. Environment Variables

Get your Supabase credentials from [Project Settings → API](https://supabase.com/dashboard/project/your-project-id/settings/api):

```bash
# Copy example env file
cp apps/web/.env.example apps/web/.env.local

# Edit apps/web/.env.local with your credentials:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
OPENAI_API_KEY=sk-proj-...
```

**Security Notes**:

- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SECRET_KEY` is SERVER-ONLY and bypasses RLS
- **Never commit `.env.local` to version control** (already in `.gitignore`)
- This project uses Supabase's **new Publishable/Secret key system**, not legacy anon/service_role keys

#### 2. Remote Supabase Project

The project is linked to: `https://your-project-id.supabase.co`

Access **Supabase Dashboard** at [https://supabase.com/dashboard/project/your-project-id](https://supabase.com/dashboard/project/your-project-id) to:

- View tables and data (Table Editor)
- Test RLS policies (SQL Editor)
- Run SQL queries
- Manage authentication (Authentication)
- View logs and monitor performance

#### 3. Generate TypeScript Types

Generate TypeScript types from the remote database schema:

```bash
pnpm db:types
```

This creates `packages/types/src/database.types.ts` with:

- Table row types
- Insert types
- Update types
- Database schema structure

Use these types in your code:

```typescript
import { Database } from '@commontable/types';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
```

**Regenerate types after schema changes** (migrations) to keep TypeScript types in sync.

#### 4. Database Schema Overview

**Core Tables**:

- `profiles` - User profiles (extends auth.users)
- `households` - Household groups
- `household_members` - Junction table with roles (admin/member)
- `recipes` - Recipe metadata
- `recipe_versions` - Recipe version history (every edit = new version)
- `calendar_entries` - Meal planning
- `cooking_events` - Cooking history with ratings
- `recipe_forks` - Recipe lineage tracking

**Security**:

- Row Level Security (RLS) enabled on all tables
- Household isolation enforced via RLS policies
- Users can only access data in their household

**Key Functions**:

- `create_recipe_with_version()` - Atomic recipe creation
- `update_recipe_create_version()` - Update recipe (creates new version)
- `fork_recipe()` - Fork recipe with lineage tracking
- `get_recipe_version_history()` - Get version history
- `get_household_recipe_stats()` - Get household statistics

#### 5. Migration Workflow

Creating and pushing a new migration:

```bash
# Create new migration file
pnpm db:migrate my_feature_name

# Edit the generated file in supabase/migrations/
# Always write idempotent migrations (can run multiple times)

# Push migrations to remote Supabase
pnpm db:push

# Regenerate TypeScript types after schema changes
pnpm db:types
```

**Migration Best Practices** (see [CLAUDE.md](./CLAUDE.md)):

- Use `CREATE TABLE IF NOT EXISTS`
- Use `CREATE INDEX IF NOT EXISTS`
- Use `CREATE OR REPLACE FUNCTION` for functions
- All migrations must be idempotent (can run multiple times)
- Test migrations via Supabase Dashboard SQL Editor before pushing
- Always provide rollback strategy

**Idempotent Migration Example**:

```sql
-- Add column only if it doesn't exist
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rolling_score NUMERIC(3,2);

-- Create or replace function
CREATE OR REPLACE FUNCTION calculate_rolling_score(p_recipe_id UUID)
RETURNS NUMERIC(3,2) AS $$
-- function body
$$ LANGUAGE plpgsql;

-- Drop trigger before creating (prevents duplicate trigger error)
DROP TRIGGER IF EXISTS trigger_name ON table_name;
CREATE TRIGGER trigger_name ...
```

#### 6. Testing Email Flows

**Email confirmations are ENABLED**. Users must verify their email before signing in.

**Testing email verification** (remote development environment):

1. Start web app:

   ```bash
   pnpm web:dev
   ```

2. Sign up with a real email you can access
3. Check your email inbox for verification email
4. Click "Confirm Email" link
5. You'll be redirected to `/auth/confirm` and then to dashboard

**Email flows to test**:

- Sign up → verification email sent
- Click verification link → email confirmed
- Try to login before verification → blocked with error message
- Resend verification email → new email sent
- Password reset → reset email sent

**Custom email templates** (Material Design 3):

- Confirmation email: `supabase/templates/confirm.html`
- Password reset: `supabase/templates/reset_password.html`

See [CLAUDE.md - Email Verification](./CLAUDE.md#email-verification-and-password-reset) for full documentation.

#### 7. Troubleshooting

**Migrations fail**:

```bash
# Check migration syntax
cat supabase/migrations/YOUR_MIGRATION.sql

# Test migration in Supabase Dashboard SQL Editor first

# Pull remote schema to see current state
pnpm db:pull
```

**Types not updating**:

```bash
# Regenerate types from remote schema
pnpm db:types

# Restart TypeScript server in VSCode
# Command palette → "TypeScript: Restart TS Server"
```

**Authentication issues**:

- Check environment variables in `.env.local`
- Verify Supabase project URL and keys in dashboard
- Check RLS policies in Supabase Dashboard

### Monorepo Structure

```
CommonTable/
├── apps/
│   ├── web/          # Next.js 15 web application
│   └── mobile/       # React Native app (Phase 2)
├── packages/
│   ├── types/        # Shared TypeScript types and error classes
│   └── api-client/   # Supabase client and services
├── supabase/         # Supabase migrations and edge functions
└── .github/          # GitHub Actions workflows
```

## Contributing

### Test-Driven Development (TDD) - MANDATORY

This project follows **strict TDD** per [CLAUDE.md](./CLAUDE.md). ALL production code must be written test-first.

#### The Process (Non-Negotiable)

1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to make the test pass
3. **REFACTOR**: Improve code quality without changing behavior

#### Test Coverage Requirements

- **Services & Utils**: 100% coverage (all branches, all edge cases)
- **Components**: 80%+ coverage (business logic fully covered)

See example tests:

- [packages/types/src/errors.test.ts](./packages/types/src/errors.test.ts)
- [packages/api-client/src/services/BaseService.test.ts](./packages/api-client/src/services/BaseService.test.ts)
- [apps/web/hooks/useExample.test.ts](./apps/web/hooks/useExample.test.ts)

### Design System - MANDATORY

This project follows an **extremely strict** Material Design 3 design system. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for full details.

**Key Constraints**:

- Only approved MUI components (no custom components in MVP)
- Exactly 3 button variants: `contained primary`, `outlined primary`, `contained error`
- Exactly 4 typography variants: `h5`, `h6`, `body1`, `body2`
- Spacing: 4, 8, 16, 24, 32, 48 only
- Colors: Use theme palette only, no custom colors
- No emojis, no playful language
- Material Icons (@mui/icons-material) only

### Pre-Commit Hooks

This project uses Husky and lint-staged to enforce code quality before commits:

- **Linting**: Auto-fixes ESLint errors
- **Formatting**: Auto-formats with Prettier
- **Tests**: Runs tests related to changed files

If pre-commit hooks fail, fix the issues before committing.

### Branching Strategy

CommonTable follows a **development-main branching strategy**:

#### Branches

- **`development`** (default branch)
  - All feature branches branch from `development`
  - All PRs merge into `development`
  - CI runs on every push and PR
  - Protected: requires PR review + passing CI

- **`main`** (production branch)
  - Only updated via manual PRs from `development`
  - Represents production-ready code
  - Protected: requires PR review + passing CI
  - No direct commits allowed

#### Workflow

**Feature Development**:

```bash
git checkout development
git pull origin development
git checkout -b feat/your-feature
# ... make changes, commit ...
git push -u origin feat/your-feature
# Open PR to development
```

**Release to Production**:

```bash
# Once development is stable:
# Open PR: development → main
# Review changes, ensure CI passes
# Merge PR (triggers production deployment)
```

#### Branch Protection

Both `development` and `main` are protected:

- ✅ Require PR reviews (1 approval minimum)
- ✅ Require CI checks to pass (lint, type-check, test, build)
- ✅ Require conversation resolution
- ❌ No force pushes allowed
- ❌ No direct pushes allowed

### Pull Request Workflow

1. Ensure you're on the latest development branch:
   ```bash
   git checkout development
   git pull origin development
   ```
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Write tests first (TDD)
4. Implement the feature
5. Ensure all tests pass: `pnpm test:coverage`
6. Ensure linting passes: `pnpm lint`
7. Ensure type-checking passes: `pnpm type-check`
8. Push and create a PR
9. CI will run automatically and must pass before merging

### CI/CD Pipeline

The CI pipeline runs on every pull request and push to `development` and `main`:

- **Lint**: ESLint across all packages
- **Type Check**: TypeScript strict mode
- **Test**: Vitest with coverage enforcement
- **Build**: Next.js build verification

All checks must pass before a PR can be merged.

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Comprehensive development guide (TDD, TypeScript, MUI patterns)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Material UI design system constraints
- [Implementation Plan](./Technical%20Architecture%20Plan.md) - Architecture and roadmap

## Environment Variables

Required environment variables for the web app (see [apps/web/.env.example](./apps/web/.env.example)):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key  # Server-only
```

## License

Private project - All rights reserved.

## Support

For issues or questions:

- Check [CLAUDE.md](./CLAUDE.md) for development guidelines
- Review existing tests for patterns
- Open an issue if you find a bug
