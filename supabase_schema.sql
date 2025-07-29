DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS receipt CASCADE;
DROP TABLE IF EXISTS loan CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

CREATE TABLE "users" (
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

-- Create default admin users (matches current SQLite setup)
INSERT INTO "users" (account_name, username, password) 
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
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now - customize as needed)
CREATE POLICY "Allow all operations on users" ON "users" FOR ALL USING (true);
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loan_updated_at BEFORE UPDATE ON loan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receipt_updated_at BEFORE UPDATE ON receipt FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Verify tables were created
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'customers', 'loan', 'receipt', 'payment_history')
ORDER BY table_name, ordinal_position;