-- Migration: Initial Schema
-- Creates core tables for CommonTable: profiles, households, recipes, calendar, and cooking events
-- All tables use TIMESTAMPTZ for timestamps and gen_random_uuid() for UUIDs

-- =============================================================================
-- TABLE: profiles (extends auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: households
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: household_members (junction table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.household_members (
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);

-- =============================================================================
-- TABLE: recipes
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  current_version_id UUID, -- Circular reference, set after recipe_versions insert
  last_cooked_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: recipe_versions (versioning: every edit creates a new version)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.recipe_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  ingredients_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  servings INTEGER,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (recipe_id, version_number)
);

-- Add foreign key constraint for recipes.current_version_id after recipe_versions table exists
ALTER TABLE public.recipes
  ADD CONSTRAINT fk_recipes_current_version
  FOREIGN KEY (current_version_id)
  REFERENCES public.recipe_versions(id)
  ON DELETE SET NULL;

-- =============================================================================
-- TABLE: calendar_entries (meal planning)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  planned_date DATE NOT NULL,
  meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: cooking_events (track when recipes are cooked)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.cooking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  recipe_version_id UUID NOT NULL REFERENCES public.recipe_versions(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  cooked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  servings_made INTEGER,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  cooked_by UUID NOT NULL REFERENCES auth.users(id)
);

-- =============================================================================
-- TABLE: recipe_forks (track recipe lineage when recipes are forked)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.recipe_forks (
  parent_recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  child_recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  forked_by UUID NOT NULL REFERENCES auth.users(id),
  forked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (parent_recipe_id, child_recipe_id)
);

-- =============================================================================
-- INDEXES (Performance optimization)
-- =============================================================================

-- Household isolation indexes (most queries filter by household_id)
CREATE INDEX IF NOT EXISTS idx_recipes_household
  ON public.recipes(household_id);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_household
  ON public.calendar_entries(household_id);

CREATE INDEX IF NOT EXISTS idx_cooking_events_household
  ON public.cooking_events(household_id);

-- Foreign key indexes (PostgreSQL doesn't auto-index foreign keys)
CREATE INDEX IF NOT EXISTS idx_recipe_versions_recipe
  ON public.recipe_versions(recipe_id);

CREATE INDEX IF NOT EXISTS idx_cooking_events_recipe
  ON public.cooking_events(recipe_id);

CREATE INDEX IF NOT EXISTS idx_household_members_user
  ON public.household_members(user_id);

CREATE INDEX IF NOT EXISTS idx_household_members_household
  ON public.household_members(household_id);

-- Common query patterns
CREATE INDEX IF NOT EXISTS idx_recipes_last_cooked
  ON public.recipes(household_id, last_cooked_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_date
  ON public.calendar_entries(household_id, planned_date);

CREATE INDEX IF NOT EXISTS idx_cooking_events_date
  ON public.cooking_events(household_id, cooked_at DESC);

-- Recipe version ordering
CREATE INDEX IF NOT EXISTS idx_recipe_versions_number
  ON public.recipe_versions(recipe_id, version_number DESC);

-- =============================================================================
-- TRIGGERS (Automatic timestamp updates)
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE public.households IS 'Household groups for recipe sharing';
COMMENT ON TABLE public.household_members IS 'Junction table for household membership with roles';
COMMENT ON TABLE public.recipes IS 'Recipes owned by households';
COMMENT ON TABLE public.recipe_versions IS 'Version history for recipes (every edit creates a new version)';
COMMENT ON TABLE public.calendar_entries IS 'Meal planning calendar';
COMMENT ON TABLE public.cooking_events IS 'Historical record of when recipes were cooked';
COMMENT ON TABLE public.recipe_forks IS 'Tracks recipe lineage when recipes are forked';
