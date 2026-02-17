-- Supabase Auth Integration Setup

-- 1. Ensure users table is accessible
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop old policies on users table
DROP POLICY IF EXISTS "Enable all access for all users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert to users" ON public.users;
DROP POLICY IF EXISTS "Allow read users" ON public.users;
DROP POLICY IF EXISTS "Allow update own user" ON public.users;

-- CREATE NEW POLICIES

-- Allow authenticated users to insert into users table (during registration)
-- We also allow anon for registration flow if it happens before sign-in completes, though technically signUp returns session.
CREATE POLICY "Allow public insert for registration" ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Allow all authenticated users to read user profiles (needed for admin dashboard to see sales engineers names etc)
CREATE POLICY "Allow read access to all users" ON public.users
FOR SELECT
USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Allow update own profile" ON public.users
FOR UPDATE
USING (auth.jwt() ->> 'email' = email);

-- 2. Update Field Visits Policies to use Supabase Auth
-- Drop old policies
DROP POLICY IF EXISTS "Enable all access for all users" ON public.field_visits;

-- Create new policy utilizing Supabase Auth
-- This allows any authenticated user to read/write field visits.
-- You can restrict this further based on 'role' in public.users if needed.
CREATE POLICY "Authenticated users full access to field_visits" ON public.field_visits
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 3. Update Stock Policies (Refining the previous RLS fix)
DROP POLICY IF EXISTS "Enable all access for stock" ON public.stock;

CREATE POLICY "Authenticated users full access to stock" ON public.stock
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. Update Sales Policies
DROP POLICY IF EXISTS "Enable all access for all users" ON public.sales;

CREATE POLICY "Authenticated users full access to sales" ON public.sales
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 5. Storage Policies (Already set up, but ensuring they work with auth)
-- The existing policies check for bucket_id, which is fine.
-- Start enforcing auth?
DROP POLICY IF EXISTS "Authenticated uploads" ON storage.objects;
CREATE POLICY "Authenticated uploads" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'warranty-images' AND auth.role() = 'authenticated');
