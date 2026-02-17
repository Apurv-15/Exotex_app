-- SQL Fix for Missing invoice_number Column
-- Run this in your Supabase SQL Editor to fix the PGRST204 error

-- 1. Add invoice_number column to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- 2. Optional: If you want to sync existing data
UPDATE public.sales 
SET invoice_number = warranty_id 
WHERE invoice_number IS NULL;

-- 3. Verify the change by listing columns
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'sales';
