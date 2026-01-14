-- Migration: RLS Policies
-- Row Level Security policies for household isolation and role-based access control
-- Ensures users can only access data belonging to their household

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get the household_id for the current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_household_id()
RETURNS UUID AS $$
  SELECT household_id
  FROM public.household_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is an admin in their household
CREATE OR REPLACE FUNCTION public.is_household_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is an admin of a specific household
CREATE OR REPLACE FUNCTION public.is_household_admin_of(household_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.user_id = auth.uid()
      AND hm.household_id = $1
      AND hm.role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_forks ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES POLICIES
-- Users can read/update their own profile
-- =============================================================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- HOUSEHOLDS POLICIES
-- Users can read households they belong to
-- Only admins can update household details
-- =============================================================================

CREATE POLICY "Users can view their household"
  ON public.households FOR SELECT
  USING (
    id IN (
      SELECT household_id
      FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their household"
  ON public.households FOR UPDATE
  USING (public.is_household_admin_of(id));

CREATE POLICY "Authenticated users can create households"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- HOUSEHOLD_MEMBERS POLICIES
-- Users can view members of their household
-- Only admins can add/remove members
-- =============================================================================

CREATE POLICY "Users can view members of their household"
  ON public.household_members FOR SELECT
  USING (
    household_id IN (
      SELECT household_id
      FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can add members to their household"
  ON public.household_members FOR INSERT
  WITH CHECK (public.is_household_admin_of(household_id));

CREATE POLICY "Admins can remove members from their household"
  ON public.household_members FOR DELETE
  USING (public.is_household_admin_of(household_id));

CREATE POLICY "Users can leave a household"
  ON public.household_members FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- RECIPES POLICIES
-- Users can access recipes in their household only
-- All household members can create/edit recipes
-- =============================================================================

CREATE POLICY "Users can view their household's recipes"
  ON public.recipes FOR SELECT
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Users can create recipes in their household"
  ON public.recipes FOR INSERT
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Users can update their household's recipes"
  ON public.recipes FOR UPDATE
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Users can delete their household's recipes"
  ON public.recipes FOR DELETE
  USING (household_id = public.get_user_household_id());

-- =============================================================================
-- RECIPE_VERSIONS POLICIES
-- Users can read versions of their household's recipes
-- Insert-only (versions are immutable once created)
-- =============================================================================

CREATE POLICY "Users can view recipe versions in their household"
  ON public.recipe_versions FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM public.recipes
      WHERE household_id = public.get_user_household_id()
    )
  );

CREATE POLICY "Users can create recipe versions in their household"
  ON public.recipe_versions FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM public.recipes
      WHERE household_id = public.get_user_household_id()
    )
  );

-- =============================================================================
-- CALENDAR_ENTRIES POLICIES
-- Users can CRUD calendar entries in their household
-- =============================================================================

CREATE POLICY "Users can view their household's calendar"
  ON public.calendar_entries FOR SELECT
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Users can create calendar entries in their household"
  ON public.calendar_entries FOR INSERT
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Users can update their household's calendar entries"
  ON public.calendar_entries FOR UPDATE
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Users can delete their household's calendar entries"
  ON public.calendar_entries FOR DELETE
  USING (household_id = public.get_user_household_id());

-- =============================================================================
-- COOKING_EVENTS POLICIES
-- Users can CRUD cooking events in their household
-- =============================================================================

CREATE POLICY "Users can view their household's cooking events"
  ON public.cooking_events FOR SELECT
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Users can create cooking events in their household"
  ON public.cooking_events FOR INSERT
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Users can update their household's cooking events"
  ON public.cooking_events FOR UPDATE
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Users can delete their household's cooking events"
  ON public.cooking_events FOR DELETE
  USING (household_id = public.get_user_household_id());

-- =============================================================================
-- RECIPE_FORKS POLICIES
-- Users can view fork relationships for their recipes
-- Users can create forks when forking recipes
-- =============================================================================

CREATE POLICY "Users can view recipe forks in their household"
  ON public.recipe_forks FOR SELECT
  USING (
    parent_recipe_id IN (
      SELECT id FROM public.recipes
      WHERE household_id = public.get_user_household_id()
    )
    OR child_recipe_id IN (
      SELECT id FROM public.recipes
      WHERE household_id = public.get_user_household_id()
    )
  );

CREATE POLICY "Users can create recipe forks"
  ON public.recipe_forks FOR INSERT
  WITH CHECK (
    child_recipe_id IN (
      SELECT id FROM public.recipes
      WHERE household_id = public.get_user_household_id()
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.get_user_household_id() IS 'Returns the household_id for the current authenticated user';
COMMENT ON FUNCTION public.is_household_admin() IS 'Returns true if current user is an admin in any household';
COMMENT ON FUNCTION public.is_household_admin_of(UUID) IS 'Returns true if current user is an admin of the specified household';
