# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project Name: `warranty-management`
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
5. Click "Create new project"

## Step 2: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the public API key)

3. Update `src/config/supabase.ts`:
   ```typescript
   const SUPABASE_URL = 'YOUR_PROJECT_URL_HERE';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
   ```

## Step 3: Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run this SQL:

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

-- Create indexes for better performance
CREATE INDEX idx_sales_branch_id ON sales(branch_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_warranty_id ON sales(warranty_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_branch_id ON users(branch_id);

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

-- Insert sample sales data
INSERT INTO sales (
    customer_name, phone, email, address, city, date,
    water_testing_before, water_testing_after,
    executive_name, designation, plumber_name,
    product_model, serial_number, product_details_confirmed,
    sale_date, branch_id, warranty_id, status
) VALUES
    (
        'Apurv Deshmukh', '9876543210', 'apurv@example.com',
        '123 Main Street', 'Mumbai', '2023-10-26',
        '150', '50', 'Rahul Kumar', 'Sales Executive', 'Vijay Plumber',
        'Inverter Model X', 'SN12345678', true,
        '2023-10-26', 'sub1', 'WAR-001', 'approved'
    ),
    (
        'John Doe', '1234567890', 'john@example.com',
        '456 Park Avenue', 'Delhi', '2023-10-27',
        '200', '60', 'Priya Sharma', 'Sales Manager', 'Ravi Plumber',
        'Battery Model Z', 'SN87654321', true,
        '2023-10-27', 'sub1', 'WAR-002', 'pending'
    );
```

## Step 3.5: Create Storage Bucket for Images

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Fill in:
   - Name: `warranty-images`
   - Public bucket: **Yes** (check this box)
4. Click **Create bucket**

### Set Storage Policies

Go to **Storage** → **Policies** → **warranty-images** and create these policies:

```sql
-- Allow anyone to read images (public bucket)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'warranty-images' );

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'warranty-images' 
    AND auth.role() = 'authenticated'
);

-- Allow users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'warranty-images' AND auth.role() = 'authenticated' );
```

## Step 4: Set Up Row Level Security (RLS)

Run this SQL to enable security policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data"
    ON users FOR SELECT
    USING (auth.uid()::text = id::text);

-- Sales policies
CREATE POLICY "Admins can read all sales"
    ON sales FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Admin'
        )
    );

CREATE POLICY "Users can read their branch sales"
    ON sales FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.branch_id = sales.branch_id
        )
    );

CREATE POLICY "Users can insert sales for their branch"
    ON sales FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.branch_id = sales.branch_id
        )
    );

CREATE POLICY "Admins can update all sales"
    ON sales FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Admin'
        )
    );
```

## Step 5: Enable Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Optionally configure email templates

## Step 6: Test Connection

After updating your credentials in `src/config/supabase.ts`, restart your app:

```bash
npm run web
```

## Environment Variables (Optional but Recommended)

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Then update `src/config/supabase.ts`:

```typescript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
```

## Next Steps

1. Update `AuthService.ts` to use Supabase authentication
2. Update `SalesService.ts` to use Supabase database
3. Test login and data operations

See the updated service files for implementation examples.
