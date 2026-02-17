-- Fix RLS policy for stock table to allow updates without full Supabase Auth session
-- Since the app uses a custom DB-based auth mechanism, we need to allow public access (authenticated via anon key)
-- to the stock table for updates to work.

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admins have full access to stock" ON public.stock;
DROP POLICY IF EXISTS "Users can read stock for their region" ON public.stock;

-- Create a new policy allowing full access for all operations (SELECT, INSERT, UPDATE, DELETE)
-- This relies on the application logic to restrict access based on the user's role in the client.
CREATE POLICY "Enable all access for stock" ON public.stock
FOR ALL USING (true) WITH CHECK (true);
