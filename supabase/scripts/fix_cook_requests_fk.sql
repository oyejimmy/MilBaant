-- Fix cook_requests.requested_by foreign key
-- Was incorrectly pointing to auth.users instead of public.profiles
-- PostgREST cannot resolve the join to profiles without this FK

ALTER TABLE public.cook_requests
  DROP CONSTRAINT IF EXISTS cook_requests_requested_by_fkey;

ALTER TABLE public.cook_requests
  ADD CONSTRAINT cook_requests_requested_by_fkey
  FOREIGN KEY (requested_by)
  REFERENCES public.profiles (id)
  ON DELETE CASCADE;
