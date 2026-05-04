-- ============================================================
-- MilBaant Database Schema - Seed Data
-- ============================================================
-- PURPOSE: Insert initial seed data
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── Rooms ────────────────────────────────────────────────────────────────────

INSERT INTO public.rooms (name, type) VALUES
  ('Yasir & Haris Room',     'bedroom'),
  ('Sajid & Raza Room',      'bedroom'),
  ('Jimmy & Ateeb Room',     'bedroom'),
  ('Yasir & Haris Washroom', 'washroom'),
  ('Sajid & Raza Washroom',  'washroom'),
  ('Jimmy & Ateeb Washroom', 'washroom'),
  ('Kitchen',                'kitchen'),
  ('TV Lounge',              'lounge'),
  ('Dining',                 'dining')
ON CONFLICT (name) DO NOTHING;

-- ── Beds ─────────────────────────────────────────────────────────────────────

INSERT INTO public.beds (room_id, label)
SELECT r.id, b.label
FROM public.rooms r
CROSS JOIN (VALUES ('Bed A'), ('Bed B')) AS b(label)
WHERE r.name IN ('Yasir & Haris Room', 'Sajid & Raza Room', 'Jimmy & Ateeb Room')
  AND NOT EXISTS (
    SELECT 1 FROM public.beds e WHERE e.room_id = r.id AND e.label = b.label
  );

-- ── Settings ─────────────────────────────────────────────────────────────────

INSERT INTO public.settings (key, value) VALUES
  ('member_count', '6'),
  ('flatmates',    'Yasir Ajmal Mehmand, Muhammad Haris, Sajid Ali, Ahmad Raza, Babar Jamil Ur Rahman (Jimmy), Ateeb Raza'),
  ('cook_name',    'Muhammad Sajid Khan')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserted successfully';
  RAISE NOTICE '📊 Rooms: 9';
  RAISE NOTICE '📊 Beds: 6';
  RAISE NOTICE '📊 Settings: 3';
END $$;
