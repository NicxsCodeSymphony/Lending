-- Supabase Setup Script
-- Run this in your Supabase SQL Editor to create the necessary tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  account_id SERIAL PRIMARY KEY,
  account_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
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

-- Create loan table
CREATE TABLE IF NOT EXISTS loan (
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

-- Create receipt table
CREATE TABLE IF NOT EXISTS receipt (
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

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
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

-- Create default admin user
INSERT INTO users (account_name, username, password) 
VALUES ('admin', 'admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for now - you can restrict these later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on loan" ON loan FOR ALL USING (true);
CREATE POLICY "Allow all operations on receipt" ON receipt FOR ALL USING (true);
CREATE POLICY "Allow all operations on payment_history" ON payment_history FOR ALL USING (true);