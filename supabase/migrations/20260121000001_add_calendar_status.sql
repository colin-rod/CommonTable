-- Migration: Add status tracking to calendar_entries
-- Description: Add status field and updated_at timestamp for lifecycle tracking
-- This enables tracking calendar entries through their lifecycle:
--   planned (default) → confirmed → completed/cancelled

-- =============================================================================
-- Step 1: Add status column with CHECK constraint
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_entries' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.calendar_entries
      ADD COLUMN status TEXT NOT NULL DEFAULT 'planned'
      CHECK (status IN ('planned', 'confirmed', 'completed', 'cancelled'));

    RAISE NOTICE 'Added column: calendar_entries.status';
  ELSE
    RAISE NOTICE 'Column calendar_entries.status already exists, skipping';
  END IF;
END $$;

-- =============================================================================
-- Step 2: Add updated_at column (follows pattern from recipes/households/profiles)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_entries' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.calendar_entries
      ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    RAISE NOTICE 'Added column: calendar_entries.updated_at';
  ELSE
    RAISE NOTICE 'Column calendar_entries.updated_at already exists, skipping';
  END IF;
END $$;

-- =============================================================================
-- Step 3: Create trigger to auto-update updated_at
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_calendar_entries_updated_at'
  ) THEN
    CREATE TRIGGER update_calendar_entries_updated_at
      BEFORE UPDATE ON public.calendar_entries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE 'Created trigger: update_calendar_entries_updated_at';
  ELSE
    RAISE NOTICE 'Trigger update_calendar_entries_updated_at already exists, skipping';
  END IF;
END $$;

-- =============================================================================
-- Step 4: Create partial index for status filtering
-- =============================================================================
-- Most queries will filter by household + status (e.g., "show me all planned meals")
-- Partial index only indexes upcoming meals (planned/confirmed), not historical (completed/cancelled)
-- This makes the index smaller and faster for common queries
CREATE INDEX IF NOT EXISTS idx_calendar_entries_status
  ON public.calendar_entries(household_id, status)
  WHERE status IN ('planned', 'confirmed');

-- =============================================================================
-- Step 5: Update table and column comments
-- =============================================================================
COMMENT ON TABLE public.calendar_entries IS
  'Meal planning calendar with status tracking (planned → confirmed → completed → cancelled)';

COMMENT ON COLUMN public.calendar_entries.status IS
  'Lifecycle status: planned (default), confirmed (household agreed), completed (meal was cooked), cancelled (meal was cancelled)';

COMMENT ON COLUMN public.calendar_entries.updated_at IS
  'Timestamp of last update (auto-updated by trigger on any column change)';

-- =============================================================================
-- End of migration
-- =============================================================================
