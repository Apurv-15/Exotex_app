# Region-Based Data Filtering Setup

## Overview
This system allows users to be assigned to specific regions (like Mumbai, Delhi, Bangalore) so they only see data relevant to their region.

## What Was Fixed

### 1. **User Profile Enhancement**
- Added `region` field to the `User` interface
- Users can now be assigned to specific regions during registration

### 2. **Database Schema Updates**
Run this SQL in your Supabase SQL Editor:

```sql
-- Add region column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS region TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_region ON public.users(region);
```

### 3. **Registration Flow**
- Added "Region" input field in the Create Access modal
- Region is optional - leave empty for users who should see all regions
- Region is saved to both Supabase Auth metadata and the users table

### 4. **Data Filtering Logic**

#### **Super Admin**
- Sees ALL data across all regions and branches
- No filtering applied

#### **Admin/User with Region**
- **Sales**: Filtered by `branchId`
- **Field Visits**: Filtered by `branchId`
- **Stock**: Filtered by `region` (e.g., "Mumbai")
- **Complaints**: Filtered by `branchId`

#### **Admin/User without Region**
- Sees all data (fallback behavior)

## How to Use

### Creating a Region-Specific User

1. **Open the app** and tap the "EKOTEX SYSTEM" title 6 times to open the Create Access modal
2. **Fill in the details:**
   - Full Name: `John Doe`
   - Email: `john@gmail.com`
   - Password: `password123`
   - Branch ID: `mumbai-branch`
   - **Region: `Mumbai`** ← This is the key field!
   - Role: Select `User` or `Admin`
3. **Click "Create Access"**

### Testing Region Filtering

1. **Login as the region-specific user** (e.g., `john@gmail.com`)
2. **Navigate to the Stock tab**
3. **You should only see stock for Mumbai** (not Delhi, Bangalore, etc.)
4. **Same applies to complaints** if they're region-based

### Updating Existing Users

To add a region to an existing user, run this SQL in Supabase:

```sql
UPDATE public.users 
SET region = 'Mumbai' 
WHERE email = 'user@example.com';
```

## Region Names

Make sure to use consistent region names. Recommended regions:
- Mumbai
- Delhi
- Bangalore
- Chennai
- Kolkata
- Hyderabad
- Pune

## Troubleshooting

### "I can't see any stock data"
- **Check your user's region**: Make sure it matches exactly with the stock region names
- **Case sensitivity**: "Mumbai" ≠ "mumbai"
- **Super Admin**: Login as Super Admin to see all data

### "Stock shows all regions instead of just mine"
- **Verify region is set**: Check if your user profile has a region assigned
- **Check the database**: Run `SELECT * FROM users WHERE email = 'your@email.com'` to verify

### "How do I make a user see all regions?"
- **Leave region empty** when creating the user
- Or set region to `NULL` in the database

## Files Modified

1. `/src/types/index.ts` - Added `region` field to User interface
2. `/src/services/AuthService.ts` - Updated to save/retrieve region
3. `/src/screens/auth/LoginScreen.tsx` - Added region input field
4. `/src/screens/dashboard/MainBranchDashboard.tsx` - Updated filtering logic
5. `/src/services/StockService.ts` - Already had `getStockByRegion` method

## Next Steps

1. **Run the SQL migration** (`ADD_USER_REGION.sql`)
2. **Create test users** with different regions
3. **Add stock data** for different regions
4. **Test the filtering** by logging in as different users
