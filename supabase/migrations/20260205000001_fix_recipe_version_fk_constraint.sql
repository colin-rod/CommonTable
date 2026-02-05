-- =============================================================================
-- Migration: Fix FK Constraint for Recipe Version Circular Reference
-- Description: Makes fk_recipes_current_version DEFERRABLE to allow atomic
--              recipe + version creation in create_recipe_with_version function
-- Author: Claude Code
-- Date: 2026-02-05
-- =============================================================================

-- Drop existing constraint
ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS fk_recipes_current_version;

-- Re-add as DEFERRABLE INITIALLY DEFERRED
-- This allows the constraint check to be deferred until transaction commit,
-- enabling the atomic create_recipe_with_version pattern where:
-- 1. Recipe is inserted with current_version_id (version doesn't exist yet)
-- 2. Version is inserted with that ID
-- 3. Constraint is checked at commit (now both exist)
ALTER TABLE public.recipes
  ADD CONSTRAINT fk_recipes_current_version
  FOREIGN KEY (current_version_id)
  REFERENCES public.recipe_versions(id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- =============================================================================
-- End of migration
-- =============================================================================
