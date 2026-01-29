# Supabase Storage Setup for Warranty Templates

## Error You're Seeing
```
StorageApiError: Bucket not found
GET https://...supabase.co/storage/v1/bucket/warranty-templates 400 (Bad Request)
```

## Quick Fix: Create the Storage Bucket

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `lieotdywftnbedztrntb`

### Step 2: Create Storage Bucket
1. Click **Storage** in the left sidebar
2. Click **New Bucket** button
3. Enter the following details:
   - **Name**: `warranty-templates`
   - **Public bucket**: ✅ Enable (check this box)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

4. Click **Create bucket**

### Step 3: Set Bucket Policies (Important!)
After creating the bucket, you need to set up policies so your app can access it:

1. Click on the `warranty-templates` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Select **For full customization**
5. Add the following policies:

#### Policy 1: Allow Public Read Access
```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'warranty-templates');
```

#### Policy 2: Allow Authenticated Upload
```sql
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'warranty-templates');
```

#### Policy 3: Allow Authenticated Delete (Optional)
```sql
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'warranty-templates');
```

### Step 4: Test Upload
1. Go back to your app
2. Navigate to **Admin Dashboard** → **Template Management**
3. Click **Upload New Template**
4. Select your `WARRANTY CARD.docx` file
5. It should upload successfully now!

## Verification
After upload, you should see in Supabase Storage:
```
warranty-templates/
  └── templates/
      └── warranty_card_v1_[timestamp].docx
```

## Alternative: Use Local File (Development Only)
If you don't want to set up Supabase storage right now, see the next solution below.
