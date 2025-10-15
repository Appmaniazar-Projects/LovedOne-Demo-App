-- Create deceased_profiles (cases) table
CREATE TABLE IF NOT EXISTS public.deceased_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    date_of_death DATE NOT NULL,
    picture TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('burial','cremation','memorial')),
    status TEXT NOT NULL CHECK (status IN ('quote','ongoing','closed')),
    assigned_director TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    cultural_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deceased_profiles_client_id ON public.deceased_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_deceased_profiles_status ON public.deceased_profiles(status);
CREATE INDEX IF NOT EXISTS idx_deceased_profiles_service_type ON public.deceased_profiles(service_type);

-- RLS
ALTER TABLE public.deceased_profiles ENABLE ROW LEVEL SECURITY;

-- Select policy: owners or admins
CREATE POLICY "Users can view deceased profiles" ON public.deceased_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = deceased_profiles.client_id
            AND (
                c.user_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
                )
            )
        )
    );

-- Insert policy
CREATE POLICY "Users can insert deceased profiles" ON public.deceased_profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = deceased_profiles.client_id
            AND (
                c.user_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
                )
            )
        )
    );

-- Update policy
CREATE POLICY "Users can update deceased profiles" ON public.deceased_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = deceased_profiles.client_id
            AND (
                c.user_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
                )
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = deceased_profiles.client_id
            AND (
                c.user_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
                )
            )
        )
    );

-- Delete policy (admins only)
CREATE POLICY "Admins can delete deceased profiles" ON public.deceased_profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
        )
    );

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deceased_profiles_updated_at BEFORE UPDATE ON public.deceased_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE public.deceased_profiles IS 'Stores deceased/case profiles per client';


