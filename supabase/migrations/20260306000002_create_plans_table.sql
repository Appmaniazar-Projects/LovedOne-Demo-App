-- Create plans table
BEGIN;

CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parlor_id UUID NOT NULL REFERENCES public.parlors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    monthly_premium DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cover_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plans_parlor_id ON public.plans(parlor_id);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans(is_active);

-- Enable Row Level Security
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policies for plans table
CREATE POLICY "plans_select_same_parlor_or_super_admin" ON public.plans
    FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR (
            public.current_user_parlor_id() IS NOT NULL
            AND public.plans.parlor_id = public.current_user_parlor_id()
        )
    );

CREATE POLICY "plans_insert_same_parlor" ON public.plans
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_user_role() IN ('admin','super_admin')
        AND (
            public.is_super_admin()
            OR (
                public.current_user_parlor_id() IS NOT NULL
                AND public.plans.parlor_id = public.current_user_parlor_id()
            )
        )
    );

CREATE POLICY "plans_update_same_parlor" ON public.plans
    FOR UPDATE
    TO authenticated
    USING (
        public.current_user_role() IN ('admin','super_admin')
        AND (
            public.is_super_admin()
            OR (
                public.current_user_parlor_id() IS NOT NULL
                AND public.plans.parlor_id = public.current_user_parlor_id()
            )
        )
    )
    WITH CHECK (
        public.current_user_role() IN ('admin','super_admin')
        AND (
            public.is_super_admin()
            OR (
                public.current_user_parlor_id() IS NOT NULL
                AND public.plans.parlor_id = public.current_user_parlor_id()
            )
        )
    );

CREATE POLICY "plans_delete_admin_only" ON public.plans
    FOR DELETE
    TO authenticated
    USING (
        public.current_user_role() IN ('admin','super_admin')
        AND (
            public.is_super_admin()
            OR (
                public.current_user_parlor_id() IS NOT NULL
                AND public.plans.parlor_id = public.current_user_parlor_id()
            )
        )
    );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.plans IS 'Stores insurance/coverage plans available to clients';

COMMIT;
