# NextJS TypeScript Backend

This project now includes a complete TypeScript backend built with NextJS API routes and SQLite database.

## Features

- **TypeScript Support**: Full type safety throughout the backend
- **SQLite Database**: Lightweight, file-based database with proper schema
- **RESTful API**: Complete CRUD operations for all entities
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Type Definitions**: Strongly typed interfaces for all database entities

## Database Schema

### Tables

1. **user** - User authentication and account management
2. **customers** - Customer information and details
3. **loan** - Loan records with financial calculations
4. **receipt** - Payment schedules and receipts
5. **payment_history** - Payment transaction history

### Relationships

- `loan.customer_id` → `customers.customer_id` (Foreign Key)
- `receipt.loan_id` → `loan.loan_id` (Foreign Key)
- `payment_history.loan_id` → `loan.loan_id` (Foreign Key)
- `payment_history.pay_id` → `receipt.pay_id` (Foreign Key)

## API Endpoints

### Authentication

- `POST /api/auth` - User login

### Customers

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer by ID
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Loans

- `GET /api/loans` - Get all loans
- `POST /api/loans` - Create new loan
- `GET /api/loans/[id]` - Get loan by ID
- `PUT /api/loans/[id]` - Update loan
- `GET /api/loans/customer/[customerId]` - Get loans by customer ID

### Receipts

- `POST /api/receipts` - Create new receipt
- `GET /api/receipts/loan/[loanId]` - Get receipts by loan ID

### Payments

- `POST /api/payments` - Create payment history record
- `GET /api/payments/loan/[loanId]` - Get payment history by loan ID

## Type Definitions

### User

```typescript
interface User {
  account_id: number;
  account_name: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}
```

### Customer

```typescript
interface Customer {
  customer_id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  contact: string;
  address: string;
  birthdate: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

### Loan

```typescript
interface Loan {
  loan_id: number;
  customer_id: number;
  loan_start: string;
  months: number;
  loan_end: string;
  transaction_date: string;
  loan_amount: number;
  interest: number;
  gross_receivable: number;
  payday_payment: number;
  service: number;
  balance: number;
  adjustment: number;
  overall_balance: number;
  penalty: number;
  status: string;
  created_at: string;
  updated_at: string;
}
```

### Receipt

```typescript
interface Receipt {
  pay_id: number;
  loan_id: number;
  to_pay: number;
  original_to_pay?: number;
  schedule: string;
  amount: number;
  transaction_time: string;
  status: string;
  updated_at: string;
}
```

### PaymentHistory

```typescript
interface PaymentHistory {
  history_id: number;
  loan_id: number;
  pay_id: number;
  amount: number;
  payment_method: string;
  notes: string;
  transaction_time: string;
}
```

## Usage

### Frontend API Client

The project includes a TypeScript API client (`app/lib/api-client.ts`) for easy frontend integration:

```typescript
import { customerAPI, loanAPI, authAPI } from "@/app/lib/api-client";

// Authentication
const loginResult = await authAPI.login("admin", "admin");

// Customers
const customers = await customerAPI.getAll();
const newCustomer = await customerAPI.create({
  first_name: "John",
  middle_name: "Doe",
  last_name: "Smith",
  contact: "1234567890",
  address: "123 Main St",
  birthdate: "1990-01-01",
  status: "Recently Added",
});

// Loans
const loans = await loanAPI.getAll();
const customerLoans = await loanAPI.getByCustomerId(1);
```

### Database Service

For direct database operations:

```typescript
import { getDatabaseService } from "@/app/lib/database";

const dbService = await getDatabaseService();
const customers = await dbService.getAllCustomers();
const customer = await dbService.getCustomerById(1);
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. The database will be automatically initialized when the first API request is made.

3. Default admin user is created:
   - Username: `admin`
   - Password: `admin`

## Development

### Running the Development Server

```bash
npm run dev
```

This will start both the NextJS frontend and the API routes.

### Database Location

The SQLite database file (`lending.db`) will be created in the project root directory.

### Error Handling

All API endpoints include proper error handling:

- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication errors)
- 404: Not Found (resource not found)
- 500: Internal Server Error (server errors)

## Security Notes

- Passwords are stored in plain text (for development only)
- In production, implement proper password hashing and JWT authentication
- Add input validation and sanitization
- Implement rate limiting and CORS policies

## Migration from Old Backend

The new TypeScript backend replaces the old JavaScript server in `app/server/`. The API endpoints maintain the same functionality but with improved type safety and error handling.
