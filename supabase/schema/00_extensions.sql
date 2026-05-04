-- ============================================================
-- MilBaant Database Schema - Extensions
-- ============================================================
-- PURPOSE: Enable required PostgreSQL extensions
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- Enable pgcrypto for UUID generation and cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Extensions enabled successfully';
END $$;
