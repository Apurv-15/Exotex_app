-- Fix Infinite Recursion Policy
-- The previous policy caused infinite recursion because it queried the user's table (the table being protected) 
-- inside the policy check itself without a proper break condition.

-- 1. DROP only the recursive policies
DROP POLICY IF EXISTS "Authenticated users full access to field_visits" ON public.field_visits;
DROP POLICY IF EXISTS "Authenticated users full access to stock" ON public.stock;
DROP POLICY IF EXISTS "Authenticated users full access to sales" ON public.sales;
DROP POLICY IF EXISTS "Allow read access to all users" ON public.users;

-- 2. CREATE NON-RECURSIVE POLICIES
-- Instead of complex checks, we simply check if the user is authenticated via Supabase Auth.
-- This is much faster and avoids recursion.

-- Users Table: Allow reading all users if you are authenticated
CREATE POLICY "Allow authenticated to read users" ON public.users
FOR SELECT
USING (auth.role() = 'authenticated');

-- Users Table: Allow inserting your own profile (or any profile during dev, as auth.email() check is safer)
CREATE POLICY "Allow authenticated to insert profiles" ON public.users
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Field Visits: Allow full access to authenticated users
CREATE POLICY "Allow authenticated full access field_visits" ON public.field_visits
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Stock: Allow full access to authenticated users
CREATE POLICY "Allow authenticated full access stock" ON public.stock
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Sales: Allow full access to authenticated users
CREATE POLICY "Allow authenticated full access sales" ON public.sales
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
