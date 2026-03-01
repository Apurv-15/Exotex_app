-- SUPABASE DISABLE RLS (ROLLBACK) --

-- Use this script ONLY if the RLS policies broke existing functionality and you need to revert immediately.
-- Execute this script in your Supabase SQL Editor.

-- 1. DROP ALL POLICIES

-- Users
DROP POLICY IF EXISTS "Super Admins can access all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can select users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Sales
DROP POLICY IF EXISTS "Super Admin and Admin can access all sales" ON public.sales;
DROP POLICY IF EXISTS "Users can access their region sales" ON public.sales;

-- Field Visits
DROP POLICY IF EXISTS "Super Admin and Admin can access all field_visits" ON public.field_visits;
DROP POLICY IF EXISTS "Users can access their region field_visits" ON public.field_visits;

-- Complaints
DROP POLICY IF EXISTS "Super Admin and Admin can access all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can access their region complaints" ON public.complaints;

-- Stock
DROP POLICY IF EXISTS "Super Admin and Admin can access all stock" ON public.stock;
DROP POLICY IF EXISTS "Users can access their region stock" ON public.stock;

-- Storage
DROP POLICY IF EXISTS "Authenticated users can select images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;


-- 2. DISABLE ROW LEVEL SECURITY (RETURNS DB TO PUBLIC STATE)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock DISABLE ROW LEVEL SECURITY;

-- 3. RETURN STORAGE BUCKETS TO PUBLIC
UPDATE storage.buckets SET public = true WHERE id IN ('complaint-images', 'warranty-images', 'warranty-templates');

-- Note: The database is now public again.
