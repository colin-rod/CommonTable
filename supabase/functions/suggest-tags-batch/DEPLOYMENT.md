# Deployment Guide: suggest-tags-batch Edge Function

This guide walks through deploying the AI tag suggestion system to your Supabase project.

## Prerequisites Checklist

- [ ] Supabase CLI installed (`brew install supabase/tap/supabase`)
- [ ] OpenAI API key (get from: https://platform.openai.com/api-keys)
- [ ] Supabase project URL and keys (found in apps/web/.env.local)
- [ ] Database access (via Supabase dashboard or psql)

## Step 1: Set OpenAI API Key

Add the OpenAI API key to Supabase Edge Function secrets:

```bash
cd /Users/colinrodrigues/CommonTable

# Set the secret
supabase secrets set OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY_HERE

# Verify it was set
supabase secrets list
```

Expected output:

```
NAME              VALUE (PREVIEW)
OPENAI_API_KEY    sk-proj-...
```

## Step 2: Deploy Edge Function

Deploy the `suggest-tags-batch` function to your Supabase project:

```bash
# Deploy the function
supabase functions deploy suggest-tags-batch

# Verify deployment
supabase functions list
```

Expected output:

```
NAME                   VERSION    CREATED AT
suggest-tags-batch     1          2026-01-24T...
```

## Step 3: Enable Required PostgreSQL Extensions

Connect to your Supabase database and enable required extensions.

### Option A: Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/lrelbxzvndbmfpxhgosd/database/extensions
2. Enable `pg_cron` extension
3. Enable `http` extension

### Option B: Via SQL Editor

Go to: https://supabase.com/dashboard/project/lrelbxzvndbmfpxhgosd/sql/new

Run:

```sql
-- Enable pg_cron (for scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http (for calling Edge Functions from database)
CREATE EXTENSION IF NOT EXISTS http;

-- Verify extensions are enabled
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pg_cron', 'http');
```

Expected output:

```
 extname  | extversion
----------+------------
 pg_cron  | 1.5
 http     | 1.6
```

## Step 4: Apply Database Migration

Apply the migration that creates batch processing functions.

### Option A: Via Supabase CLI (Recommended)

```bash
cd /Users/colinrodrigues/CommonTable

# Push migration to remote database
supabase db push
```

### Option B: Via SQL Editor

Copy the contents of `supabase/migrations/20260124000001_add_batch_tag_processing.sql` and run it in the Supabase SQL Editor.

## Step 5: Verify Installation

### 5.1: Check Cron Job

```sql
SELECT * FROM cron.job WHERE jobname = 'weekly-tag-suggestions';
```

Expected output:

```
 jobid |      jobname           |   schedule   |              command
-------+------------------------+--------------+-------------------------------------
     1 | weekly-tag-suggestions | 0 2 * * 0    | SELECT process_batch_tag_suggestions();
```

### 5.2: Check Functions

```sql
SELECT proname
FROM pg_proc
WHERE proname IN (
  'get_untagged_recipes',
  'call_suggest_tags_batch',
  'apply_tag_suggestions',
  'process_batch_tag_suggestions'
)
ORDER BY proname;
```

Expected output:

```
          proname
---------------------------
 apply_tag_suggestions
 call_suggest_tags_batch
 get_untagged_recipes
 process_batch_tag_suggestions
```

### 5.3: Test Edge Function Directly

Test the Edge Function with a sample recipe:

```bash
curl -X POST "https://lrelbxzvndbmfpxhgosd.supabase.co/functions/v1/suggest-tags-batch" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZWxieHp2bmRibWZweGhnb3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQ1NTMsImV4cCI6MjA4Mzk2MDU1M30.lIQunAaXYMbubXmdzIXkRcwsy_a3JwoyYbz1-EJf5C4" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZWxieHp2bmRibWZweGhnb3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQ1NTMsImV4cCI6MjA4Mzk2MDU1M30.lIQunAaXYMbubXmdzIXkRcwsy_a3JwoyYbz1-EJf5C4" \
  -d '{
    "recipes": [
      {
        "recipe_id": "00000000-0000-0000-0000-000000000001",
        "household_id": "00000000-0000-0000-0000-000000000001",
        "title": "Pasta Carbonara",
        "ingredients": [
          {"name": "spaghetti", "quantity": 400, "unit": "g"},
          {"name": "eggs", "quantity": 4},
          {"name": "bacon", "quantity": 200, "unit": "g"}
        ],
        "steps": [
          {"position": 1, "text": "Boil pasta"},
          {"position": 2, "text": "Fry bacon"},
          {"position": 3, "text": "Mix and serve"}
        ],
        "version_id": "00000000-0000-0000-0000-000000000001"
      }
    ]
  }'
```

Expected output (example):

```json
{
  "data": {
    "00000000-0000-0000-0000-000000000001": [
      {
        "name": "pasta",
        "confidence": 0.95,
        "household_id": "00000000-0000-0000-0000-000000000001",
        "version_id": "00000000-0000-0000-0000-000000000001"
      },
      {
        "name": "italian",
        "confidence": 0.9,
        "household_id": "00000000-0000-0000-0000-000000000001",
        "version_id": "00000000-0000-0000-0000-000000000001"
      },
      {
        "name": "dinner",
        "confidence": 0.85,
        "household_id": "00000000-0000-0000-0000-000000000001",
        "version_id": "00000000-0000-0000-0000-000000000001"
      }
    ]
  }
}
```

### 5.4: Test Database Function

Manually trigger batch processing (this will process real untagged recipes):

```sql
-- Run batch processing manually
SELECT process_batch_tag_suggestions();

-- Check if tags were applied
SELECT r.id, r.title, r.tags
FROM recipes r
WHERE array_length(r.tags, 1) > 0
ORDER BY r.updated_at DESC
LIMIT 10;
```

## Step 6: Monitor First Run

### View Edge Function Logs

Monitor real-time logs during the first run:

```bash
supabase functions logs suggest-tags-batch --follow
```

Look for:

- "Processing batch of N recipes"
- "Generated N tags: ..."
- "Batch processing complete: N succeeded, N failed"
- "OpenAI tokens used: ..."

### View Cron Job History

Check cron job execution history:

```sql
SELECT
  runid,
  start_time,
  end_time,
  (end_time - start_time) AS duration,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-tag-suggestions')
ORDER BY start_time DESC
LIMIT 5;
```

### Monitor OpenAI Costs

Track OpenAI API usage:

1. Go to: https://platform.openai.com/usage
2. Monitor token usage for the day
3. Estimated cost: ~$0.01-0.03 per recipe

## Troubleshooting

### Issue: "Failed to call Edge Function"

**Debug steps:**

1. Test Edge Function directly via curl (see Step 5.3)

2. Check Edge Function logs:

   ```bash
   supabase functions logs suggest-tags-batch --limit 50
   ```

3. Verify the Edge Function is deployed:
   ```bash
   supabase functions list
   ```

### Issue: "OPENAI_API_KEY environment variable not set"

**Solution:**

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-YOUR_KEY
supabase secrets list
```

### Issue: Cron job not scheduled

**Solution:**

```sql
-- Manually schedule cron job
SELECT cron.schedule(
  'weekly-tag-suggestions',
  '0 2 * * 0',
  'SELECT process_batch_tag_suggestions();'
);
```

## Rollback (If Needed)

If issues arise, disable the cron job immediately:

```sql
SELECT cron.unschedule('weekly-tag-suggestions');
```

To fully remove the feature:

```sql
-- Drop functions
DROP FUNCTION IF EXISTS process_batch_tag_suggestions();
DROP FUNCTION IF EXISTS apply_tag_suggestions(JSONB);
DROP FUNCTION IF EXISTS call_suggest_tags_batch(JSONB);
DROP FUNCTION IF EXISTS get_untagged_recipes(INT);

-- Remove auto-applied tags (optional)
DELETE FROM recipe_version_tags
WHERE created_by = '00000000-0000-0000-0000-000000000000'
AND created_at > '2026-01-24';
```

## Next Steps

After successful deployment:

1. **Monitor first week**: Track OpenAI costs and batch processing success rate
2. **Adjust batch size**: If needed, modify `get_untagged_recipes(batch_size)` default parameter
3. **Review tag quality**: Check auto-applied tags and gather user feedback
4. **Set up alerts**: Configure monitoring for failed cron jobs

## Support

- Supabase Dashboard: https://supabase.com/dashboard/project/lrelbxzvndbmfpxhgosd
- Edge Function Logs: https://supabase.com/dashboard/project/lrelbxzvndbmfpxhgosd/functions
- OpenAI Platform: https://platform.openai.com/usage

## Success Criteria

✅ All checklist items above completed
✅ Cron job scheduled and visible in `cron.job` table
✅ Edge Function responds to curl test successfully
✅ Manual trigger (`SELECT process_batch_tag_suggestions()`) applies tags
✅ Edge Function logs show successful OpenAI API calls
✅ OpenAI usage visible on platform dashboard
