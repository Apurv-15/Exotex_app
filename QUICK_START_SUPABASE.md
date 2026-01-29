# Quick Start: Connect App to Supabase Database

## ✅ What's Already Done

1. ✅ Supabase client configured with your credentials
2. ✅ SalesService updated to use Supabase
3. ✅ Image upload functionality added
4. ✅ Automatic fallback to local storage if Supabase isn't set up

## 🚀 Setup Steps (5 minutes)

### Step 1: Run SQL to Create Tables

1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'User')),
    branch_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    date DATE NOT NULL,
    water_testing_before TEXT,
    water_testing_after TEXT,
    executive_name TEXT,
    designation TEXT,
    plumber_name TEXT,
    product_model TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    product_details_confirmed BOOLEAN DEFAULT FALSE,
    sale_date DATE NOT NULL,
    branch_id TEXT NOT NULL,
    warranty_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    image_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sales_branch_id ON sales(branch_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_warranty_id ON sales(warranty_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample users
INSERT INTO users (email, name, role, branch_id) VALUES
    ('admin@mainbranch.com', 'Main Admin', 'Admin', 'main'),
    ('user@subbranch.com', 'Sub User', 'User', 'sub1');
```

4. Click **Run** or press `Ctrl+Enter`

### Step 2: Create Storage Bucket for Images

1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Enter name: `warranty-images`
4. Check **Public bucket** ✅
5. Click **Create bucket**

### Step 3: Set Storage Policies

1. Go to **Storage** → Click on **warranty-images** bucket
2. Click **Policies** tab
3. Click **New Policy**
4. Choose **For full customization**
5. Paste this SQL:

```sql
-- Allow anyone to read images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'warranty-images' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'warranty-images' );
```

6. Click **Review** then **Save policy**

### Step 4: Enable Row Level Security (Optional but Recommended)

For now, we'll allow public access for testing. Run this SQL:

```sql
-- Enable RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (for testing)
CREATE POLICY "Allow public read"
ON sales FOR SELECT
TO public
USING (true);

-- Allow anyone to insert (for testing)
CREATE POLICY "Allow public insert"
ON sales FOR INSERT
TO public
WITH CHECK (true);
```

**Note:** In production, you should restrict this to authenticated users only!

### Step 5: Restart Your App

```bash
# Stop the current server (Ctrl+C)
npm run web
```

## 🎉 That's It!

Your app is now connected to Supabase! 

### What Happens Now:

1. **Forms save to database** - All sales data goes to Supabase
2. **Images upload to storage** - Product images stored in Supabase Storage
3. **Real-time data** - Changes reflect across all users
4. **Automatic fallback** - If Supabase is down, uses local storage

### Test It:

1. Log in as `user@subbranch.com` / `user`
2. Create a new sale
3. Upload 4 images
4. Submit the form
5. Check your Supabase dashboard → **Table Editor** → **sales** to see the data!

## 🔍 Verify Setup

### Check if data is saving:

1. Go to Supabase Dashboard → **Table Editor**
2. Click on **sales** table
3. You should see your submitted sales

### Check if images are uploading:

1. Go to **Storage** → **warranty-images**
2. Open **sales-images** folder
3. You should see uploaded images

## 🐛 Troubleshooting

### Images not uploading?
- Check browser console for errors
- Verify storage bucket is public
- Check storage policies are created

### Data not saving?
- Check SQL was run successfully
- Verify RLS policies allow insert
- Check browser console for errors

### "Supabase not configured" warning?
- Restart your dev server
- Check `.env` file exists with correct values

## 📚 Next Steps

- Set up proper authentication (see `SUPABASE_SETUP.md`)
- Configure production RLS policies
- Add user management features

For detailed documentation, see `SUPABASE_SETUP.md`
