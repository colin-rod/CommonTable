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
