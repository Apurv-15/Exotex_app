-- Add region column to users table for region-based filtering
-- Run this in your Supabase SQL Editor

-- 1. Add region column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS region TEXT;

-- 2. Create an index for faster region-based queries 
CREATE INDEX IF NOT EXISTS idx_users_region ON public.users(region);

-- 3. Verify the change
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public';
