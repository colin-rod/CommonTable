# Authentication Testing Guide

This guide walks through testing the authentication implementation for Issue 1.2.

## Prerequisites

1. **Docker Desktop** must be installed and running
2. **Local Supabase** instance must be set up

## Setup Steps

### 1. Start Docker Desktop

Ensure Docker Desktop is running on your machine.

### 2. Start Local Supabase

```bash
cd /Users/colinrodrigues/CommonTable
npx supabase start
```

This will start local Supabase services on:

- API: http://localhost:54321
- Database: postgresql://postgres:postgres@localhost:54322/postgres
- Studio: http://localhost:54323

### 3. Apply Database Migrations

```bash
npx supabase db reset
```

This applies all migrations including:

- `20260114200140_initial_schema.sql` - Core tables
- `20260114200234_rls_policies.sql` - Row Level Security
- `20260114200325_database_functions.sql` - Database functions
- `20260114211650_auth_triggers.sql` - Auto-create profile trigger (NEW)
- `20260114211710_household_functions.sql` - Auto-create household function (NEW)

### 4. Configure Environment Variables

Create `/Users/colinrodrigues/CommonTable/apps/web/.env.local`:

```env
# Get these from: npx supabase status or Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key-from-dashboard>
SUPABASE_SECRET_KEY=<secret-key-from-dashboard>
```

### 5. Start Development Server

```bash
cd apps/web
pnpm dev
```

App should be running on http://localhost:3000

## Testing Checklist

### Test 1: Sign Up Flow

1. Navigate to http://localhost:3000/auth/signup
2. Fill in the form:
   - Display name: "John Doe"
   - Email: "john@example.com"
   - Password: "password123"
   - Confirm password: "password123"
3. Click "Create account"
4. **Expected**: Redirected to /dashboard
5. **Verify**:
   - User is signed in
   - Display name shown: "John Doe"
   - Household created: "John Doe's Household"
   - Role: "admin"

### Test 2: Sign Out Flow

1. From dashboard, click "Sign out"
2. **Expected**: Redirected to /auth/login

### Test 3: Sign In Flow

1. Navigate to http://localhost:3000/auth/login
2. Fill in the form:
   - Email: "john@example.com"
   - Password: "password123"
3. Click "Sign in"
4. **Expected**: Redirected to /dashboard
5. **Verify**: User data displayed correctly

### Test 4: Invalid Credentials

1. Navigate to http://localhost:3000/auth/login
2. Fill in the form with wrong password:
   - Email: "john@example.com"
   - Password: "wrongpassword"
3. Click "Sign in"
4. **Expected**: Error message "Invalid email or password"

### Test 5: Validation Errors

1. Navigate to http://localhost:3000/auth/signup
2. Try invalid inputs:
   - Email: "not-an-email" → "Invalid email address"
   - Password: "123" → "Password must be at least 8 characters"
   - Passwords don't match → "Passwords do not match"
3. **Expected**: Validation errors shown below each field

### Test 6: Password Reset Flow

1. Navigate to http://localhost:3000/auth/forgot-password
2. Enter email: "john@example.com"
3. Click "Send reset link"
4. **Expected**: Success message shown
5. **Check Supabase local inbox**:
   - Open http://localhost:54324 (Inbucket)
   - Find password reset email
   - Click the reset link
6. **Expected**: Redirected to /auth/reset-password
7. Enter new password
8. Click "Update password"
9. **Expected**: Redirected to /auth/login
10. Sign in with new password
11. **Expected**: Success

### Test 7: Protected Routes (Unauthenticated)

1. Sign out if signed in
2. Navigate to http://localhost:3000/dashboard
3. **Expected**: Redirected to /auth/login?redirectTo=/dashboard

### Test 8: Auth Routes (Authenticated)

1. Sign in
2. Navigate to http://localhost:3000/auth/login
3. **Expected**: Redirected to /dashboard

### Test 9: Session Persistence

1. Sign in
2. Close tab
3. Reopen http://localhost:3000/dashboard
4. **Expected**: Still signed in, user data shown

### Test 10: Duplicate Email

1. Sign out
2. Navigate to /auth/signup
3. Try to create account with existing email
4. **Expected**: Error message "Email already exists"

## Database Verification

You can verify data in Supabase Studio (http://localhost:54323):

### Check Profiles Table

```sql
SELECT * FROM public.profiles;
```

**Expected**: One row with:

- `id`: User UUID
- `display_name`: "John Doe"
- `avatar_url`: NULL
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Check Households Table

```sql
SELECT * FROM public.households;
```

**Expected**: One row with:

- `id`: Household UUID
- `name`: "John Doe's Household"
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Check Household Members Table

```sql
SELECT * FROM public.household_members;
```

**Expected**: One row with:

- `household_id`: Household UUID
- `user_id`: User UUID
- `role`: "admin"
- `joined_at`: Timestamp

### Check Auth Users Table

```sql
SELECT id, email, raw_user_meta_data FROM auth.users;
```

**Expected**: One row with:

- `id`: User UUID
- `email`: "john@example.com"
- `raw_user_meta_data`: `{"display_name": "John Doe"}`

## Troubleshooting

### Issue: "Cannot connect to Supabase"

**Solution**: Ensure Docker Desktop is running and Supabase is started:

```bash
npx supabase status
```

### Issue: "Failed to create household"

**Solution**: Check migration applied correctly:

```bash
npx supabase db reset
```

### Issue: "Profile not found"

**Solution**: Check trigger is working:

```sql
-- In Supabase Studio SQL Editor
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: TypeScript errors

**Solution**: Rebuild packages:

```bash
pnpm --filter @commontable/types build
pnpm --filter @commontable/api-client build
```

### Issue: Session not persisting

**Solution**: Check cookies are enabled in browser and middleware is working.

## Success Criteria

All tests pass:

- ✅ Sign up creates user, profile, and household
- ✅ Sign in authenticates user
- ✅ Sign out clears session
- ✅ Password reset sends email and updates password
- ✅ Protected routes redirect unauthenticated users
- ✅ Auth routes redirect authenticated users
- ✅ Session persists across page reloads
- ✅ Validation errors shown correctly
- ✅ Error handling works properly
- ✅ Material Design 3 compliance (clean, minimal UI)

## Next Steps

After testing passes:

1. Create PR for review
2. Document any edge cases found
3. Plan integration tests (Playwright)
4. Plan email verification flow (Phase 2)
5. Plan invite codes for household joining (Phase 2)
