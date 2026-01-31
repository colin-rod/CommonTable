## Description

<!-- Briefly describe what this PR does -->

## Type of Change

- [ ] Feature (new functionality)
- [ ] Bug fix (fixes an issue)
- [ ] Refactor (code improvement without behavior change)
- [ ] Test (adding or updating tests)
- [ ] Documentation (README, comments, etc.)
- [ ] Chore (tooling, dependencies, etc.)

## Checklist

### Test-Driven Development

- [ ] Tests written BEFORE implementation (TDD)
- [ ] All tests passing (`pnpm test`)
- [ ] Test coverage meets requirements (services 100%, components 80%+)

### Code Quality

- [ ] TypeScript strict mode compliance
- [ ] No `any` types (use `unknown` if needed)
- [ ] ESLint passing (`pnpm lint`)
- [ ] Type checking passing (`pnpm type-check`)
- [ ] Build successful (`pnpm build`)

### Design System Compliance

- [ ] Only approved MUI components used
- [ ] Only allowed button variants (3 variants)
- [ ] Only allowed typography variants (h5, h6, body1, body2)
- [ ] Only allowed spacing values (4, 8, 16, 24, 32, 48)
- [ ] No custom colors (theme palette only)
- [ ] No emojis anywhere
- [ ] Material Icons (@mui/icons-material) for icons

### Database (if applicable)

- [ ] Migrations are idempotent
- [ ] RLS policies tested
- [ ] Indexes on foreign keys and common queries

### Documentation

- [ ] Updated relevant documentation
- [ ] Added/updated comments for complex logic
- [ ] Conventional Commits format followed

## Related Issues

<!-- Link to Linear/GitHub issues -->

Closes #

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Additional Notes

<!-- Any other context or considerations -->
