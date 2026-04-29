-- ============================================================
-- Migration: add cook_comment column to cook_requests
-- The cook can leave a reason/comment when updating a request.
-- ============================================================

ALTER TABLE public.cook_requests
  ADD COLUMN IF NOT EXISTS cook_comment text;
