-- Issue #8: ClientDetails.tsx uploads a photo and writes
-- `profile_picture_url` on `clients`, but that column doesn't exist on the
-- live database. The frontend code is already correct — it just needs a
-- target column. No frontend changes required alongside this migration.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS profile_picture_url text;
