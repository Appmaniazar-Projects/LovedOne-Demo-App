-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    relationship TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    cultural_preferences TEXT,
    profile_picture_url TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
-- Policy: Users can view their own clients or all clients if admin/super_admin
CREATE POLICY "Users can view clients" ON public.clients
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Policy: Users can insert clients (assigned to them by default)
CREATE POLICY "Users can insert clients" ON public.clients
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Policy: Users can update their own clients or admins can update any client
CREATE POLICY "Users can update clients" ON public.clients
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Policy: Only admins can delete clients
CREATE POLICY "Admins can delete clients" ON public.clients
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.clients IS 'Stores client information and their assigned staff members';

-- Create storage bucket for client profile pictures (run this in Supabase Dashboard SQL Editor)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('client-profiles', 'client-profiles', true)
-- ON CONFLICT (id) DO NOTHING;

-- Create storage policies for client profile pictures
-- CREATE POLICY "Users can upload client profile pictures" ON storage.objects
--     FOR INSERT
--     WITH CHECK (bucket_id = 'client-profiles' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can view client profile pictures" ON storage.objects
--     FOR SELECT
--     USING (bucket_id = 'client-profiles' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can delete client profile pictures" ON storage.objects
--     FOR DELETE
--     USING (bucket_id = 'client-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

