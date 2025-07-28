# API Testing Guide for NextJS with Supabase

## 🧪 **Testing Methods**

### Method 1: Local Development Testing

#### Step 1: Set Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Force production mode to use Supabase
NODE_ENV=production
VERCEL=1
```

#### Step 2: Start Development Server

```bash
npm run dev
```

#### Step 3: Run Test Script

```bash
node test-api.js
```

### Method 2: Manual Testing with cURL

#### Test GET all customers

```bash
curl http://localhost:3000/api/customers
```

#### Test POST create customer

```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "middle_name": "Doe",
    "last_name": "Smith",
    "contact": "1234567890",
    "address": "123 Main St",
    "birthdate": "1990-01-01"
  }'
```

#### Test GET specific customer

```bash
curl http://localhost:3000/api/customers/1
```

#### Test PUT update customer

```bash
curl -X PUT http://localhost:3000/api/customers/1 \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "contact": "0987654321"
  }'
```

#### Test DELETE customer

```bash
curl -X DELETE http://localhost:3000/api/customers/1
```

### Method 3: Production Testing (After Deployment)

Replace `localhost:3000` with your deployed URL:

```bash
# Example with Vercel deployment
curl https://your-app.vercel.app/api/customers

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
```

### Method 4: Using Postman or Insomnia

1. **Import these requests:**

#### GET All Customers

- Method: `GET`
- URL: `http://localhost:3000/api/customers`

#### POST Create Customer

- Method: `POST`
- URL: `http://localhost:3000/api/customers`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "first_name": "John",
  "middle_name": "Doe",
  "last_name": "Smith",
  "contact": "1234567890",
  "address": "123 Main St",
  "birthdate": "1990-01-01"
}
```

#### PUT Update Customer

- Method: `PUT`
- URL: `http://localhost:3000/api/customers/1`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "first_name": "Jane",
  "contact": "0987654321"
}
```

### Method 5: Browser Testing

1. **Open your browser**
2. **Navigate to:** `http://localhost:3000/api/customers`
3. **You should see:** JSON response with customers data

## 🔍 **Expected Responses**

### Successful GET Response

```json
[
  {
    "customer_id": 1,
    "first_name": "John",
    "middle_name": "Doe",
    "last_name": "Smith",
    "contact": "1234567890",
    "address": "123 Main St",
    "birthdate": "1990-01-01",
    "status": "Recently Added",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Successful POST Response

```json
{
  "customer_id": 2,
  "first_name": "Jane",
  "middle_name": "Doe",
  "last_name": "Smith",
  "contact": "0987654321",
  "address": "456 Oak St",
  "birthdate": "1995-05-15",
  "status": "Recently Added",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Error Response

```json
{
  "error": "Internal server error"
}
```

## 🐛 **Troubleshooting**

### Common Issues:

1. **"Internal server error"**

   - Check Supabase environment variables
   - Verify tables exist in Supabase
   - Check Vercel logs

2. **"Cannot connect to database"**

   - Verify Supabase URL and keys
   - Check internet connection
   - Ensure Supabase project is active

3. **"Table does not exist"**

   - Run the `supabase_schema.sql` script
   - Check table names match exactly

4. **"Invalid customer ID"**
   - Use a valid customer ID from your database
   - Check if the customer exists

### Debug Steps:

1. **Check Environment Variables**

   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Check Vercel Logs**

   - Go to Vercel dashboard
   - Check Functions tab for errors

3. **Check Supabase Logs**

   - Go to Supabase dashboard
   - Check Logs tab for database errors

4. **Test Database Connection**
   ```bash
   # Add this to your API route temporarily
   console.log('Database service:', typeof dbService);
   console.log('Supabase client:', supabase ? 'Connected' : 'Not connected');
   ```

## 🎯 **Testing Checklist**

- [ ] Environment variables set correctly
- [ ] Supabase tables created
- [ ] Development server running
- [ ] GET /api/customers returns data
- [ ] POST /api/customers creates new customer
- [ ] GET /api/customers/{id} returns specific customer
- [ ] PUT /api/customers/{id} updates customer
- [ ] DELETE /api/customers/{id} deletes customer (optional)
- [ ] Error handling works correctly
- [ ] Production deployment works

## 🚀 **Quick Test Commands**

```bash
# Start development server
npm run dev

# In another terminal, run tests
node test-api.js

# Or test manually
curl http://localhost:3000/api/customers
```

## 📊 **Performance Testing**

For load testing, you can use tools like:

- **Artillery**: `npm install -g artillery`
- **Apache Bench**: `ab -n 100 -c 10 http://localhost:3000/api/customers`
- **k6**: Create a k6 script for load testing

## ✅ **Success Indicators**

- ✅ All HTTP methods return appropriate status codes
- ✅ JSON responses are properly formatted
- ✅ Data is persisted in Supabase
- ✅ Error handling works correctly
- ✅ No "Internal server error" messages
- ✅ Database operations complete successfully
