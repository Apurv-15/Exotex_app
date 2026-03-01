-- UPDATE EXISTING BUCKETS TO PRIVATE --

-- Run this snippet to convert your existing PUBLIC buckets to PRIVATE. 
-- Since your table RLS is already enabled, you just need this to fix the buckets.

UPDATE storage.buckets SET public = false WHERE id IN ('complaint-images', 'warranty-images', 'warranty-templates');

-- If you need to revert them back to public, you can run:
-- UPDATE storage.buckets SET public = true WHERE id IN ('complaint-images', 'warranty-images', 'warranty-templates');
