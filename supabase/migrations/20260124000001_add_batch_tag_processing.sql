-- Migration: Add batch tag processing with pg_cron
-- Purpose: Enable weekly automated tag suggestions for untagged recipes
-- Date: 2026-01-24

-- =====================================================================
-- STEP 1: Enable Required Extensions
-- =====================================================================

-- Enable pg_cron for scheduled jobs (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension for calling Edge Functions from Postgres
CREATE EXTENSION IF NOT EXISTS http;

-- =====================================================================
-- STEP 2: Helper Function - Find Untagged Recipes
-- =====================================================================

CREATE OR REPLACE FUNCTION get_untagged_recipes(batch_size INT DEFAULT 20)
RETURNS TABLE (
  recipe_id UUID,
  household_id UUID,
  title TEXT,
  ingredients_json JSONB,
  steps_json JSONB,
  version_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS recipe_id,
    r.household_id,
    r.title,
    rv.ingredients_json,
    rv.steps_json,
    rv.id AS version_id
  FROM recipes r
  JOIN recipe_versions rv ON rv.id = r.current_version_id
  LEFT JOIN recipe_version_tags rvt ON rvt.recipe_version_id = rv.id
  WHERE rvt.id IS NULL  -- No tags yet
  GROUP BY r.id, rv.id
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_untagged_recipes IS
'Finds recipes that have no tags assigned (up to batch_size limit)';

-- =====================================================================
-- STEP 3: HTTP Caller - Invoke Edge Function
-- =====================================================================

CREATE OR REPLACE FUNCTION call_suggest_tags_batch(
  p_recipes JSONB
) RETURNS JSONB AS $$
DECLARE
  v_edge_function_url TEXT := 'https://lrelbxzvndbmfpxhgosd.supabase.co/functions/v1/suggest-tags-batch';
  v_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZWxieHp2bmRibWZweGhnb3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQ1NTMsImV4cCI6MjA4Mzk2MDU1M30.lIQunAaXYMbubXmdzIXkRcwsy_a3JwoyYbz1-EJf5C4';
  v_response http_response;
  v_response_body JSONB;
BEGIN
  -- Call Edge Function via HTTP POST
  SELECT * INTO v_response
  FROM http((
    'POST',
    v_edge_function_url,
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_anon_key),
      http_header('Content-Type', 'application/json'),
      http_header('apikey', v_anon_key)
    ],
    'application/json',
    jsonb_build_object('recipes', p_recipes)::TEXT
  )::http_request);

  -- Check HTTP status
  IF v_response.status < 200 OR v_response.status >= 300 THEN
    RAISE EXCEPTION 'Edge Function request failed: % %', v_response.status, v_response.content;
  END IF;

  -- Parse response body
  v_response_body := v_response.content::JSONB;

  RETURN v_response_body;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION call_suggest_tags_batch IS
'Calls the suggest-tags-batch Edge Function with a batch of recipes';

-- =====================================================================
-- STEP 4: Apply Tag Suggestions to Recipes
-- =====================================================================

CREATE OR REPLACE FUNCTION apply_tag_suggestions(
  p_suggestions JSONB
) RETURNS void AS $$
DECLARE
  v_recipe_id TEXT;
  v_recipe_suggestions JSONB;
  v_tag JSONB;
  v_tag_name TEXT;
  v_household_id UUID;
  v_version_id UUID;
  v_tag_id UUID;
  v_system_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
BEGIN
  -- Iterate over each recipe's suggestions
  -- p_suggestions format: { "recipe_id": [{ name, confidence, household_id, version_id }, ...], ... }

  FOR v_recipe_id, v_recipe_suggestions IN
    SELECT key, value
    FROM jsonb_each(p_suggestions)
  LOOP
    -- Skip if no suggestions for this recipe
    IF jsonb_array_length(v_recipe_suggestions) = 0 THEN
      CONTINUE;
    END IF;

    -- Iterate over each suggested tag
    FOR v_tag IN
      SELECT * FROM jsonb_array_elements(v_recipe_suggestions)
    LOOP
      -- Extract tag properties
      v_tag_name := v_tag->>'name';
      v_household_id := (v_tag->>'household_id')::UUID;
      v_version_id := (v_tag->>'version_id')::UUID;

      -- Get or create canonical tag
      v_tag_id := get_or_create_tag(
        v_household_id,
        v_tag_name,
        v_system_user_id
      );

      -- Add tag to recipe version (idempotent via ON CONFLICT)
      INSERT INTO recipe_version_tags (recipe_version_id, tag_id, created_by)
      VALUES (
        v_version_id,
        v_tag_id,
        v_system_user_id
      )
      ON CONFLICT (recipe_version_id, tag_id) DO NOTHING;

    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION apply_tag_suggestions IS
'Applies AI-generated tag suggestions to recipe versions. Creates canonical tags if needed.';

-- =====================================================================
-- STEP 5: Main Batch Processing Function
-- =====================================================================

CREATE OR REPLACE FUNCTION process_batch_tag_suggestions()
RETURNS void AS $$
DECLARE
  v_untagged_recipes JSONB;
  v_suggestions JSONB;
  v_recipe_count INT;
BEGIN
  -- Fetch untagged recipes
  SELECT jsonb_agg(
    jsonb_build_object(
      'recipe_id', recipe_id,
      'household_id', household_id,
      'title', title,
      'ingredients', ingredients_json,
      'steps', steps_json,
      'version_id', version_id
    )
  ) INTO v_untagged_recipes
  FROM get_untagged_recipes(20);  -- Batch size: 20 recipes

  -- Skip if no untagged recipes
  IF v_untagged_recipes IS NULL THEN
    RAISE NOTICE 'No untagged recipes found. Skipping batch processing.';
    RETURN;
  END IF;

  v_recipe_count := jsonb_array_length(v_untagged_recipes);

  IF v_recipe_count = 0 THEN
    RAISE NOTICE 'No untagged recipes found. Skipping batch processing.';
    RETURN;
  END IF;

  RAISE NOTICE 'Processing % untagged recipes...', v_recipe_count;

  -- Call Edge Function to generate suggestions
  BEGIN
    v_suggestions := call_suggest_tags_batch(v_untagged_recipes);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to call Edge Function: %', SQLERRM;
    RETURN;
  END;

  -- Apply suggestions to recipes
  BEGIN
    PERFORM apply_tag_suggestions(v_suggestions);
    RAISE NOTICE 'Successfully applied tag suggestions to % recipes', v_recipe_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to apply tag suggestions: %', SQLERRM;
    RETURN;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_batch_tag_suggestions IS
'Main batch processing function: finds untagged recipes, generates AI suggestions, and applies them';

-- =====================================================================
-- STEP 6: Schedule Weekly Cron Job
-- =====================================================================

-- Schedule weekly cron job (Sunday 2am UTC)
-- Note: This will fail silently if pg_cron is not properly configured
DO $$
BEGIN
  -- First, unschedule existing job if it exists
  PERFORM cron.unschedule('weekly-tag-suggestions');
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist yet, continue
  NULL;
END $$;

-- Schedule new job
SELECT cron.schedule(
  'weekly-tag-suggestions',          -- Job name
  '0 2 * * 0',                        -- Cron expression: Sunday 2am UTC
  'SELECT process_batch_tag_suggestions();'  -- SQL command
);

COMMENT ON EXTENSION pg_cron IS
'Cron-based job scheduler for PostgreSQL. Used for weekly tag suggestion batches.';

-- =====================================================================
-- STEP 7: Grant Permissions
-- =====================================================================

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION get_untagged_recipes(INT) TO postgres;
GRANT EXECUTE ON FUNCTION call_suggest_tags_batch(JSONB) TO postgres;
GRANT EXECUTE ON FUNCTION apply_tag_suggestions(JSONB) TO postgres;
GRANT EXECUTE ON FUNCTION process_batch_tag_suggestions() TO postgres;

-- =====================================================================
-- STEP 8: Verification Queries (commented out for production)
-- =====================================================================

-- Uncomment these queries to verify the migration:

-- -- Check if cron job is scheduled
-- SELECT * FROM cron.job WHERE jobname = 'weekly-tag-suggestions';

-- -- Check recent cron job runs
-- SELECT *
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-tag-suggestions')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- -- Find untagged recipes (test helper function)
-- SELECT * FROM get_untagged_recipes(5);

-- -- Manually trigger batch processing (for testing)
-- -- SELECT process_batch_tag_suggestions();
