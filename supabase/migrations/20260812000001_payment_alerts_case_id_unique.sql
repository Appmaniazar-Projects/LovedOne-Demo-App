-- payment_alerts.case_id needs a unique constraint so
-- PaymentAlertService.generateAlerts() can upsert on conflict instead of
-- creating duplicate alert rows every time it runs.
--
-- NOTE: payment_alerts itself has no CREATE TABLE migration in this repo
-- (it exists live, untracked) — same schema-drift issue as cases/documents/
-- tasks/parlors/users. This migration only adds the constraint; it assumes
-- the table already exists in the live database.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_alerts_case_id_unique'
      AND conrelid = 'public.payment_alerts'::regclass
  ) THEN
    ALTER TABLE public.payment_alerts
      ADD CONSTRAINT payment_alerts_case_id_unique UNIQUE (case_id);
  END IF;
END $$;
