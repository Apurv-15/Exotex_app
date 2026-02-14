-- =========================================================
-- FINAL COMPLAINTS TABLE & BUCKET SETUP (RESET)
-- This script will:
-- 1. Drop the existing complaints table (and lose its data).
-- 2. Create the complaints table with ALL required columns.
-- 3. Set up UNRESTRICTED policies for testing (Insert/Select for everyone).
-- 4. Ensure the complaint-images bucket exists and is public.
-- 5. Set up UNRESTRICTED policies for the bucket (Upload/Select for everyone).
-- =========================================================

-- 1. DROP EXISTING TABLE (WARNING: DATA LOSS)
DROP TABLE IF EXISTS public.complaints CASCADE;

-- 2. CREATE TABLE WITH FULL SCHEMA
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id TEXT UNIQUE NOT NULL,
    invoice_no TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    category TEXT,
    description TEXT,
    date_of_complaint DATE DEFAULT CURRENT_DATE,
    assigned_department TEXT,
    assigned_officer TEXT,
    action_taken TEXT,
    resolution_date DATE,
    status TEXT DEFAULT 'Open',
    client_confirmation TEXT,
    client_feedback TEXT,
    resolved_by_name TEXT,
    resolved_by_designation TEXT,
    image_urls TEXT[] DEFAULT '{}',
    warranty_card_attached BOOLEAN DEFAULT FALSE,
    branch_id TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS & ADD POLICIES FOR TABLE
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (authenticated, anonymous, or service role) to insert complaints
CREATE POLICY "Public Complaint Submission" ON public.complaints
    FOR INSERT 
    TO public, anon, authenticated
    WITH CHECK (true);

-- Allow ANYONE to view complaints
CREATE POLICY "Public Complaint Viewing" ON public.complaints
    FOR SELECT 
    TO public, anon, authenticated
    USING (true);

-- Allow ANYONE to update complaints (for testing)
CREATE POLICY "Public Complaint Update" ON public.complaints
    FOR UPDATE
    TO public, anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow Admins to delete
CREATE POLICY "Admin Delete Control" ON public.complaints
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role IN ('Admin', 'Super Admin')
        )
    );

-- 4. STORAGE BUCKET SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-images', 'complaint-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. STORAGE POLICIES (RESET & RECREATE)
-- Drop potential conflicting policies first
DROP POLICY IF EXISTS "Complaints Select Access" ON storage.objects;
DROP POLICY IF EXISTS "Complaints Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Complaints Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

-- Create Public Access Policies for this specific bucket
CREATE POLICY "Complaints Select Access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'complaint-images');

CREATE POLICY "Complaints Insert Access" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'complaint-images');

CREATE POLICY "Complaints Update Access" ON storage.objects 
    FOR UPDATE WITH CHECK (bucket_id = 'complaint-images');

-- 6. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
