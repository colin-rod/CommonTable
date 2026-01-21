-- Migration: Add status, priority, and updated_at to meal_requests table
-- Issue 5.3: Requests queue (add + triage)

-- Add status column (enum)
DO $$ BEGIN
  CREATE TYPE meal_request_status AS ENUM ('open', 'planned', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE meal_requests
ADD COLUMN IF NOT EXISTS status meal_request_status NOT NULL DEFAULT 'open';

-- Add priority column for manual ordering
ALTER TABLE meal_requests
ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;

-- Add updated_at timestamp for tracking status changes
ALTER TABLE meal_requests
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_meal_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists to ensure idempotency)
DROP TRIGGER IF EXISTS meal_request_updated_at_trigger ON meal_requests;

CREATE TRIGGER meal_request_updated_at_trigger
BEFORE UPDATE ON meal_requests
FOR EACH ROW
EXECUTE FUNCTION update_meal_request_updated_at();

-- Create indexes for efficient filtering and sorting
CREATE INDEX IF NOT EXISTS idx_meal_requests_status
ON meal_requests(household_id, status);

CREATE INDEX IF NOT EXISTS idx_meal_requests_priority_date
ON meal_requests(household_id, status, priority DESC, requested_date ASC);

-- Add comments for documentation
COMMENT ON COLUMN meal_requests.status IS 'Request lifecycle: open (new) → planned (added to calendar) or dismissed (rejected)';
COMMENT ON COLUMN meal_requests.priority IS 'Manual priority for ordering requests (higher = more important)';
COMMENT ON COLUMN meal_requests.updated_at IS 'Timestamp of last update (auto-updated via trigger)';
