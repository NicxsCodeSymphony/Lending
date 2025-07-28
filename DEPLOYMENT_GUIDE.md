# Deployment Guide - Fixing PUT/POST API Issues with Supabase

## Problem

Your lending application is experiencing "Internal server error" for PUT and POST requests when deployed on Vercel. This is because you're using a local SQLite database file (`lending.db`) which doesn't work in serverless environments.

## Solution: Migrate to Supabase

### Step 1: Install Supabase Client

The `@supabase/supabase-js` dependency has already been added to your `package.json`.

### Step 2: Set up Supabase Database

1. **Create a Supabase Account**

   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Get Your Project Credentials**

   - In your Supabase dashboard, go to Settings → API
   - Copy your Project URL and API keys:
     - **Project URL**: `https://your-project-id.supabase.co`
     - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Create Database Tables**

   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the entire contents of `supabase_schema.sql` file
   - Click "Run" to execute the script

   **OR** manually run this SQL (exact conversion from your current SQLite):

```sql
-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS receipt CASCADE;
DROP TABLE IF EXISTS loan CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Create user table (matches current SQLite structure)
CREATE TABLE "user" (
  account_id SERIAL PRIMARY KEY,
  account_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table (matches current SQLite structure)
CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  middle_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  address TEXT NOT NULL,
  birthdate TEXT NOT NULL,
  status TEXT DEFAULT 'Recently Added',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create loan table (matches current SQLite structure)
CREATE TABLE loan (
  loan_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  loan_start DATE NOT NULL,
  months INTEGER NOT NULL,
  loan_end DATE NOT NULL,
  transaction_date DATE NOT NULL,
  loan_amount REAL NOT NULL,
  interest REAL NOT NULL,
  gross_receivable REAL NOT NULL,
  payday_payment REAL NOT NULL,
  service REAL NOT NULL,
  balance REAL NOT NULL,
  adjustment REAL NOT NULL,
  overall_balance REAL NOT NULL,
  penalty REAL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- Create receipt table (matches current SQLite structure)
CREATE TABLE receipt (
  pay_id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL,
  to_pay REAL NOT NULL,
  original_to_pay REAL,
  schedule TEXT NOT NULL,
  amount REAL NOT NULL,
  transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'Not Paid',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_loan FOREIGN KEY (loan_id) REFERENCES loan(loan_id) ON DELETE CASCADE
);

-- Create payment_history table (matches current SQLite structure)
CREATE TABLE payment_history (
  history_id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL,
  pay_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT NOT NULL,
  transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_loan FOREIGN KEY (loan_id) REFERENCES loan(loan_id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_receipt FOREIGN KEY (pay_id) REFERENCES receipt(pay_id) ON DELETE CASCADE
);

-- Create default admin user (matches current SQLite setup)
INSERT INTO "user" (account_name, username, password)
VALUES ('admin', 'admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX idx_loan_customer_id ON loan(customer_id);
CREATE INDEX idx_loan_created_at ON loan(created_at DESC);
CREATE INDEX idx_receipt_loan_id ON receipt(loan_id);
CREATE INDEX idx_receipt_transaction_time ON receipt(transaction_time);
CREATE INDEX idx_payment_history_loan_id ON payment_history(loan_id);
CREATE INDEX idx_payment_history_transaction_time ON payment_history(transaction_time DESC);

-- Enable Row Level Security (RLS) for production security
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now - customize as needed)
CREATE POLICY "Allow all operations on user" ON "user" FOR ALL USING (true);
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on loan" ON loan FOR ALL USING (true);
CREATE POLICY "Allow all operations on receipt" ON receipt FOR ALL USING (true);
CREATE POLICY "Allow all operations on payment_history" ON payment_history FOR ALL USING (true);

-- Create functions for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loan_updated_at BEFORE UPDATE ON loan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receipt_updated_at BEFORE UPDATE ON receipt FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
```

### Step 3: Set Environment Variables

Add these environment variables to your Vercel project:

1. **Go to your Vercel Dashboard**

   - Select your project
   - Go to Settings → Environment Variables

2. **Add the following variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service_role key

### Step 4: Deploy Your Application

1. Commit and push your changes to GitHub
2. Vercel will automatically redeploy your application
3. The application will now use Supabase in production

### Step 5: Verify the Fix

After deployment, test your API endpoints:

```bash
# Test GET (should work)
curl https://your-app.vercel.app/api/customers/1

# Test POST (should now work)
curl -X POST https://your-app.vercel.app/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "middle_name": "Doe",
    "last_name": "Smith",
    "contact": "1234567890",
    "address": "123 Main St",
    "birthdate": "1990-01-01"
  }'

# Test PUT (should now work)
curl -X PUT https://your-app.vercel.app/api/customers/1 \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane"
  }'
```

## How the Fix Works

### Before (SQLite - Local File)

- Database stored in `lending.db` file
- File system access required
- Not persistent in serverless environment
- Each function invocation gets fresh environment

### After (Supabase - Cloud Database)

- Database stored in Supabase PostgreSQL
- No file system dependency
- Persistent across deployments
- Works perfectly in serverless environment
- Built-in authentication and real-time features

## Code Changes Made

1. **Added Supabase Support**: Created `SupabaseDatabaseService` class
2. **Environment Detection**: Automatically switches between SQLite (development) and Supabase (production)
3. **Unified Interface**: Both database services implement the same methods
4. **Supabase Client Integration**: Uses Supabase's powerful client library
5. **Exact Schema Conversion**: PostgreSQL schema matches your current SQLite structure exactly

## Development vs Production

- **Development**: Uses SQLite with local `lending.db` file
- **Production**: Uses Supabase automatically

The application will automatically detect the environment and use the appropriate database.

## Supabase Benefits

1. **Free Tier**: 500MB database, 50MB file storage, 2GB bandwidth
2. **Real-time**: Built-in real-time subscriptions
3. **Authentication**: Built-in auth system
4. **Dashboard**: Beautiful admin interface
5. **API**: Auto-generated REST and GraphQL APIs
6. **Edge Functions**: Serverless functions
7. **Storage**: File storage with CDN

## Troubleshooting

### If you still get errors:

1. **Check Vercel Logs**

   - Go to your Vercel dashboard
   - Check the "Functions" tab for error logs

2. **Verify Environment Variables**

   - Ensure Supabase environment variables are set in Vercel
   - Check that the keys are correct

3. **Test Database Connection**

   - Check if the database is accessible from your Vercel functions
   - Verify tables exist in Supabase dashboard

4. **Check Supabase Dashboard**

   - Go to your Supabase project dashboard
   - Check the "Table Editor" to see if tables exist
   - Check "Logs" for any database errors

## Migration from SQLite to Supabase

If you have existing data in your SQLite database:

1. **Export SQLite Data**

   ```bash
   sqlite3 lending.db ".dump" > backup.sql
   ```

2. **Import to Supabase**

   - Go to Supabase SQL Editor
   - Run the exported SQL (modify as needed for PostgreSQL syntax)

3. **Or Start Fresh**

   - The application will work seamlessly with a fresh Supabase database

## Security Notes

- The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges - keep it secure
- Use Row Level Security (RLS) in Supabase for production applications
- Consider using Supabase Auth for user authentication

## Next Steps

After setting up Supabase, you can enhance your application with:

1. **Real-time Updates**: Subscribe to database changes
2. **Authentication**: Use Supabase Auth instead of custom auth
3. **File Storage**: Store documents and images
4. **Edge Functions**: Add serverless functions
5. **Database Backups**: Automatic backups with Supabase
