-- ============================================================
-- Migration: cook_requests table
-- Any authenticated user can submit a request to the cook.
-- The cook (and admins) can mark requests as done or delete them.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cook_requests (
    id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    item        text         NOT NULL,
    quantity    text,                          -- e.g. "2 kg", "1 dozen"
    note        text,
    status      text         NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'acknowledged', 'done', 'rejected')),
    requested_by uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    created_at  timestamptz  NOT NULL DEFAULT timezone('utc', now()),
    updated_at  timestamptz  NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS cook_requests_status_idx      ON public.cook_requests (status);
CREATE INDEX IF NOT EXISTS cook_requests_requested_by_idx ON public.cook_requests (requested_by);
CREATE INDEX IF NOT EXISTS cook_requests_created_at_idx  ON public.cook_requests (created_at DESC);

ALTER TABLE public.cook_requests ENABLE ROW LEVEL SECURITY;

-- Everyone can read all requests
DROP POLICY IF EXISTS "cook_requests_select" ON public.cook_requests;
CREATE POLICY "cook_requests_select" ON public.cook_requests
  FOR SELECT TO authenticated USING (true);

-- Any authenticated user can create a request
DROP POLICY IF EXISTS "cook_requests_insert" ON public.cook_requests;
CREATE POLICY "cook_requests_insert" ON public.cook_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);

-- Cook (role='cook') and admins can update status; requester can update their own pending request
DROP POLICY IF EXISTS "cook_requests_update" ON public.cook_requests;
CREATE POLICY "cook_requests_update" ON public.cook_requests
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = requested_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'cook'
    )
  );

-- Requester can delete their own; admins can delete any
DROP POLICY IF EXISTS "cook_requests_delete" ON public.cook_requests;
CREATE POLICY "cook_requests_delete" ON public.cook_requests
  FOR DELETE TO authenticated
  USING (auth.uid() = requested_by OR public.is_admin());
