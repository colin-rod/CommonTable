# Definition of Done - CommonTable

This document defines what "done" means at every level of development in CommonTable, from individual features to full releases.

---

## Level 1: Feature/Task Done

A feature or task is considered **done** when ALL of the following criteria are met:

### Code Quality

#### TDD Requirements

- [ ] Written using TDD (RED → GREEN → REFACTOR)
- [ ] All tests passing (unit, integration, E2E where applicable)
- [ ] Test coverage meets requirements:
  - **Services**: 100% coverage
  - **Utils**: 100% coverage
  - **Sync Engine**: 100% coverage
  - **Components**: 80%+ coverage
  - **Edge Functions**: 100% coverage

#### TypeScript Standards

- [ ] No TypeScript errors (strict mode enabled)
- [ ] No linting errors
- [ ] No `any` types used (use `unknown` or proper types instead)
- [ ] Zod schemas used for all runtime validation
- [ ] Discriminated unions used for complex state
- [ ] Readonly types used where applicable

#### Error Handling

- [ ] Error handling implemented with custom error classes (`AppError`, `ValidationError`, `NotFoundError`, etc.)
- [ ] Proper logging (no `console.log` in production code)
- [ ] User-facing error messages are calm and neutral (no emojis)

### Design System Compliance

#### MUI Component Usage

- [ ] Only approved MUI components used (see `DESIGN_SYSTEM.md`)
- [ ] Only allowed button variants:
  - `variant="contained" color="primary"` (Primary action)
  - `variant="outlined" color="primary"` (Secondary action)
  - `variant="contained" color="error"` (Destructive action)
- [ ] Only allowed typography variants: `h5`, `h6`, `body1`, `body2`
- [ ] Only allowed spacing values: 4, 8, 16, 24, 32, 48 (using MUI theme units)

#### Design Constraints

- [ ] Theme color palette used exclusively (no custom hex colors)
- [ ] Elevation ≤ 2
- [ ] No emojis in UI
- [ ] Material Icons (`@mui/icons-material`) used for all icons
- [ ] Content tone is calm and neutral (no playful language or jokes)
- [ ] Max **one** primary button per screen
- [ ] Max **three** typography variants per screen

### Database

#### Migration Quality

- [ ] Migrations are idempotent (use `IF NOT EXISTS` patterns)
- [ ] Down migrations provided for all up migrations
- [ ] RLS policies tested with multiple user roles
- [ ] Indexes added for foreign keys and common queries
- [ ] Transactions used for multi-step operations

### Code Review

#### Pull Request

- [ ] PR created with descriptive title and body
- [ ] Code review checklist completed (see `claude.md`)
- [ ] At least one approval from team member
- [ ] All CI checks passing (when CI/CD implemented)
- [ ] No merge conflicts

### Documentation

#### Code Documentation

- [ ] Inline comments for complex logic
- [ ] README updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Migration notes added (if database changes)

---

## Level 2: Story/Issue Done

A story or issue is considered **done** when ALL of the following criteria are met:

### Completion Criteria

- [ ] All associated features/tasks are done (Level 1 criteria met)
- [ ] Acceptance criteria met (all user stories satisfied)
- [ ] QA flows completed and passing (see `QA_FLOWS.md`)
- [ ] Design review completed (if UI changes)
- [ ] Product owner approval obtained
- [ ] Merged to `main` branch

### Quality Gates

- [ ] No regressions introduced (all existing tests still passing)
- [ ] Performance impact assessed (no significant degradation)
- [ ] Accessibility validated (WCAG 2.1 AA compliance for UI changes)

---

## Level 3: Sprint/Milestone Done

A sprint or milestone is considered **done** when ALL of the following criteria are met:

### Sprint Completion

- [ ] All stories/issues in milestone are done (Level 2 criteria met)
- [ ] Sprint demo completed
- [ ] Retrospective completed
- [ ] Release candidate created
- [ ] Staging environment validated
- [ ] Ready for production release

### Quality Validation

- [ ] Full regression testing completed
- [ ] Performance benchmarks met (Lighthouse score ≥ 90)
- [ ] Security audit completed (no critical vulnerabilities)
- [ ] Cross-browser testing completed

---

## Level 4: Release Done

A release is considered **done** when ALL of the following criteria are met:

### Pre-Release

- [ ] All items in `RELEASE_CHECKLIST.md` completed
- [ ] Release notes drafted and reviewed
- [ ] Changelog updated with user-facing changes

### Deployment

- [ ] Deployed to production
- [ ] Database migrations applied successfully
- [ ] Edge Functions deployed successfully
- [ ] Deployment health checks passing

### Post-Release Validation

- [ ] Post-release validation passed (15-minute health check)
- [ ] Key user flows tested in production
- [ ] Error rates within acceptable limits (<1% error rate)
- [ ] Performance metrics stable (p95 response time <500ms)
- [ ] No critical bugs reported

### Communication

- [ ] Release notes published to users
- [ ] Team notified of release completion
- [ ] Support team briefed on new features/changes

---

## Examples

### Example 1: Feature Done (Create Recipe)

**Scenario**: Implementing "Create Recipe" feature

**Level 1 Checklist:**

- ✅ TDD: Tests written first (RED), implementation (GREEN), refactored (REFACTOR)
- ✅ Test coverage: `RecipeService.create()` has 100% coverage
- ✅ TypeScript: No `any` types, Zod schema for `CreateRecipeInput`
- ✅ MUI: Uses `TextField`, `Button variant="contained" color="primary"`, `Typography variant="h5"`
- ✅ Spacing: Uses theme units (2, 3, 4 → 16px, 24px, 32px)
- ✅ Database: Migration `003_create_recipes.sql` is idempotent, down migration exists
- ✅ PR: Approved, CI passing, no merge conflicts
- ✅ Documentation: Migration notes added

**Result**: Feature is **DONE** at Level 1

### Example 2: Story Done (Recipe Management)

**Scenario**: Completing "Recipe Management" story (create, edit, delete recipes)

**Level 2 Checklist:**

- ✅ All features done: Create (Level 1 ✅), Edit (Level 1 ✅), Delete (Level 1 ✅)
- ✅ Acceptance criteria: All user stories validated
- ✅ QA flows: Manual testing of create/edit/delete flows passing
- ✅ Design review: UI approved by design team
- ✅ Product owner: Approved by PO
- ✅ Merged to `main`

**Result**: Story is **DONE** at Level 2

### Example 3: Release Done (MVP v1.0.0)

**Scenario**: Releasing CommonTable MVP to production

**Level 4 Checklist:**

- ✅ Pre-release: All checklist items completed
- ✅ Deployment: Web app deployed, migrations applied, health checks passing
- ✅ Post-release: 15-minute health check passed, key flows tested, error rate 0.2%
- ✅ Communication: Release notes published, team notified

**Result**: Release is **DONE** at Level 4

---

## Anti-Patterns (What is NOT Done)

### ❌ Feature is NOT Done when:

- Tests fail intermittently ("flaky tests")
- TypeScript errors exist but are suppressed with `@ts-ignore`
- "Works on my machine" but fails in staging
- Custom CSS used instead of MUI theme
- Emojis added to UI
- Migration is not idempotent (fails if run twice)
- PR approved but merge conflicts exist

### ❌ Story is NOT Done when:

- Most acceptance criteria met, but one edge case fails
- QA flows skipped due to time constraints
- Design review pending

### ❌ Release is NOT Done when:

- Deployed but critical bug discovered after 5 minutes
- Error rate spikes to 10% post-deploy
- Performance degraded by 3x
- Release notes not published

---

## FAQ

### Q: What if a feature meets all criteria except one?

**A**: The feature is **NOT done**. All criteria must be met. No exceptions.

### Q: Can we skip tests for "simple" features?

**A**: No. TDD is mandatory for all features. See `claude.md` for TDD requirements.

### Q: What if we're running out of time before a deadline?

**A**: Reduce scope. Cut features that are not done. Never compromise on "done" criteria.

### Q: Can we merge PRs without approval if we're in a hurry?

**A**: No. Code review is mandatory. This prevents bugs and knowledge silos.

### Q: What if the design system doesn't have a component I need?

**A**: Update `DESIGN_SYSTEM.md` first. Get team approval. Then use the new component. Never add unapproved components.

---

## Related Documentation

- [Release Checklist](./RELEASE_CHECKLIST.md)
- [QA Flows](./QA_FLOWS.md)
- [Migration & Rollback Procedures](./MIGRATION_ROLLBACK.md)
- [Development Guide](./claude.md)
- [Design System](./DESIGN_SYSTEM.md)

---

## Summary

**"Done" is not negotiable.** These criteria ensure:

- High code quality
- Predictable user experience
- Low technical debt
- Fast iteration cycles
- Team alignment

When in doubt, ask: **"Would I deploy this to production right now?"**

If the answer is no, it's not done.
