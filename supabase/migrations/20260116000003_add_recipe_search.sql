-- Migration: Add full-text search capabilities to recipes
-- Description: Adds tsvector column and search functionality for recipes
-- Enables searching by title, description, and ingredient names with ranking

-- Step 1: Add search_vector column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

COMMENT ON COLUMN recipes.search_vector IS 'Full-text search vector generated from title, description, and ingredients. Auto-updated via trigger.';

-- Step 2: Create function to update search vector
CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title TEXT;
  v_description TEXT;
  v_ingredients TEXT;
  v_current_version_id UUID;
BEGIN
  -- Get recipe title and description
  v_title := COALESCE(NEW.title, '');
  v_description := COALESCE(NEW.description, '');

  -- Get current version ID (if exists)
  v_current_version_id := NEW.current_version_id;

  -- Extract ingredient names from current version's ingredients_json
  v_ingredients := '';

  IF v_current_version_id IS NOT NULL THEN
    SELECT COALESCE(
      string_agg(
        COALESCE(ingredient->>'name', ''),
        ' '
      ),
      ''
    )
    INTO v_ingredients
    FROM recipe_versions rv,
         jsonb_array_elements(rv.ingredients_json) AS ingredient
    WHERE rv.id = v_current_version_id;
  END IF;

  -- Build search vector with weighted text
  -- Weight A (highest): title
  -- Weight B (medium): description
  -- Weight C (lowest): ingredients
  NEW.search_vector :=
    setweight(to_tsvector('english', v_title), 'A') ||
    setweight(to_tsvector('english', v_description), 'B') ||
    setweight(to_tsvector('english', COALESCE(v_ingredients, '')), 'C');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_recipe_search_vector() IS 'Trigger function that rebuilds search_vector from title, description, and current version ingredients';

-- Step 3: Create trigger on recipes table (BEFORE INSERT OR UPDATE)
DROP TRIGGER IF EXISTS trigger_update_recipe_search_vector ON recipes;

CREATE TRIGGER trigger_update_recipe_search_vector
  BEFORE INSERT OR UPDATE OF title, description, current_version_id
  ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_search_vector();

COMMENT ON TRIGGER trigger_update_recipe_search_vector ON recipes IS 'Updates search_vector when recipe title, description, or current_version changes';

-- Step 4: Create trigger function to update search vector when recipe_versions change
CREATE OR REPLACE FUNCTION update_recipe_search_on_version_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the parent recipe's search vector when a version is created/updated
  -- This ensures ingredient changes are reflected in search
  UPDATE recipes
  SET search_vector = (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(
      (
        SELECT string_agg(COALESCE(ingredient->>'name', ''), ' ')
        FROM jsonb_array_elements(NEW.ingredients_json) AS ingredient
      ),
      ''
    )), 'C')
  )
  WHERE id = NEW.recipe_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_recipe_search_on_version_change() IS 'Updates parent recipe search_vector when recipe_versions are modified';

-- Step 5: Create trigger on recipe_versions table
DROP TRIGGER IF EXISTS trigger_update_recipe_search_on_version ON recipe_versions;

CREATE TRIGGER trigger_update_recipe_search_on_version
  AFTER INSERT OR UPDATE OF ingredients_json
  ON recipe_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_search_on_version_change();

COMMENT ON TRIGGER trigger_update_recipe_search_on_version ON recipe_versions IS 'Updates parent recipe search_vector when version ingredients change';

-- Step 6: Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_recipes_search ON recipes USING GIN(search_vector);

COMMENT ON INDEX idx_recipes_search IS 'GIN index for fast full-text search queries';

-- Step 7: Create search helper function
CREATE OR REPLACE FUNCTION search_recipes(
  p_household_id UUID,
  p_query TEXT
)
RETURNS TABLE (
  id UUID,
  household_id UUID,
  title TEXT,
  description TEXT,
  current_version_id UUID,
  rolling_score NUMERIC(3,2),
  last_cooked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.household_id,
    r.title,
    r.description,
    r.current_version_id,
    r.rolling_score,
    r.last_cooked_at,
    r.created_by,
    r.created_at,
    r.updated_at,
    ts_rank(r.search_vector, websearch_to_tsquery('english', p_query)) AS rank
  FROM recipes r
  WHERE r.household_id = p_household_id
    AND r.search_vector @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC, r.updated_at DESC;
END;
$$;

COMMENT ON FUNCTION search_recipes(UUID, TEXT) IS 'Searches recipes by household_id using full-text search. Returns ranked results. Uses websearch_to_tsquery for intuitive query syntax (supports "quoted phrases", OR, -excluded).';

-- Step 8: Backfill search_vector for existing recipes
UPDATE recipes
SET search_vector = (
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(
    (
      SELECT string_agg(COALESCE(ingredient->>'name', ''), ' ')
      FROM recipe_versions rv,
           jsonb_array_elements(rv.ingredients_json) AS ingredient
      WHERE rv.id = recipes.current_version_id
    ),
    ''
  )), 'C')
)
WHERE search_vector IS NULL;
