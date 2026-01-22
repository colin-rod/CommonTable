-- Migration: Add calendar_entry_comments table
-- Description: Append-only comments on calendar entries for household collaboration
-- Author: System
-- Date: 2026-01-22

-- =============================================================================
-- Create calendar_entry_comments table
-- =============================================================================

CREATE TABLE IF NOT EXISTS calendar_entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_entry_id UUID NOT NULL REFERENCES calendar_entries(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL CHECK (char_length(trim(comment_text)) > 0),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index for fetching comments by calendar entry (primary query pattern)
CREATE INDEX IF NOT EXISTS idx_calendar_entry_comments_calendar_entry 
ON calendar_entry_comments(calendar_entry_id, created_at);

-- Index for household isolation
CREATE INDEX IF NOT EXISTS idx_calendar_entry_comments_household 
ON calendar_entry_comments(household_id);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE calendar_entry_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments for their household's calendar entries
CREATE POLICY calendar_entry_comments_select ON calendar_entry_comments
  FOR SELECT
  USING (household_id = get_user_household_id());

-- Policy: Users can create comments on their household's calendar entries
CREATE POLICY calendar_entry_comments_insert ON calendar_entry_comments
  FOR INSERT
  WITH CHECK (
    household_id = get_user_household_id() AND
    EXISTS (
      SELECT 1 FROM calendar_entries ce
      WHERE ce.id = calendar_entry_comments.calendar_entry_id
        AND ce.household_id = get_user_household_id()
    )
  );

-- Policy: Comments are append-only (no updates or deletes)
-- No UPDATE or DELETE policies = no one can modify or delete comments

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE calendar_entry_comments IS 'Append-only comments on calendar entries for household collaboration';
COMMENT ON COLUMN calendar_entry_comments.id IS 'Primary key';
COMMENT ON COLUMN calendar_entry_comments.calendar_entry_id IS 'Foreign key to calendar_entries';
COMMENT ON COLUMN calendar_entry_comments.household_id IS 'Denormalized household_id for efficient querying and RLS';
COMMENT ON COLUMN calendar_entry_comments.comment_text IS 'Comment content (trimmed, non-empty)';
COMMENT ON COLUMN calendar_entry_comments.created_by IS 'User who created the comment (profile ID)';
COMMENT ON COLUMN calendar_entry_comments.created_at IS 'Timestamp when comment was created';
