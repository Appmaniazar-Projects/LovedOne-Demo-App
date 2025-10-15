-- Create client_documents table
CREATE TABLE IF NOT EXISTS public.client_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    notes TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON public.client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_document_type ON public.client_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded_by ON public.client_documents(uploaded_by);

-- Enable Row Level Security
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for client_documents
-- Policy: Users can view documents for clients they have access to
CREATE POLICY "Users can view client documents" ON public.client_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = client_documents.client_id
            AND (
                clients.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role IN ('admin', 'super_admin')
                )
            )
        )
    );

-- Policy: Users can insert documents for clients they have access to
CREATE POLICY "Users can upload client documents" ON public.client_documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients
            WHERE clients.id = client_documents.client_id
            AND (
                clients.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role IN ('admin', 'super_admin')
                )
            )
        )
    );

-- Policy: Users can delete documents they uploaded or if they're admin
CREATE POLICY "Users can delete client documents" ON public.client_documents
    FOR DELETE
    USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Create storage bucket for client documents (run this in Supabase Dashboard SQL Editor)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('client-documents', 'client-documents', true)
-- ON CONFLICT (id) DO NOTHING;

-- Create storage policies
-- CREATE POLICY "Users can upload client documents" ON storage.objects
--     FOR INSERT
--     WITH CHECK (bucket_id = 'client-documents' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can view client documents" ON storage.objects
--     FOR SELECT
--     USING (bucket_id = 'client-documents' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can delete their uploaded documents" ON storage.objects
--     FOR DELETE
--     USING (bucket_id = 'client-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_documents_updated_at BEFORE UPDATE ON public.client_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.client_documents IS 'Stores documents uploaded for each client';
