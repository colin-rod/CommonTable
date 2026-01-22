-- Migration: Fix last_cooked_at when cooking events are deleted
-- This ensures last_cooked_at recalculates to the next most recent event (or NULL)

-- Create function to handle DELETE operations
CREATE OR REPLACE FUNCTION public.update_recipe_last_cooked_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_cooked_at TIMESTAMPTZ;
BEGIN
  -- Find the most recent cooked_at for this recipe (excluding deleted event)
  SELECT MAX(cooked_at)
  INTO v_max_cooked_at
  FROM public.cooking_events
  WHERE recipe_id = OLD.recipe_id;

  -- Update recipes.last_cooked_at
  -- If no cooking events remain, MAX() returns NULL
  UPDATE public.recipes
  SET last_cooked_at = v_max_cooked_at
  WHERE id = OLD.recipe_id;

  RETURN OLD;
END;
$$;

-- Create trigger to recalculate last_cooked_at on DELETE
CREATE TRIGGER trigger_update_recipe_last_cooked_on_delete
  AFTER DELETE ON public.cooking_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_recipe_last_cooked_on_delete();

COMMENT ON FUNCTION public.update_recipe_last_cooked_on_delete() IS 'Trigger function: Recalculates recipes.last_cooked_at after DELETE of cooking_events';
