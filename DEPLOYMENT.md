# Vercel Deployment Guide

## Fixing the 500 Error on /api/auth

The 500 error you're experiencing is likely due to missing Supabase configuration or database tables. Follow these steps to fix it:

### 1. Set Up Supabase Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**To get these values:**

- Go to your Supabase dashboard
- Go to **Settings** → **API**
- Copy the **Project URL** for `NEXT_PUBLIC_SUPABASE_URL`
- Copy the **service_role** key for `SUPABASE_SERVICE_ROLE_KEY`

### 2. Create Database Tables in Supabase

1. Go to your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase_setup.sql`
4. Click **Run** to execute the script

This will create all necessary tables and the default admin user.

### 3. Test the Login

After setting up the environment variables and creating the tables:

1. Deploy your app to Vercel
2. Try logging in with:
   - Username: `admin`
   - Password: `admin`

### 4. Check Vercel Logs

If you still get errors, check the Vercel function logs:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Functions** tab
4. Click on the `/api/auth` function
5. Check the logs for detailed error messages

### 5. Common Issues and Solutions

**Issue: "Supabase client not initialized"**

- Solution: Check that both environment variables are set correctly in Vercel

**Issue: "Table does not exist"**

- Solution: Run the `supabase_setup.sql` script in your Supabase SQL Editor

**Issue: "Permission denied"**

- Solution: Make sure you're using the `service_role` key, not the `anon` key

**Issue: "Row Level Security" errors**

- Solution: The setup script includes RLS policies, but you might need to adjust them based on your needs

**Issue: "Invalid JWT token format"**

- Solution: This has been fixed in the latest code. The API now generates proper JWT tokens with the correct format (header.payload.signature)

**Issue: Database schema mismatch**

- Solution: Make sure to use the corrected `supabase_setup.sql` file which has the proper `username` column (not `usersname`)

### 6. Development vs Production

- **Development**: Uses SQLite database (local file)
- **Production**: Uses Supabase PostgreSQL database

The app automatically switches based on the `NODE_ENV` environment variable.

### 7. Manual Database Setup (Alternative)

If you prefer to set up tables manually:

1. Go to Supabase dashboard → **Table Editor**
2. Create each table manually using the schema from `supabase_setup.sql`
3. Insert the admin user manually:
   ```sql
   INSERT INTO users (account_name, username, password)
   VALUES ('admin', 'admin', 'admin');
   ```

### 8. Debugging

The updated code includes extensive logging. Check your Vercel function logs to see:

- Which database service is being used
- Whether environment variables are set correctly
- Any specific error messages
- JWT token generation status

### 9. Recent Fixes

**Fixed Issues:**

- ✅ TypeScript linting errors (replaced `any` types)
- ✅ JWT token format (now generates proper JWT structure)
- ✅ Database schema typo (`usersname` → `username`)
- ✅ Better error handling and logging
- ✅ Improved Supabase initialization

If you need more help, share the error logs from Vercel and I can assist further.
