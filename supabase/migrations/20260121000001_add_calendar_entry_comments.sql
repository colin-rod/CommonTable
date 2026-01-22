-- Migration: Add calendar_entry_comments table for lightweight meal planning discussions
-- Created: 2026-01-21
-- Description: Append-only comments table with household isolation and cascade deletion

-- Create calendar_entry_comments table
CREATE TABLE IF NOT EXISTS public.calendar_entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_entry_id UUID NOT NULL REFERENCES public.calendar_entries(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table and column comments
COMMENT ON TABLE public.calendar_entry_comments IS 'Comments on planned meals (append-only, flat thread)';
COMMENT ON COLUMN public.calendar_entry_comments.id IS 'Unique comment identifier';
COMMENT ON COLUMN public.calendar_entry_comments.calendar_entry_id IS 'The calendar entry this comment belongs to';
COMMENT ON COLUMN public.calendar_entry_comments.household_id IS 'Denormalized for RLS and isolation (copied from calendar_entries)';
COMMENT ON COLUMN public.calendar_entry_comments.comment_text IS 'The comment content (no length limit)';
COMMENT ON COLUMN public.calendar_entry_comments.created_by IS 'User who created the comment';
COMMENT ON COLUMN public.calendar_entry_comments.created_at IS 'When the comment was created (immutable)';

-- Indexes for efficient queries

-- Primary index: fetch comments for a calendar entry in chronological order
CREATE INDEX IF NOT EXISTS idx_calendar_entry_comments_entry
  ON public.calendar_entry_comments(calendar_entry_id, created_at ASC);

-- Household isolation index for RLS queries
CREATE INDEX IF NOT EXISTS idx_calendar_entry_comments_household
  ON public.calendar_entry_comments(household_id);

-- Enable Row Level Security
ALTER TABLE public.calendar_entry_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view comments in their household's calendar entries
CREATE POLICY "Users can view their household's comments"
  ON public.calendar_entry_comments
  FOR SELECT
  USING (household_id = public.get_user_household_id());

-- Policy: Users can create comments in their household's calendar entries
CREATE POLICY "Users can create comments in their household"
  ON public.calendar_entry_comments
  FOR INSERT
  WITH CHECK (
    household_id = public.get_user_household_id()
    AND created_by = auth.uid()
  );

-- Note: No UPDATE or DELETE policies - comments are append-only (immutable)
