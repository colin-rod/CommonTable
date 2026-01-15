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

# Code Quality
pnpm type-check       # Type check all packages
pnpm lint             # Lint all packages
pnpm lint:fix         # Lint and auto-fix
pnpm format           # Format all files with Prettier
pnpm format:check     # Check formatting

# Cleanup
pnpm clean            # Remove build artifacts and caches

# Database (Supabase)
pnpm db:start         # Start local Supabase (Docker required)
pnpm db:stop          # Stop local Supabase
pnpm db:reset         # Reset DB, run migrations, and seed data
pnpm db:migrate       # Create new migration file
pnpm db:push          # Push local migrations to remote
pnpm db:pull          # Pull remote migrations to local
pnpm db:types         # Generate TypeScript types from schema
```

### Supabase Setup

#### 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- Supabase CLI (already installed in this project)

#### 2. Local Development Database

Start a local Supabase instance for development:

```bash
# Start local Supabase (first time will download Docker images)
pnpm db:start

# This starts:
# - PostgreSQL database at postgresql://postgres:postgres@localhost:54322/postgres
# - Supabase Studio at http://localhost:54323
# - API server at http://localhost:54321
```

Access **Supabase Studio** at [http://localhost:54323](http://localhost:54323) to:

- View tables and data
- Test RLS policies
- Run SQL queries
- Manage authentication

#### 3. Run Migrations and Seed Data

```bash
# Apply migrations and seed test data
pnpm db:reset

# This will:
# 1. Drop existing local database
# 2. Run all migrations in supabase/migrations/
# 3. Run seed.sql to create test data
```

Test data includes:

- 2 households (Smith Family, Johnson Household)
- 4 users (2 per household)
- 10 recipes with realistic ingredients and steps
- Calendar entries for upcoming week
- Cooking events from past week

#### 4. Generate TypeScript Types

After running migrations, generate TypeScript types from the database schema:

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

#### 5. Remote Supabase Project

The project is linked to: `https://lrelbxzvndbmfpxhgosd.supabase.co`

To push local migrations to remote:

```bash
# Push migrations to production
pnpm db:push
```

**⚠️ Warning**: Only push migrations to remote after thorough local testing.

#### 6. Environment Variables

Get your Supabase credentials from [Project Settings → API](https://supabase.com/dashboard/project/lrelbxzvndbmfpxhgosd/settings/api):

```bash
# Copy example env file
cp apps/web/.env.example apps/web/.env.local

# Edit apps/web/.env.local with your credentials:
NEXT_PUBLIC_SUPABASE_URL=https://lrelbxzvndbmfpxhgosd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-dashboard
```

**Security Notes**:

- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` is SERVER-ONLY and bypasses RLS
- Never commit `.env.local` to version control

#### 7. Database Schema Overview

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

#### 8. Migration Workflow

Creating a new migration:

```bash
# Create new migration file
pnpm db:migrate my_feature_name

# Edit the generated file in supabase/migrations/
# Always write idempotent migrations (can run multiple times)

# Test locally
pnpm db:reset

# If successful, push to remote
pnpm db:push
```

**Migration Best Practices** (see [CLAUDE.md](./CLAUDE.md)):

- Use `CREATE TABLE IF NOT EXISTS`
- Use `CREATE INDEX IF NOT EXISTS`
- Test migrations locally before pushing to remote
- Always provide rollback strategy

#### 9. Testing Email Flows Locally

**Email confirmations are ENABLED** in `supabase/config.toml`. Users must verify their email before signing in.

**Inbucket** (local email testing):

```bash
# Start local Supabase (includes Inbucket)
pnpm db:start

# Inbucket will be available at:
# http://127.0.0.1:54324
```

**Testing email verification**:

1. Start Supabase and web app:

   ```bash
   pnpm db:start
   pnpm web:dev
   ```

2. Sign up with any email (e.g., `test@example.com`)
3. Open Inbucket: [http://127.0.0.1:54324](http://127.0.0.1:54324)
4. Find the verification email in your inbox
5. Click "Confirm Email" link in the email
6. You'll be redirected to `/auth/confirm` and then to dashboard

**Email flows to test**:

- Sign up → verification email sent
- Click verification link → email confirmed
- Try to login before verification → blocked with error message
- Resend verification email → new email sent
- Password reset → reset email sent

**Email rate limiting** (local):

- 2 emails per hour (configured in `supabase/config.toml`)
- Prevents spam during testing

**Custom email templates** (Material Design 3):

- Confirmation email: `supabase/templates/confirm.html`
- Password reset: `supabase/templates/reset_password.html`

See [CLAUDE.md - Email Verification](./CLAUDE.md#email-verification-and-password-reset) for full documentation.

#### 10. Troubleshooting

**Local Supabase won't start**:

```bash
# Check Docker is running
docker ps

# Reset local Supabase
pnpm db:stop
pnpm db:start
```

**Migrations fail**:

```bash
# Check migration syntax
cat supabase/migrations/YOUR_MIGRATION.sql

# Reset and try again
pnpm db:reset
```

**Types not updating**:

```bash
# Regenerate types
pnpm db:types

# Restart TypeScript server in VSCode
# Command palette → "TypeScript: Restart TS Server"
```

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

### Pull Request Workflow

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Write tests first (TDD)
3. Implement the feature
4. Ensure all tests pass: `pnpm test:coverage`
5. Ensure linting passes: `pnpm lint`
6. Ensure type-checking passes: `pnpm type-check`
7. Push and create a PR
8. CI will run automatically and must pass before merging

### CI/CD Pipeline

The CI pipeline runs on every pull request and push to main:

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-only
```

## License

Private project - All rights reserved.

## Support

For issues or questions:

- Check [CLAUDE.md](./CLAUDE.md) for development guidelines
- Review existing tests for patterns
- Open an issue if you find a bug
