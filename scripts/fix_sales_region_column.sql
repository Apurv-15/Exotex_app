-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX THE REGIONAL FILTERING ERROR
-- This adds the missing 'region' column to the sales table.

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS region TEXT;
CREATE INDEX IF NOT EXISTS idx_sales_region ON public.sales(region);

-- Update existing sales: if city is 'Delhi', mark region as 'Delhi' (optional example)
-- UPDATE public.sales SET region = 'Delhi' WHERE city ILIKE 'Delhi' AND region IS NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
