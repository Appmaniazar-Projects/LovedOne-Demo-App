-- Create dependants table
BEGIN;

CREATE TABLE IF NOT EXISTS public.dependants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    date_of_birth DATE,
    contact_number TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dependants_client_id ON public.dependants(client_id);
CREATE INDEX IF NOT EXISTS idx_dependants_name ON public.dependants(name);

-- Enable Row Level Security
ALTER TABLE public.dependants ENABLE ROW LEVEL SECURITY;

-- Create policies for dependants table
CREATE POLICY "dependants_select_same_parlor_or_super_admin" ON public.dependants
    FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR (
            public.current_user_parlor_id() IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.clients c
                WHERE c.id = public.dependants.client_id
                AND c.parlor_id = public.current_user_parlor_id()
            )
        )
    );

CREATE POLICY "dependants_insert_same_parlor" ON public.dependants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_user_role() IN ('staff','admin','super_admin')
        AND (
            public.is_super_admin()
            OR (
                public.current_user_parlor_id() IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM public.clients c
                    WHERE c.id = public.dependants.client_id
                    AND c.parlor_id = public.current_user_parlor_id()
                )
            )
        )
    );

CREATE POLICY "dependants_update_same_parlor" ON public.dependants
    FOR UPDATE
    TO authenticated
    USING (
        public.current_user_role() IN ('staff','admin','super_admin')
        AND (
            public.is_super_admin()
            OR (
                public.current_user_parlor_id() IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM public.clients c
                    WHERE c.id = public.dependants.client_id
                    AND c.parlor_id = public.current_user_parlor_id()
                )
            )
        )
    )
    WITH CHECK (
        public.current_user_role() IN ('staff','admin','super_admin')
        AND (
            public.is_super_admin()
            OR (
                public.current_user_parlor_id() IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM public.clients c
                    WHERE c.id = public.dependants.client_id
                    AND c.parlor_id = public.current_user_parlor_id()
                )
            )
        )
    );

CREATE POLICY "dependants_delete_admin_only" ON public.dependants
    FOR DELETE
    TO authenticated
    USING (
        public.current_user_role() IN ('admin','super_admin')
        AND (
            public.is_super_admin()
            OR (
                public.current_user_parlor_id() IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM public.clients c
                    WHERE c.id = public.dependants.client_id
                    AND c.parlor_id = public.current_user_parlor_id()
                )
            )
        )
    );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_dependants_updated_at BEFORE UPDATE ON public.dependants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.dependants IS 'Stores dependant information for clients';

COMMIT;
