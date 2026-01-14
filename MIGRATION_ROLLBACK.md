# Migration & Rollback Procedures - CommonTable

This document provides procedures for safely applying database migrations and rolling back when issues occur.

---

## Table of Contents

1. [Migration Best Practices](#migration-best-practices)
2. [Migration Workflow](#migration-workflow)
3. [Rollback Procedures](#rollback-procedures)
4. [Migration Checklist](#migration-checklist)
5. [Common Scenarios](#common-scenarios)

---

## Migration Best Practices

### 1. Idempotency

**All migrations MUST be idempotent** (can be run multiple times without errors).

#### Pattern: Creating Tables

```sql
-- BAD: Fails if table already exists
CREATE TABLE recipes (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL
);

-- GOOD: Idempotent
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL
);
```

#### Pattern: Adding Columns

```sql
-- GOOD: Idempotent column addition
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'tags'
  ) THEN
    ALTER TABLE recipes ADD COLUMN tags TEXT[];
  END IF;
END $$;
```

#### Pattern: Creating Indexes

```sql
-- GOOD: Idempotent index creation
CREATE INDEX IF NOT EXISTS idx_recipes_household
  ON recipes(household_id);
```

#### Pattern: Creating Functions

```sql
-- GOOD: Replace function if exists
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 2. Naming Conventions

**Format**: `{number}_{descriptive_name}.sql`

**Examples**:
- `001_initial_schema.sql`
- `002_rls_policies.sql`
- `003_add_recipe_forks.sql`
- `004_add_search_tsvector.sql`

**Down Migrations**: `{number}_{descriptive_name}_down.sql`
- `003_add_recipe_forks_down.sql`

### 3. Transaction Safety

**All migrations should run in a transaction** (Supabase does this automatically for `.sql` files).

```sql
-- If running manually, wrap in transaction
BEGIN;

-- Migration statements here
CREATE TABLE IF NOT EXISTS recipes (...);
CREATE INDEX IF NOT EXISTS idx_recipes_household ON recipes(household_id);

COMMIT;
```

### 4. Testing Locally

**Always test migrations locally before production.**

```bash
# Start local Supabase
supabase start

# Apply migration
supabase migration up

# Verify migration succeeded
supabase db dump

# Test down migration (rollback)
supabase migration down

# Verify rollback succeeded
supabase db dump
```

### 5. Backup Before Migrations

**CRITICAL: Always backup production database before migrations.**

```bash
# Create production backup via Supabase Dashboard:
# 1. Go to Database > Backups
# 2. Click "Create Backup"
# 3. Wait for backup to complete
# 4. Verify backup created

# OR use pg_dump (if you have direct access)
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Migration Workflow

### Phase 1: Development

1. **Create Migration File**

```bash
# Create migration using Supabase CLI
supabase migration new add_recipe_tags

# This creates: supabase/migrations/YYYYMMDDHHMMSS_add_recipe_tags.sql
```

2. **Write Migration**

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_recipe_tags.sql

-- Add tags column to recipes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'tags'
  ) THEN
    ALTER TABLE recipes ADD COLUMN tags TEXT[];
  END IF;
END $$;

-- Add index for tag searches
CREATE INDEX IF NOT EXISTS idx_recipes_tags
  ON recipes USING GIN(tags);
```

3. **Create Down Migration**

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_recipe_tags_down.sql

-- Remove index
DROP INDEX IF EXISTS idx_recipes_tags;

-- Remove column
ALTER TABLE recipes DROP COLUMN IF EXISTS tags;
```

4. **Test Locally**

```bash
# Apply migration
supabase migration up

# Verify in local database
supabase db dump | grep tags

# Test rollback
supabase migration down

# Verify rollback succeeded
supabase db dump | grep tags  # Should return nothing
```

### Phase 2: Staging

1. **Apply to Staging**

```bash
# Deploy migration to staging
supabase db push --project-ref your-staging-project

# OR use CI/CD pipeline (recommended)
git push origin develop  # Triggers staging deployment
```

2. **Validate in Staging**

- [ ] Verify migration applied successfully
- [ ] Verify application still works
- [ ] Run QA flows (see [QA_FLOWS.md](./QA_FLOWS.md))
- [ ] Verify RLS policies still enforce isolation
- [ ] Check error logs for migration-related errors

3. **Test Rollback in Staging**

```bash
# Apply down migration in staging
supabase db push --project-ref your-staging-project --sql-file supabase/migrations/YYYYMMDDHHMMSS_add_recipe_tags_down.sql

# Verify rollback succeeded
# Verify application still works after rollback
```

### Phase 3: Production

1. **Create Backup** (CRITICAL)

```bash
# Via Supabase Dashboard:
# Database > Backups > Create Backup
```

2. **Apply Migration**

```bash
# Deploy migration to production
supabase db push --project-ref your-production-project

# OR use CI/CD pipeline (recommended)
git push origin main  # Triggers production deployment
```

3. **Validate in Production**

- [ ] Verify migration applied successfully
- [ ] Run smoke tests (see [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md))
- [ ] Monitor error rates for 15 minutes
- [ ] Verify application functionality

4. **Post-Migration Monitoring**

```bash
# Monitor error logs
supabase logs --project-ref your-production-project --tail

# Check database performance
# Supabase Dashboard > Database > Performance
```

---

## Rollback Procedures

### When to Rollback

Rollback immediately if ANY of the following occur:

- **Migration failed** to apply
- **Critical bug** discovered after migration
- **Data corruption** detected
- **Error rate** exceeds 5% for more than 5 minutes
- **Performance degradation** exceeds 2x baseline

### Rollback Options

#### Option 1: Down Migration (Preferred)

**Use when**: Migration can be cleanly reversed with down migration

```bash
# Apply down migration
supabase db push --project-ref your-production-project --sql-file supabase/migrations/YYYYMMDDHHMMSS_migration_name_down.sql

# Verify rollback succeeded
# Monitor error rates
# Verify application functionality
```

#### Option 2: Database Restore from Backup

**Use when**: Down migration not available or migration caused data corruption

```bash
# Via Supabase Dashboard:
# 1. Go to Database > Backups
# 2. Select backup created before migration
# 3. Click "Restore"
# 4. Confirm restoration
# 5. Wait for restore to complete

# WARNING: This will lose ALL data changes since backup
```

#### Option 3: Code Rollback (No Database Changes)

**Use when**: Migration succeeded but code change caused issues

```bash
# Revert code deployment (Vercel example)
vercel rollback

# OR redeploy previous version
git revert HEAD
git push origin main
```

### Rollback Checklist

- [ ] **Assess impact**: Determine severity and scope
- [ ] **Notify team**: Alert engineering and product teams
- [ ] **Choose rollback method**: Down migration, restore, or code rollback
- [ ] **Execute rollback**: Follow procedure above
- [ ] **Verify rollback**: Confirm application functionality restored
- [ ] **Monitor for 15 minutes**: Ensure error rates return to normal
- [ ] **Post-mortem**: Document what went wrong and how to prevent

---

## Migration Checklist

Before applying any migration to production, complete this checklist:

### Pre-Migration
- [ ] Migration written with idempotent patterns (uses `IF NOT EXISTS`, `IF EXISTS`, etc.)
- [ ] Down migration created and tested
- [ ] Migration tested locally with `supabase migration up` and `down`
- [ ] Migration reviewed by team member
- [ ] Migration applied to staging environment
- [ ] QA flows completed in staging (see [QA_FLOWS.md](./QA_FLOWS.md))
- [ ] Production backup created (verify backup completed)

### Migration Execution
- [ ] Migration applied to production (`supabase db push` or CI/CD)
- [ ] Migration logs reviewed (no errors)
- [ ] Smoke tests passed (see [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md))

### Post-Migration
- [ ] Production health check passed (15-minute monitoring)
- [ ] Error rates within acceptable limits (<1% error rate)
- [ ] Performance metrics stable (p95 response time <500ms)
- [ ] Application functionality verified (run critical QA flows)
- [ ] Team notified of successful migration

---

## Common Scenarios

### Scenario 1: Adding a New Table

**Migration**:
```sql
-- 005_add_recipe_forks.sql
CREATE TABLE IF NOT EXISTS recipe_forks (
  parent_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  child_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  forked_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  forked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (parent_recipe_id, child_recipe_id)
);

-- Add index for foreign keys
CREATE INDEX IF NOT EXISTS idx_recipe_forks_parent
  ON recipe_forks(parent_recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_forks_child
  ON recipe_forks(child_recipe_id);

-- Enable RLS
ALTER TABLE recipe_forks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access forks in their household
CREATE POLICY recipe_forks_household_isolation ON recipe_forks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_forks.parent_recipe_id
        AND r.household_id = get_user_household_id()
    )
  );
```

**Down Migration**:
```sql
-- 005_add_recipe_forks_down.sql
DROP TABLE IF EXISTS recipe_forks;
```

### Scenario 2: Adding a Column

**Migration**:
```sql
-- 006_add_recipe_tags.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'tags'
  ) THEN
    ALTER TABLE recipes ADD COLUMN tags TEXT[];
  END IF;
END $$;

-- Add index for tag searches
CREATE INDEX IF NOT EXISTS idx_recipes_tags
  ON recipes USING GIN(tags);
```

**Down Migration**:
```sql
-- 006_add_recipe_tags_down.sql
DROP INDEX IF EXISTS idx_recipes_tags;
ALTER TABLE recipes DROP COLUMN IF EXISTS tags;
```

### Scenario 3: Adding RLS Policies

**Migration**:
```sql
-- 007_add_admin_only_policy.sql
CREATE POLICY household_members_admin_only ON household_members
  FOR INSERT
  WITH CHECK (
    household_id = get_user_household_id() AND
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'admin'
    )
  );
```

**Down Migration**:
```sql
-- 007_add_admin_only_policy_down.sql
DROP POLICY IF EXISTS household_members_admin_only ON household_members;
```

### Scenario 4: Data Migration

**Migration**:
```sql
-- 008_migrate_old_ingredient_format.sql
-- Example: Migrate from TEXT to JSONB

-- Add new column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipe_versions' AND column_name = 'ingredients_jsonb'
  ) THEN
    ALTER TABLE recipe_versions ADD COLUMN ingredients_jsonb JSONB;
  END IF;
END $$;

-- Migrate data from old column to new column
UPDATE recipe_versions
SET ingredients_jsonb = to_jsonb(ingredients_text::json)
WHERE ingredients_jsonb IS NULL AND ingredients_text IS NOT NULL;

-- Drop old column (optional, can defer to future migration)
-- ALTER TABLE recipe_versions DROP COLUMN IF EXISTS ingredients_text;
```

**Down Migration**:
```sql
-- 008_migrate_old_ingredient_format_down.sql
-- Restore old column from new column
UPDATE recipe_versions
SET ingredients_text = ingredients_jsonb::text
WHERE ingredients_text IS NULL AND ingredients_jsonb IS NOT NULL;

-- Drop new column
ALTER TABLE recipe_versions DROP COLUMN IF EXISTS ingredients_jsonb;
```

### Scenario 5: Migration Failed Mid-Execution

**Problem**: Migration partially applied, left database in inconsistent state

**Solution**:
1. **If Supabase transaction failed**: Supabase automatically rolls back failed migrations
2. **If manual migration failed**:

```sql
-- Manually rollback by running down migration
BEGIN;

-- Run down migration statements here
DROP TABLE IF EXISTS new_table;
ALTER TABLE old_table DROP COLUMN IF EXISTS new_column;

COMMIT;
```

3. **If down migration also fails**: Restore from backup (see Option 2 above)

---

## Emergency Contacts

In case of migration emergency:

- **On-Call Engineer**: [Slack channel or phone]
- **DevOps Lead**: [Contact info]
- **Database Admin**: [Contact info]
- **Supabase Support**: support@supabase.io (Enterprise plan only)

---

## Post-Mortem Template

After any rollback, complete a post-mortem:

### What Happened?
- [ ] Describe the issue
- [ ] Timeline of events
- [ ] Impact on users

### Root Cause
- [ ] Why did the migration fail?
- [ ] What was overlooked?

### Resolution
- [ ] How was it resolved?
- [ ] How long did it take?

### Preventive Measures
- [ ] What can we do to prevent this in the future?
- [ ] Update checklist or procedures
- [ ] Add automated tests

---

## Related Documentation

- [Release Checklist](./RELEASE_CHECKLIST.md)
- [Definition of Done](./DEFINITION_OF_DONE.md)
- [QA Flows](./QA_FLOWS.md)
- [Development Guide](./claude.md) - Migration patterns (lines 1034-1145)

---

## Summary

**Migration Safety = Idempotency + Testing + Backups + Rollback Plan**

Never skip:
1. Idempotent migration patterns
2. Down migrations
3. Local testing
4. Staging validation
5. Production backup
6. Post-migration monitoring

When in doubt, rollback. Better to rollback quickly than debug in production.
