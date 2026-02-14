# Roadmap: Separate Bucket for Complaint Photos

## Objective
Store complaint-related photos in a dedicated Supabase storage bucket named `complaint-images` instead of the shared `warranty-images` bucket.

## Implementation Steps

### 1. Backend: Create Storage Bucket (Manual Action Required)
You need to create the bucket in your Supabase Dashboard:
1. Go to **Storage**.
2. Click **New Bucket**.
3. Name it: `complaint-images`.
4. Set it to **Public**.
5. Save.

**Add Storage Policies (if RLS is enabled):**
- **SELECT**: Enable read access for all (Public).
- **INSERT**: Enable upload access for authenticated/anon users (depending on your auth setup).

### 2. Service Layer: Update `ComplaintService.ts` (Completed)
- Implement `uploadImage` method in `ComplaintService`.
- Point this method to the `complaint-images` bucket.
- Include logic for:
  - Network connectivity checks.
  - Base64 encoding/decoding.
  - Local storage fallback if offline.

### 3. Frontend: Update `RaiseComplaintStep2.tsx` (Completed)
- Switch the upload function call from `SalesService.uploadImage` to `ComplaintService.uploadImage`.
- Ensure the image path logic uses `complaint-images`.

### 4. Verification
- Raise a new complaint with a photo.
- Check Supabase Storage > `complaint-images` bucket.
- Verify the image appears there.
- Verify the `image_urls` in the `complaints` table point to the new bucket URL.
