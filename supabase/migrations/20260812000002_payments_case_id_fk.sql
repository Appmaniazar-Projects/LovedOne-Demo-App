-- payments.case_id is currently `text` with no foreign key on the live
-- database, even though 001_payment_module.sql declares it as
-- `uuid references cases(id)` — that migration used
-- `create table if not exists`, which silently no-ops against the
-- pre-existing live `payments` table, so the uuid/FK declaration in that
-- file never actually applied. This migration applies it directly.
--
-- Schedule for a maintenance window — this touches existing data.
-- Run this SELECT manually first and confirm zero rows before applying
-- the ALTER statements below:
--
--   SELECT id, case_id FROM public.payments
--   WHERE case_id IS NOT NULL
--     AND case_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

DO $$
BEGIN
  -- Only attempt the type change if the column isn't already uuid
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payments'
      AND column_name = 'case_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.payments
      ALTER COLUMN case_id TYPE uuid USING case_id::uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_case_id_fkey'
      AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_case_id_fkey
      FOREIGN KEY (case_id) REFERENCES public.cases(id);
  END IF;
END $$;
