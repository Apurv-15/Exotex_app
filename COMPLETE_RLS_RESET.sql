-- COMPLETE RLS POLICY RESET
-- This script completely removes ALL policies and recreates them from scratch
-- to eliminate any hidden recursive dependencies

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Users table policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
END $$;

-- Stock table policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'stock' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.stock';
    END LOOP;
END $$;

-- Sales table policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sales' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.sales';
    END LOOP;
END $$;

-- Field visits table policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'field_visits' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.field_visits';
    END LOOP;
END $$;

-- ============================================
-- STEP 2: ENSURE RLS IS ENABLED
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ============================================

-- USERS TABLE
-- Simple policy: any authenticated user can read user profiles
CREATE POLICY "users_select_authenticated" 
ON public.users 
FOR SELECT 
TO authenticated
USING (true);

-- Allow authenticated users to insert (for registration)
CREATE POLICY "users_insert_authenticated" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to update their own profile (optional, based on email match)
CREATE POLICY "users_update_own" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (auth.jwt() ->> 'email' = email)
WITH CHECK (auth.jwt() ->> 'email' = email);

-- STOCK TABLE
-- Full access for authenticated users
CREATE POLICY "stock_all_authenticated" 
ON public.stock 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- SALES TABLE
-- Full access for authenticated users
CREATE POLICY "sales_all_authenticated" 
ON public.sales 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- FIELD VISITS TABLE
-- Full access for authenticated users
CREATE POLICY "field_visits_all_authenticated" 
ON public.field_visits 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify all policies are correct:
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;
