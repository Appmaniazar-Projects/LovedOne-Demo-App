-- Direct SQL to add client_id to payments table
-- This is a temporary fix to get the client payments working

-- Add client_id column to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for client_id
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);

-- Update existing payments to set client_id from case_id where possible
UPDATE public.payments p
SET client_id = c.client_id
FROM public.cases c
WHERE p.case_id::text = c.id::text 
  AND p.client_id IS NULL
  AND c.client_id IS NOT NULL;

-- Add comment to column
COMMENT ON COLUMN public.payments.client_id IS 'Reference to the client who made the payment';
