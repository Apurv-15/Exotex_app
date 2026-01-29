# Security Best Practices for Supabase

## ✅ What We've Implemented

### 1. **Environment Variables**
- Credentials stored in `.env` file
- `.env` is in `.gitignore` (won't be committed to Git)
- `.env.example` provided as template (safe to commit)

### 2. **Proper Key Usage**
- ✅ Using **Anon/Publishable Key** (safe for client-side)
- ❌ NOT using **Service Role Key** (must stay server-side only)

## 🔒 Real Security: Row Level Security (RLS)

The anon key is **designed to be public**. Your real security comes from **Row Level Security policies** in Supabase.

### Why the Anon Key is Safe:
1. It has **limited permissions** by default
2. All database access is controlled by **RLS policies**
3. Even if someone has your anon key, they can only do what RLS allows
4. Supabase designed it this way intentionally for client-side apps

### What Actually Protects Your Data:
```sql
-- Example: Users can only read their own branch data
CREATE POLICY "Users can read their branch sales"
    ON sales FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.branch_id = sales.branch_id
        )
    );
```

## 🛡️ Security Layers

### Layer 1: Authentication
- Users must log in to access data
- JWT tokens are used for authentication
- Tokens expire and auto-refresh

### Layer 2: Row Level Security (RLS)
- Database-level access control
- Policies define who can read/write what
- Even with the anon key, users can't bypass RLS

### Layer 3: API Rate Limiting
- Supabase automatically rate limits requests
- Prevents abuse even if key is exposed

### Layer 4: Environment Variables
- Keys not hardcoded in source code
- Different keys for dev/staging/production
- Easy to rotate if needed

## 🚨 What to NEVER Expose

### ❌ Service Role Key
```
NEVER use this in client-side code!
This key bypasses RLS and has full database access
```

### ❌ Database Password
```
Only Supabase needs this
Never share or expose
```

### ❌ JWT Secret
```
Used to sign tokens
Keep this secret
```

## ✅ What's Safe to Expose

### ✅ Anon/Publishable Key
```
Designed for client-side use
Protected by RLS policies
Safe in frontend code
```

### ✅ Project URL
```
Public endpoint
Safe to expose
```

## 🔐 Additional Security Measures

### 1. Enable Email Verification
```sql
-- In Supabase Dashboard → Authentication → Settings
-- Enable "Confirm email" option
```

### 2. Set Up RLS Policies (CRITICAL!)
See `SUPABASE_SETUP.md` for complete RLS setup

### 3. Use HTTPS Only
- Supabase enforces HTTPS by default
- Never disable SSL

### 4. Implement Rate Limiting
```typescript
// Client-side rate limiting example
const rateLimiter = {
    lastCall: 0,
    minInterval: 1000, // 1 second
    
    async throttle(fn: Function) {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCall;
        
        if (timeSinceLastCall < this.minInterval) {
            throw new Error('Too many requests');
        }
        
        this.lastCall = now;
        return await fn();
    }
};
```

### 5. Validate Input on Client AND Server
```typescript
// Always validate user input
const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};
```

### 6. Use Prepared Statements
Supabase automatically uses prepared statements, preventing SQL injection

### 7. Monitor Usage
- Check Supabase Dashboard → Reports
- Set up alerts for unusual activity
- Review API logs regularly

## 🔄 Key Rotation (If Needed)

If you ever need to rotate your anon key:

1. Go to Supabase Dashboard → Settings → API
2. Click "Reset anon key"
3. Update your `.env` file
4. Redeploy your app

**Note:** This will invalidate all existing sessions

## 📱 Production Deployment

For production:

1. Use different Supabase projects for dev/staging/prod
2. Set environment variables in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Expo: Use `eas.json` for environment configs

3. Never commit `.env` to Git
4. Use `.env.example` as template for team members

## 🎯 Summary

**Your current setup is secure because:**
1. ✅ Anon key is in `.env` (not hardcoded)
2. ✅ `.env` is in `.gitignore`
3. ✅ Using anon key (not service role key)
4. ✅ RLS policies will protect your data
5. ✅ Authentication required for access

**The anon key being "public" is by design and is safe when combined with proper RLS policies.**

## 📚 Learn More

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Understanding RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [API Security](https://supabase.com/docs/guides/api/securing-your-api)
