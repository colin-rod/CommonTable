-- Migration: Add tags/categories support to recipes
-- Description: Adds a tags column (TEXT[] array) for categorizing recipes
-- Enables filtering by tags and autocomplete suggestions

-- Step 1: Add tags column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

COMMENT ON COLUMN recipes.tags IS 'Array of tags for categorizing recipes (e.g., vegetarian, dessert, quick). Stored as lowercase for consistency.';

-- Step 2: Create GIN index for efficient tag queries
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);

COMMENT ON INDEX idx_recipes_tags IS 'GIN index for fast tag filtering queries (e.g., WHERE ''vegetarian'' = ANY(tags))';

-- Step 3: Create function to normalize tags (lowercase, trim whitespace)
CREATE OR REPLACE FUNCTION normalize_tags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize tags to lowercase and remove empty strings
  IF NEW.tags IS NOT NULL THEN
    NEW.tags := (
      SELECT ARRAY(
        SELECT DISTINCT lower(trim(tag))
        FROM unnest(NEW.tags) AS tag
        WHERE trim(tag) != ''
          AND length(trim(tag)) <= 20  -- Max 20 chars per tag
        ORDER BY lower(trim(tag))
      )
    );
  ELSE
    NEW.tags := '{}'::TEXT[];
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION normalize_tags() IS 'Trigger function that normalizes tags to lowercase, removes duplicates and empty strings, enforces max 20 chars per tag';

-- Step 4: Create trigger to normalize tags before insert/update
DROP TRIGGER IF EXISTS trigger_normalize_tags ON recipes;

CREATE TRIGGER trigger_normalize_tags
  BEFORE INSERT OR UPDATE OF tags
  ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION normalize_tags();

COMMENT ON TRIGGER trigger_normalize_tags ON recipes IS 'Normalizes tags to lowercase and removes invalid entries before insert/update';

-- Step 5: Create helper function to get all unique tags for a household
CREATE OR REPLACE FUNCTION get_household_tags(p_household_id UUID)
RETURNS TABLE (
  tag TEXT,
  recipe_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tag_element AS tag,
    COUNT(*) AS recipe_count
  FROM recipes r,
       unnest(r.tags) AS tag_element
  WHERE r.household_id = p_household_id
  GROUP BY tag_element
  ORDER BY recipe_count DESC, tag_element ASC;
END;
$$;

COMMENT ON FUNCTION get_household_tags(UUID) IS 'Returns all unique tags used in a household with recipe counts. Useful for tag autocomplete and analytics.';

-- Step 6: Backfill tags column for existing recipes (empty array)
UPDATE recipes
SET tags = '{}'::TEXT[]
WHERE tags IS NULL;
