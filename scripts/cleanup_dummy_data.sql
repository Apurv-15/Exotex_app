-- Clean up script to remove dummy/test data from Supabase DB

-- 1. Identify and delete dummy testing data from all tables
-- This looks for common test keywords in region, branch_id, or email

DO $$ 
BEGIN
    -- Delete dummy Field Visits
    DELETE FROM public.field_visits 
    WHERE 
        LOWER(branch_id) IN ('xxx', 'test', 'demo', 'default', 'unknown') OR
        LOWER(city) IN ('xxx', 'test', 'demo', 'default', 'unknown');

    -- Delete dummy Complaints
    DELETE FROM public.complaints 
    WHERE 
        LOWER(branch_id) IN ('xxx', 'test', 'demo', 'default', 'unknown') OR
        LOWER(city) IN ('xxx', 'test', 'demo', 'default', 'unknown');

    -- Delete dummy Sales (Warranties)
    DELETE FROM public.sales 
    WHERE 
        LOWER(branch_id) IN ('xxx', 'test', 'demo', 'default', 'unknown') OR
        LOWER(city) IN ('xxx', 'test', 'demo', 'default', 'unknown') OR
        LOWER(customer_name) LIKE '%test%' OR
        LOWER(customer_name) LIKE '%demo%';

    -- Delete dummy Stock
    DELETE FROM public.stock 
    WHERE 
        LOWER(region) IN ('xxx', 'test', 'demo', 'default', 'unknown');

    -- Delete dummy Users (Public profile table)
    DELETE FROM public.users 
    WHERE 
        LOWER(region) IN ('xxx', 'test', 'demo', 'default', 'unknown') OR
        LOWER(branch_id) IN ('xxx', 'test', 'demo', 'default', 'unknown') OR
        LOWER(email) LIKE '%test%' OR
        LOWER(email) LIKE '%demo%' OR
        LOWER(name) LIKE '%test%' OR
        LOWER(name) LIKE '%demo%';
        
END $$;
