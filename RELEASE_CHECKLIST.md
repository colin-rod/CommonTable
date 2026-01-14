# CommonTable Release Checklist

This checklist ensures every CommonTable release meets quality, security, and reliability standards before reaching production.

---

## Pre-Release Phase

### Code Quality

- [ ] All Linear issues for milestone completed and verified
- [ ] All PRs merged to `main` branch
- [ ] Code review checklist completed for all PRs
- [ ] No failing tests (`pnpm test` passes)
- [ ] No type errors (`pnpm type-check` passes)
- [ ] No linting errors (`pnpm lint` passes)
- [ ] Test coverage requirements met:
  - Services: 100%
  - Utils: 100%
  - Sync Engine: 100%
  - Components: 80%+
  - Edge Functions: 100%
- [ ] Design system compliance verified (all MUI constraints followed)

---

## Database Migration Validation

### Migration Quality

- [ ] All new migrations are idempotent (use `IF NOT EXISTS` patterns)
- [ ] Down migrations created for all up migrations
- [ ] Migrations tested locally with Supabase CLI
- [ ] RLS policies tested with multiple user roles
- [ ] Indexes added for new foreign keys and common queries
- [ ] Migration rollback tested successfully
- [ ] Database backup created before migration

**Migration Testing Commands:**

```bash
# Test up migration
supabase migration up

# Test down migration (rollback)
supabase migration down

# Verify RLS policies
supabase db test
```

---

## Environment Configuration

### Production Environment

- [ ] Environment variables validated with Zod schema
- [ ] Production environment variables configured in deployment platform
- [ ] Supabase credentials verified (anon key, service role key)
- [ ] API endpoints tested in staging environment
- [ ] Edge Functions deployed and tested

**Verify Environment:**

```bash
# Check environment variables
pnpm run env:check

# Test Supabase connection
pnpm run db:health-check
```

---

## Testing & QA

### Automated Testing

- [ ] All unit tests passing (100% coverage for services/utils)
- [ ] All integration tests passing
- [ ] E2E tests passing (Playwright when implemented)
- [ ] Smoke tests passing in staging environment

### Manual QA

- [ ] Manual QA flows completed (see [QA_FLOWS.md](./QA_FLOWS.md))
- [ ] Cross-browser testing completed:
  - [ ] Chrome (latest)
  - [ ] Safari (latest)
  - [ ] Firefox (latest)
- [ ] Mobile PWA testing completed:
  - [ ] iOS Safari
  - [ ] Android Chrome
- [ ] Offline functionality tested (PWA offline mode)
- [ ] Performance audit completed (Lighthouse score ≥ 90)

**Performance Testing:**

```bash
# Run Lighthouse audit
pnpm run lighthouse

# Check bundle size
pnpm run analyze
```

---

## Security & Compliance

### Security Validation

- [ ] No hardcoded secrets in codebase
- [ ] RLS policies enforce household isolation
- [ ] Authentication flows tested:
  - [ ] Sign up
  - [ ] Login
  - [ ] Logout
  - [ ] Password reset
- [ ] Authorization checks validated (admin-only operations)
- [ ] SQL injection prevention validated (Zod schemas used)
- [ ] XSS prevention validated (no `dangerouslySetInnerHTML`, proper escaping)

**Security Audit:**

```bash
# Check for hardcoded secrets
pnpm run security:audit

# Validate RLS policies
supabase db test
```

---

## Deployment Preparation

### Release Documentation

- [ ] Version number updated in `package.json` (semantic versioning)
- [ ] Changelog updated with user-facing changes (`CHANGELOG.md`)
- [ ] Release notes drafted
- [ ] Deployment runbook reviewed
- [ ] Rollback plan documented (see [MIGRATION_ROLLBACK.md](./MIGRATION_ROLLBACK.md))
- [ ] On-call rotation scheduled (post-launch monitoring)

**Versioning Guidelines:**

- **Major (1.0.0)**: Breaking changes, major features
- **Minor (0.1.0)**: New features, backward compatible
- **Patch (0.0.1)**: Bug fixes, backward compatible

---

## Deployment

### Production Deployment

- [ ] Database migrations applied in production
- [ ] Web app deployed to production
- [ ] Edge Functions deployed to production
- [ ] Deployment health checks passing
- [ ] Smoke tests passing in production
- [ ] Error monitoring active (Sentry or equivalent)

**Deployment Commands:**

```bash
# Apply migrations
supabase db push

# Deploy web app
vercel --prod

# Deploy edge functions
supabase functions deploy
```

---

## Post-Release Validation

### Production Health Check

- [ ] Production health checks passing (15 minutes post-deploy)
- [ ] Key user flows tested in production:
  - [ ] Sign up / Login
  - [ ] Create recipe
  - [ ] View calendar
  - [ ] Offline functionality
- [ ] Error rates within acceptable limits (<1% error rate)
- [ ] Performance metrics stable (p95 response time <500ms)
- [ ] No critical bugs reported
- [ ] Rollback plan ready (if issues arise)

**Monitoring:**

```bash
# Check error rates
pnpm run monitor:errors

# Check performance metrics
pnpm run monitor:performance
```

---

## Communication

### Release Announcement

- [ ] Release notes published to users
- [ ] Team notified of release completion
- [ ] Support team briefed on new features/changes
- [ ] Documentation updated (if applicable)

---

## Rollback Criteria

Trigger rollback if ANY of the following occur:

- **Critical bug** preventing core functionality (auth, recipe creation, calendar)
- **Error rate** exceeds 5% for more than 5 minutes
- **Performance degradation** exceeds 2x baseline (p95 response time)
- **Data loss** or corruption detected
- **Security vulnerability** discovered

**Rollback Procedure:**
See [MIGRATION_ROLLBACK.md](./MIGRATION_ROLLBACK.md) for detailed instructions.

---

## Release Sign-Off

**Release Manager:** ****\*\*****\_****\*\***** **Date:** \***\*\_\*\***

**Engineering Lead:** ****\*\*****\_****\*\***** **Date:** \***\*\_\*\***

**Product Owner:** ****\*\*****\_****\*\***** **Date:** \***\*\_\*\***

---

## Appendix

### Related Documentation

- [Definition of Done](./DEFINITION_OF_DONE.md)
- [QA Flows](./QA_FLOWS.md)
- [Migration & Rollback Procedures](./MIGRATION_ROLLBACK.md)
- [Development Guide](./claude.md)

### Support Contacts

- **On-Call Engineer**: [Slack channel or phone]
- **DevOps**: [Contact info]
- **Product Owner**: [Contact info]
