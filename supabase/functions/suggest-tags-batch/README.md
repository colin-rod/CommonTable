# suggest-tags-batch Edge Function

AI-powered batch tag suggestion system for CommonTable recipes using OpenAI GPT-4-turbo.

## Overview

This Edge Function generates intelligent tag suggestions for recipes that don't have tags yet. It runs weekly via pg_cron and processes recipes in batches of 20.

**Key Features:**

- Generates top 3 tag suggestions per recipe
- Prefers existing household tags to maintain consistency
- Creates new canonical tags when appropriate
- Returns confidence scores for each suggestion
- Handles errors gracefully (continues batch processing even if individual recipes fail)

## Architecture

```
Weekly pg_cron Job (Sunday 2am UTC)
         ↓
Database Function: process_batch_tag_suggestions()
         ↓
Database Function: call_suggest_tags_batch() via HTTP extension
         ↓
Edge Function: suggest-tags-batch (this function)
         ↓
OpenAI API: GPT-4-turbo with structured outputs
         ↓
Database Function: apply_tag_suggestions()
         ↓
Tags applied to recipes
```

## API Specification

### Request

**Method:** `POST`

**Endpoint:** `/functions/v1/suggest-tags-batch`

**Headers:**

- `Authorization: Bearer <supabase-anon-key>`
- `Content-Type: application/json`
- `apikey: <supabase-anon-key>`

**Body:**

```json
{
  "recipes": [
    {
      "recipe_id": "uuid",
      "household_id": "uuid",
      "title": "Pasta Carbonara",
      "ingredients": [
        {
          "name": "spaghetti",
          "quantity": 400,
          "unit": "g"
        },
        {
          "name": "eggs",
          "quantity": 4
        }
      ],
      "steps": [
        {
          "position": 1,
          "text": "Boil pasta in salted water"
        },
        {
          "position": 2,
          "text": "Fry bacon until crispy"
        }
      ],
      "version_id": "uuid"
    }
  ]
}
```

**Validation:**

- Max 20 recipes per batch
- All UUIDs must be valid
- Title required (1-200 characters)
- Ingredients and steps can be empty arrays

### Response

**Success (200):**

```json
{
  "data": {
    "recipe_id_1": [
      {
        "name": "pasta",
        "confidence": 0.95,
        "household_id": "uuid",
        "version_id": "uuid"
      },
      {
        "name": "italian",
        "confidence": 0.90,
        "household_id": "uuid",
        "version_id": "uuid"
      },
      {
        "name": "dinner",
        "confidence": 0.85,
        "household_id": "uuid",
        "version_id": "uuid"
      }
    ],
    "recipe_id_2": [...]
  }
}
```

**Error (400, 500):**

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "metadata": {}
}
```

## Deployment

### 1. Prerequisites

Ensure you have:

- Supabase CLI installed
- OpenAI API key
- Supabase project with Edge Functions enabled

### 2. Set Environment Secrets

Add the OpenAI API key to Supabase Edge Function secrets:

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

Verify secrets:

```bash
supabase secrets list
```

### 3. Deploy Edge Function

Deploy the function to your Supabase project:

```bash
supabase functions deploy suggest-tags-batch
```

### 4. Configure Database Settings

Connect to your Supabase database and configure app settings:

```sql
-- Set Edge Function URL
ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://your-project.supabase.co/functions/v1';

-- Set Supabase anon key
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'your-anon-key';

-- Verify configuration
SELECT name, setting FROM pg_settings WHERE name LIKE 'app.settings%';
```

### 5. Enable Extensions

Ensure required PostgreSQL extensions are enabled:

```sql
-- Enable pg_cron (for scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http (for calling Edge Functions from database)
CREATE EXTENSION IF NOT EXISTS http;
```

### 6. Apply Migration

Apply the database migration to create batch processing functions:

```bash
supabase db reset  # Development only
# OR
psql $DATABASE_URL < supabase/migrations/20260124000001_add_batch_tag_processing.sql
```

### 7. Verify Cron Job

Check that the weekly cron job is scheduled:

```sql
SELECT * FROM cron.job WHERE jobname = 'weekly-tag-suggestions';
```

Expected output:

```
 jobid |      jobname         |   schedule   |              command
-------+----------------------+--------------+-------------------------------------
  1234 | weekly-tag-suggestions | 0 2 * * 0   | SELECT process_batch_tag_suggestions();
```

## Testing

### Manual Trigger

Manually trigger batch processing (bypasses cron schedule):

```sql
SELECT process_batch_tag_suggestions();
```

Check results:

```sql
SELECT r.id, r.title, r.tags
FROM recipes r
WHERE array_length(r.tags, 1) > 0
ORDER BY r.updated_at DESC
LIMIT 10;
```

### Direct Edge Function Test

Test the Edge Function directly with curl:

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/suggest-tags-batch" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "recipes": [
      {
        "recipe_id": "123e4567-e89b-12d3-a456-426614174000",
        "household_id": "987fcdeb-51a2-43d7-8901-234567890abc",
        "title": "Pasta Carbonara",
        "ingredients": [
          {"name": "spaghetti", "quantity": 400, "unit": "g"},
          {"name": "eggs", "quantity": 4},
          {"name": "bacon", "quantity": 200, "unit": "g"}
        ],
        "steps": [
          {"position": 1, "text": "Boil pasta in salted water"},
          {"position": 2, "text": "Fry bacon until crispy"},
          {"position": 3, "text": "Mix eggs with cheese"},
          {"position": 4, "text": "Combine everything and serve"}
        ],
        "version_id": "456e7890-ab12-34cd-5678-901234567def"
      }
    ]
  }'
```

### View Edge Function Logs

Monitor real-time logs:

```bash
supabase functions logs suggest-tags-batch --follow
```

View recent logs:

```bash
supabase functions logs suggest-tags-batch --limit 50
```

### View Cron Job History

Check recent cron job executions:

```sql
SELECT
  jobid,
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-tag-suggestions')
ORDER BY start_time DESC
LIMIT 10;
```

## Monitoring

### OpenAI API Costs

Track token usage in Edge Function logs:

```bash
supabase functions logs suggest-tags-batch | grep "OpenAI tokens used"
```

**Cost Estimation (GPT-4-turbo):**

- ~500 tokens input per recipe (title + ingredients + steps + system prompt)
- ~100 tokens output per recipe (3 tags + confidence + reasoning)
- Cost: ~$0.01-0.03 per recipe

**Weekly batch (estimate):**

- 50 untagged recipes per week
- Weekly cost: $0.50-$1.50
- Monthly cost: $2-$6

### Performance Metrics

Monitor batch processing time:

```sql
SELECT
  jobid,
  start_time,
  end_time,
  (end_time - start_time) AS duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-tag-suggestions')
ORDER BY start_time DESC
LIMIT 10;
```

### Error Tracking

Find failed cron jobs:

```sql
SELECT *
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-tag-suggestions')
  AND status != 'succeeded'
ORDER BY start_time DESC;
```

## Troubleshooting

### Issue: "OPENAI_API_KEY environment variable not set"

**Solution:** Add the secret to Supabase Edge Functions:

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

### Issue: "Missing app settings: edge_function_url"

**Solution:** Configure database settings:

```sql
ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://your-project.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'your-anon-key';
```

### Issue: "Failed to call Edge Function"

**Possible causes:**

1. Edge Function not deployed
2. Incorrect Edge Function URL in app settings
3. Network connectivity issues
4. Edge Function timeout (>60 seconds)

**Debug steps:**

```sql
-- Check app settings
SELECT name, setting FROM pg_settings WHERE name LIKE 'app.settings%';

-- Test Edge Function directly via curl (see Testing section)

-- Check Edge Function logs
-- (via Supabase dashboard or CLI)
```

### Issue: OpenAI API rate limit exceeded

**Solution:** Reduce batch size or processing frequency:

```sql
-- Reduce batch size to 10 recipes
CREATE OR REPLACE FUNCTION get_untagged_recipes(batch_size INT DEFAULT 10)
...

-- Change cron schedule to bi-weekly (every other Sunday)
SELECT cron.unschedule('weekly-tag-suggestions');
SELECT cron.schedule(
  'weekly-tag-suggestions',
  '0 2 1,15 * *',  -- 1st and 15th of each month
  'SELECT process_batch_tag_suggestions();'
);
```

### Issue: Duplicate tags created

**Cause:** Race condition when multiple processes call `get_or_create_tag()` concurrently

**Prevention:** The `get_or_create_tag()` function uses a unique constraint on `(household_id, LOWER(name))` to prevent duplicates. Conflicts are handled with `ON CONFLICT DO NOTHING`.

## Rollback

If issues arise, disable the cron job immediately:

```sql
SELECT cron.unschedule('weekly-tag-suggestions');
```

To remove auto-applied tags (if needed):

```sql
-- Remove tags created by system user after feature deployment
DELETE FROM recipe_version_tags
WHERE created_by = '00000000-0000-0000-0000-000000000000'
AND created_at > '2026-01-24';  -- Deployment date
```

To fully revert the feature:

```bash
# Development only
supabase db reset

# Production: manually drop functions and cron job
psql $DATABASE_URL -c "SELECT cron.unschedule('weekly-tag-suggestions');"
psql $DATABASE_URL -c "DROP FUNCTION IF EXISTS process_batch_tag_suggestions();"
psql $DATABASE_URL -c "DROP FUNCTION IF EXISTS apply_tag_suggestions(JSONB);"
psql $DATABASE_URL -c "DROP FUNCTION IF EXISTS call_suggest_tags_batch(JSONB);"
psql $DATABASE_URL -c "DROP FUNCTION IF EXISTS get_untagged_recipes(INT);"
```

## Future Enhancements

1. **User Feedback Loop**: Track accepted/rejected suggestions in `ai_tag_suggestions` table
2. **Confidence Thresholds**: Only auto-apply tags with confidence > 0.7
3. **Tag Clustering**: Suggest merging similar tags (e.g., "pasta" vs "noodles")
4. **Multi-Language Support**: Translate tags to user's preferred language
5. **Manual Trigger UI**: Admin button to trigger batch processing on-demand

## Related Files

| File                                                              | Purpose                                 |
| ----------------------------------------------------------------- | --------------------------------------- |
| `index.ts`                                                        | Main Edge Function handler              |
| `schema.ts`                                                       | Zod schemas for input/output validation |
| `openai.ts`                                                       | OpenAI API integration                  |
| `README.md`                                                       | This file                               |
| `supabase/migrations/20260124000001_add_batch_tag_processing.sql` | Database migration                      |
