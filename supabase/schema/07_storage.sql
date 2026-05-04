-- ============================================================
-- MilBaant Database Schema - Storage
-- ============================================================
-- PURPOSE: Create storage buckets and policies
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── Storage Buckets ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('bill-images',          'bill-images',          true),
  ('payment-screenshots',  'payment-screenshots',  true),
  ('avatars',              'avatars',              true)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ─────────────────────────────────────────────────────

-- ── bill-images bucket ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "bill_images_public_read"            ON storage.objects;
DROP POLICY IF EXISTS "bill_images_authenticated_insert"   ON storage.objects;
DROP POLICY IF EXISTS "bill_images_admin_delete"           ON storage.objects;
DROP POLICY IF EXISTS "bill_images_owner_delete"           ON storage.objects;

CREATE POLICY "bill_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'bill-images');

CREATE POLICY "bill_images_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bill-images');

CREATE POLICY "bill_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'bill-images' AND public.is_admin());

CREATE POLICY "bill_images_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'bill-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── payment-screenshots bucket ───────────────────────────────────────────────

DROP POLICY IF EXISTS "payment_screenshots_public_read"           ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_authenticated_insert"  ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_admin_delete"          ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_owner_delete"          ON storage.objects;

CREATE POLICY "payment_screenshots_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-screenshots');

CREATE POLICY "payment_screenshots_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "payment_screenshots_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND public.is_admin());

CREATE POLICY "payment_screenshots_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── avatars bucket ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "avatars_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_upsert"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete"  ON storage.objects;

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_upsert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets and policies created successfully';
  RAISE NOTICE '📊 Total buckets: 3';
  RAISE NOTICE '📊 Total storage policies: 12';
END $$;
