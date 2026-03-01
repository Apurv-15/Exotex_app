-- SUPABASE ENABLE RLS & POLICIES --

-- This script secures your database by restricting access to authenticated users based on their role and region.
-- Execute this script in your Supabase SQL Editor.

-- 1. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

-- 2. CREATE POLICIES FOR USERS TABLE
-- Super Admins get full management capability
CREATE POLICY "Super Admins can access all users" 
ON public.users FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Super Admin');

-- Allow all authenticated users to read users (necessary to query active regions/dashboard logic)
CREATE POLICY "Authenticated users can select users" 
ON public.users FOR SELECT TO authenticated 
USING (true);

-- Allow admins/users to insert users (this covers the signUp + insert profile logic)
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT TO authenticated 
WITH CHECK (
  email = (auth.jwt() ->> 'email') OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin', 'Super Admin')
);

-- Users can update themselves
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE TO authenticated 
USING (email = (auth.jwt() ->> 'email'));


-- 3. CREATE POLICIES FOR SALES TABLE
CREATE POLICY "Super Admin and Admin can access all sales" 
ON public.sales FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'Admin'));

CREATE POLICY "Users can access their region sales" 
ON public.sales FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'User' AND city = (auth.jwt() -> 'user_metadata' ->> 'region'));


-- 4. CREATE POLICIES FOR FIELD VISITS TABLE
CREATE POLICY "Super Admin and Admin can access all field_visits" 
ON public.field_visits FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'Admin'));

CREATE POLICY "Users can access their region field_visits" 
ON public.field_visits FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'User' AND city = (auth.jwt() -> 'user_metadata' ->> 'region'));


-- 5. CREATE POLICIES FOR COMPLAINTS TABLE
CREATE POLICY "Super Admin and Admin can access all complaints" 
ON public.complaints FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'Admin'));

CREATE POLICY "Users can access their region complaints" 
ON public.complaints FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'User' AND city = (auth.jwt() -> 'user_metadata' ->> 'region'));


-- 6. CREATE POLICIES FOR STOCK TABLE
CREATE POLICY "Super Admin and Admin can access all stock" 
ON public.stock FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super Admin', 'Admin'));

CREATE POLICY "Users can access their region stock" 
ON public.stock FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'User' AND region = (auth.jwt() -> 'user_metadata' ->> 'region'));


-- 7. SECURE STORAGE OBJECTS (Images bucket)
-- We enforce that only authenticated employees can manipulate the warranty and complaint images.
-- Make buckets private (removes the PUBLIC badge from Supabase UI)
UPDATE storage.buckets SET public = false WHERE id IN ('complaint-images', 'warranty-images', 'warranty-templates');

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
