-- SUPABASE FINAL RLS FIX (OPTIMIZED & SECURE) --

-- 1. DROP ALL POTENTIAL DUPLICATE POLICIES (Cleanup)
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND schemaname NOT IN ('storage', 'auth')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, policy_record.tablename);
    END LOOP;
END $$;

-- 2. CREATE SECURE HELPER FUNCTIONS (NO DATABASE LOOKUPS)
-- We strictly read from the JWT login token to absolutely guarantee there is zero "infinite loop" recursion.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'User');
$$;

CREATE OR REPLACE FUNCTION public.get_my_region()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(auth.jwt() -> 'user_metadata' ->> 'region', 'default');
$$;

CREATE OR REPLACE FUNCTION public.get_my_branch_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(auth.jwt() -> 'user_metadata' ->> 'branch_id', 'default');
$$;


-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;


-- 4. CREATE SECURE POLICIES FOR USERS TABLE (NO RECURSION)
-- Dashboard can read all users
CREATE POLICY "policy_users_select_all" 
ON public.users FOR SELECT TO authenticated USING (true);

-- Users can update themselves
CREATE POLICY "policy_users_update_self" 
ON public.users FOR UPDATE TO authenticated USING (email = (auth.jwt() ->> 'email'));

-- Only Super Admins can manage everything
CREATE POLICY "policy_users_super_admin_manage" 
ON public.users FOR ALL TO authenticated USING (public.get_my_role() = 'Super Admin');


-- 5. CREATE SECURE POLICIES FOR SALES TABLE (Fixed Delhi Visibility)
CREATE POLICY "policy_sales_admin" 
ON public.sales FOR ALL TO authenticated USING (public.get_my_role() IN ('Super Admin', 'Admin'));

-- Matches exact branch_id instead of region
CREATE POLICY "policy_sales_user_branch" 
ON public.sales FOR ALL TO authenticated USING (public.get_my_role() = 'User' AND branch_id = public.get_my_branch_id());


-- 6. CREATE SECURE POLICIES FOR FIELD VISITS TABLE
CREATE POLICY "policy_visits_admin" 
ON public.field_visits FOR ALL TO authenticated USING (public.get_my_role() IN ('Super Admin', 'Admin'));

CREATE POLICY "policy_visits_user_branch" 
ON public.field_visits FOR ALL TO authenticated USING (public.get_my_role() = 'User' AND branch_id = public.get_my_branch_id());


-- 7. CREATE SECURE POLICIES FOR COMPLAINTS TABLE
CREATE POLICY "policy_complaints_admin" 
ON public.complaints FOR ALL TO authenticated USING (public.get_my_role() IN ('Super Admin', 'Admin'));

CREATE POLICY "policy_complaints_user_branch" 
ON public.complaints FOR ALL TO authenticated USING (public.get_my_role() = 'User' AND branch_id = public.get_my_branch_id());


-- 8. CREATE SECURE POLICIES FOR STOCK TABLE
CREATE POLICY "policy_stock_admin" 
ON public.stock FOR ALL TO authenticated USING (public.get_my_role() IN ('Super Admin', 'Admin'));

CREATE POLICY "policy_stock_user_region" 
ON public.stock FOR ALL TO authenticated USING (public.get_my_role() = 'User' AND region = public.get_my_region());


-- 9. SECURE STORAGE OBJECTS
UPDATE storage.buckets SET public = true WHERE id IN ('complaint-images', 'warranty-images', 'warranty-templates');

DROP POLICY IF EXISTS "Authenticated users can select images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public can select images" ON storage.objects;

CREATE POLICY "Public can select images" 
ON storage.objects FOR SELECT TO public
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



