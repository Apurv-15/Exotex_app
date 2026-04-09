-- ==========================================
-- ANALYTICS TABLE SETUP
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create the analytics table
CREATE TABLE IF NOT EXISTS public.user_analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name TEXT NOT NULL,
    user_id UUID,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_analytics_events ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow authenticated users to insert their own analytics
CREATE POLICY "Allow authenticated insert" 
ON public.user_analytics_events 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow anonymous users to insert (if your app supports it)
CREATE POLICY "Allow anonymous insert" 
ON public.user_analytics_events 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Only admins should be able to view all analytics
CREATE POLICY "Admins can view all analytics" 
ON public.user_analytics_events 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id::text = auth.uid()::text 
        AND users.role IN ('Admin', 'Super Admin')
    )
);

-- 4. Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.user_analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.user_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.user_analytics_events(created_at);

-- 5. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
