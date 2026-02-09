# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CommonTable CI/CD automation.

## Active Workflows

### 1. CI Pipeline ([`ci.yml`](ci.yml))

**Purpose**: Continuous Integration for all pull requests and pushes to `development`/`main`.

**Triggers**:

- Pull requests to `development` or `main`
- Push to `development` or `main`

**Jobs**:

1. **Setup** - Install dependencies, configure caching
2. **Lint** - Run ESLint across all packages
3. **Type Check** - Validate TypeScript types
4. **Test** - Run test suite with coverage
5. **Build** - Build all packages and verify Next.js standalone build

**Concurrency**: Cancels in-progress runs when new commits are pushed to the same PR/branch.

**Secrets Required**: None

---

### 2. Edge Function JWT Management ([`manage-edge-function-jwt.yml`](manage-edge-function-jwt.yml))

**Purpose**: Automatically deploy Edge Functions and disable JWT legacy secret verification.

**Triggers**:

- Push to `development` branch
- Files in `supabase/functions/**` are modified

**Jobs**:

1. **Detect Changes** - Identify which Edge Functions were modified
2. **Deploy Functions** - Deploy changed functions to Supabase with `--no-verify-jwt` flag
3. **Disable JWT Legacy Secret** - Call Supabase Management API to set `verify_jwt: false`
4. **Verify Configuration** - Confirm JWT verification is disabled
5. **Deployment Summary** - Generate summary in GitHub Actions UI

**Concurrency**: Cancels in-progress runs for the same branch.

**Secrets Required**:
| Secret Name | Description | Where to Get It |
|------------|-------------|-----------------|
| `SUPABASE_DEV_ACCESS_TOKEN` | Supabase Management API token | [Supabase Dashboard](https://app.supabase.com) → Account Settings → Access Tokens (requires "Management API" scope) |
| `SUPABASE_DEV_PROJECT_REF` | Development project reference ID | Supabase Dashboard → Project Settings → General → Reference ID |

**Key Features**:

- Deploys only changed functions (faster feedback)
- Retry logic for transient API failures (max 3 retries)
- Non-blocking JWT configuration (logs warnings but doesn't fail workflow)
- Automatic verification after configuration

**Why This Exists**: Supabase's dashboard setting "Verify JWT with legacy secret" is automatically enabled when Edge Functions are deployed. This workflow ensures it's always disabled for development, eliminating the need for manual dashboard configuration after every deployment.

---

### 3. Deploy Preview ([`deploy-preview.yml`](deploy-preview.yml))

**Purpose**: Placeholder for future Vercel preview deployments.

**Triggers**:

- Pull requests to `development` or `main`

**Status**: ⚠️ **Not yet implemented** - Currently a placeholder that comments on PRs.

**Planned Features**:

- Automatic preview deployment on PR
- Preview URL comment on PR
- Environment variable injection
- Supabase migration preview

**Secrets Required**: TBD (Vercel integration)

---

### 4. Deploy Production ([`deploy-production.yml`](deploy-production.yml))

**Purpose**: Placeholder for future Vercel production deployments.

**Triggers**:

- Push to `main` branch
- Manual workflow dispatch

**Status**: ⚠️ **Not yet implemented** - Currently a placeholder that logs planned features.

**Planned Features**:

- Automatic production deployment on push to main
- Supabase migration execution
- Environment variable validation
- Deployment status notifications

**Secrets Required**: TBD (Vercel integration, production Supabase tokens)

---

## Workflow Execution Logs

View workflow runs in the GitHub Actions tab:

- [CI Runs](https://github.com/colin-rod/CommonTable/actions/workflows/ci.yml)
- [Edge Function JWT Management Runs](https://github.com/colin-rod/CommonTable/actions/workflows/manage-edge-function-jwt.yml)

## Adding New Workflows

When creating new workflows:

1. **Follow Naming Convention**: Use kebab-case (e.g., `deploy-staging.yml`)
2. **Add Concurrency Control**: Prevent wasted resources by canceling in-progress runs
3. **Use Existing Actions**: Prefer GitHub Actions marketplace actions (e.g., `actions/checkout@v4`)
4. **Document Secrets**: Update this README with required secrets
5. **Add to CLAUDE.md**: Document the workflow in the project guide
6. **Test in Feature Branch First**: Ensure workflow works before merging to `development`

### Example Concurrency Block

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

## GitHub Secrets Management

### Adding Secrets

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret"
3. Add secret name and value
4. Secrets are encrypted and only exposed to workflow runs

### Secret Naming Convention

| Prefix            | Purpose                          | Example                      |
| ----------------- | -------------------------------- | ---------------------------- |
| `SUPABASE_DEV_*`  | Development environment Supabase | `SUPABASE_DEV_ACCESS_TOKEN`  |
| `SUPABASE_PROD_*` | Production environment Supabase  | `SUPABASE_PROD_ACCESS_TOKEN` |
| `VERCEL_*`        | Vercel deployment tokens         | `VERCEL_TOKEN`               |
| `OPENAI_*`        | OpenAI API keys                  | `OPENAI_API_KEY`             |

### Security Best Practices

- ✅ **Use least-privilege tokens** - Only grant necessary permissions
- ✅ **Rotate tokens regularly** - Every 90 days minimum
- ✅ **Never commit secrets to code** - Always use GitHub Secrets
- ✅ **Audit secret access** - Restrict who can modify secrets
- ✅ **Use environment-specific secrets** - Separate dev/prod credentials

## Troubleshooting

### Workflow Not Triggering

**Check**:

1. Workflow file path is correct: `.github/workflows/<name>.yml`
2. Trigger conditions match the event (e.g., `branches: [development]`)
3. Path filters are correct (e.g., `paths: ['supabase/functions/**']`)

**Debugging**:

- View workflow runs in GitHub Actions tab
- Check workflow syntax with [actionlint](https://github.com/rhysd/actionlint)

### Secrets Not Available

**Check**:

1. Secret is defined in repository settings
2. Secret name matches exactly (case-sensitive)
3. Workflow has permission to access secrets

**Debugging**:

- Secrets are masked in logs (show as `***`)
- Use `echo "Secret exists: ${{ secrets.SECRET_NAME != '' }}"` to verify (doesn't expose value)

### Workflow Fails on External API Calls

**Common Issues**:

- Invalid or expired API tokens
- Rate limiting (Supabase Management API)
- Network timeouts

**Solutions**:

- Check token validity in Supabase dashboard
- Add retry logic with exponential backoff
- Increase timeout for long-running operations

## Further Reading

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Management API Reference](https://supabase.com/docs/reference/api/introduction)
- [CommonTable Development Guide](../../CLAUDE.md)
