-- SUPABASE ENABLE RLS & POLICIES (SECURE VERSION) --

-- This script secures your database by restricting access to authenticated users based on their role and region.
-- It uses the `public.users` table as the ultimate source of truth, rather than the insecure `user_metadata` field in the JWT.
-- Execute this script in your Supabase SQL Editor.

-- 1. DROP EXISTING INSECURE POLICIES --
DROP POLICY IF EXISTS "Super Admins can access all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can select users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

DROP POLICY IF EXISTS "Super Admin and Admin can access all sales" ON public.sales;
DROP POLICY IF EXISTS "Users can access their region sales" ON public.sales;

DROP POLICY IF EXISTS "Super Admin and Admin can access all field_visits" ON public.field_visits;
DROP POLICY IF EXISTS "Users can access their region field_visits" ON public.field_visits;

DROP POLICY IF EXISTS "Super Admin and Admin can access all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can access their region complaints" ON public.complaints;

DROP POLICY IF EXISTS "Super Admin and Admin can access all stock" ON public.stock;
DROP POLICY IF EXISTS "Users can access their region stock" ON public.stock;


-- 2. CREATE SECURE HELPER FUNCTIONS
-- These functions extract the role and region safely from the database based on the authenticated user's email.
-- They bypass RLS internally so they can be safely evaluated in policies without infinite recursion.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_region()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT region FROM public.users WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;


-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;


-- 4. CREATE SECURE POLICIES FOR USERS TABLE
-- Super Admins get full management capability
CREATE POLICY "Super Admins can access all users" 
ON public.users FOR ALL TO authenticated 
USING (public.get_my_role() = 'Super Admin');

-- Allow all authenticated users to read users (necessary to query active regions/dashboard logic)
CREATE POLICY "Authenticated users can select users" 
ON public.users FOR SELECT TO authenticated 
USING (true);

-- Allow admins/users to insert users (this covers the signUp + insert profile logic)
-- Note: Insert is slightly looser since they aren't fully registered in the table yet!
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT TO authenticated 
WITH CHECK (
  email = (auth.jwt() ->> 'email') OR 
  public.get_my_role() IN ('Admin', 'Super Admin')
);

-- Users can update themselves
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE TO authenticated 
USING (email = (auth.jwt() ->> 'email'));


-- 5. CREATE SECURE POLICIES FOR SALES TABLE
CREATE POLICY "Super Admin and Admin can access all sales" 
ON public.sales FOR ALL TO authenticated 
USING (public.get_my_role() IN ('Super Admin', 'Admin'));

CREATE POLICY "Users can access their region sales" 
ON public.sales FOR ALL TO authenticated 
USING (public.get_my_role() = 'User' AND city = public.get_my_region());


-- 6. CREATE SECURE POLICIES FOR FIELD VISITS TABLE
CREATE POLICY "Super Admin and Admin can access all field_visits" 
ON public.field_visits FOR ALL TO authenticated 
USING (public.get_my_role() IN ('Super Admin', 'Admin'));

CREATE POLICY "Users can access their region field_visits" 
ON public.field_visits FOR ALL TO authenticated 
USING (public.get_my_role() = 'User' AND city = public.get_my_region());


-- 7. CREATE SECURE POLICIES FOR COMPLAINTS TABLE
CREATE POLICY "Super Admin and Admin can access all complaints" 
ON public.complaints FOR ALL TO authenticated 
USING (public.get_my_role() IN ('Super Admin', 'Admin'));

CREATE POLICY "Users can access their region complaints" 
ON public.complaints FOR ALL TO authenticated 
USING (public.get_my_role() = 'User' AND city = public.get_my_region());


-- 8. CREATE SECURE POLICIES FOR STOCK TABLE
CREATE POLICY "Super Admin and Admin can access all stock" 
ON public.stock FOR ALL TO authenticated 
USING (public.get_my_role() IN ('Super Admin', 'Admin'));

CREATE POLICY "Users can access their region stock" 
ON public.stock FOR ALL TO authenticated 
USING (public.get_my_role() = 'User' AND region = public.get_my_region());


-- 9. SECURE STORAGE OBJECTS (Images bucket)
-- We enforce that only authenticated employees can manipulate the warranty and complaint images.
-- Make buckets private (removes the PUBLIC badge from Supabase UI)
UPDATE storage.buckets SET public = false WHERE id IN ('complaint-images', 'warranty-images', 'warranty-templates');

-- Policies for objects
DROP POLICY IF EXISTS "Authenticated users can select images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

CREATE POLICY "Authenticated users can select images" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id IN ('warranty-images', 'complaint-images', 'warranty-templates'));

CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id IN ('warranty-images', 'complaint-images', 'warranty-templates'));

CREATE POLICY "Authenticated users can update images" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id IN ('warranty-images', 'complaint-images', 'warranty-templates'));

CREATE POLICY "Authenticated users can delete images" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id IN ('warranty-images', 'complaint-images', 'warranty-templates'));
