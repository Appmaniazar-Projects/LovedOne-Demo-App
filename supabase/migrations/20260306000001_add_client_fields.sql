-- Add new fields to clients table for status, plan, and dependants
BEGIN;

-- Add new columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'lapsed', 'deceased')),
ADD COLUMN IF NOT EXISTS parlor_id UUID REFERENCES public.parlors(id) ON DELETE SET NULL;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_clients_plan_id ON public.clients(plan_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_parlor_id ON public.clients(parlor_id);

-- Update existing clients to have 'active' status and parlor_id from their assigned user
UPDATE public.clients 
SET status = 'active' 
WHERE status IS NULL;

UPDATE public.clients c
SET parlor_id = u.parlor_id
FROM public.users u
WHERE c.user_id = u.id AND c.parlor_id IS NULL;

COMMIT;
