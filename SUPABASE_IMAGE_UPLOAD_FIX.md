# Supabase Image Upload Fix

## Current Error: "Network request failed"

This error occurs because the Supabase Storage bucket RLS policy is blocking the upload.

## Solution: Update Storage Policies

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** → Click on `warranty-images` bucket
4. Click **Policies** tab

### Step 2: Delete Existing Policy
Delete the existing "Allow public uploads" policy if it exists.

### Step 3: Create New Policies

Click **New Policy** → **For full customization** and add these TWO policies:

#### Policy 1: Allow Public Read
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'warranty-images' );
```

#### Policy 2: Allow ALL Uploads (Anonymous + Authenticated)
```sql
CREATE POLICY "Anyone can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'warranty-images' );
```

**IMPORTANT**: The second policy should have NO conditions - this allows both anonymous and authenticated uploads.

### Step 4: Verify Bucket is Public
1. Make sure the bucket itself is marked as **Public**
2. Storage → warranty-images → Settings → Public bucket = **ON**

### Step 5: Test
After setting these policies, try uploading images from your app again.

## Alternative: If Still Failing
If the error persists, it might be a CORS issue. Run this SQL in the SQL Editor:

```sql
-- Allow CORS for storage
ALTER PUBLICATION supabase_realtime ADD TABLE storage.objects;
```

Then restart your app and try again.
