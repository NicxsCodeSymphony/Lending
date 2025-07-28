import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Type definitions for our database entities
export interface User {
  account_id: number;
  account_name: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
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

export interface Loan {
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

export interface Receipt {
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

export interface PaymentHistory {
  history_id: number;
  loan_id: number;
  pay_id: number;
  amount: number;
  payment_method: string;
  notes: string;
  transaction_time: string;
}

// Check if we're in production (Vercel) or development
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// Initialize Supabase client for production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = isProduction ? createClient(supabaseUrl, supabaseKey) : null;

let db: Database | null = null;

// SQLite Database (Development)
export async function getDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  db = await open({
    filename: path.resolve(process.cwd(), 'lending.db'),
    driver: sqlite3.Database
  });

  await initializeTables();
  return db;
}

// Supabase Database (Production)
async function initializeSupabaseTables(): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // Create user table - matches current SQLite structure
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "user" (
          account_id SERIAL PRIMARY KEY,
          account_name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    });

    // Create customers table - matches current SQLite structure
    await supabase.rpc('exec_sql', {
      sql: `
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
        )
      `
    });

    // Create loan table - matches current SQLite structure
    await supabase.rpc('exec_sql', {
      sql: `
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
        )
      `
    });

    // Create receipt table - matches current SQLite structure
    await supabase.rpc('exec_sql', {
      sql: `
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
        )
      `
    });

    // Create payment_history table - matches current SQLite structure
    await supabase.rpc('exec_sql', {
      sql: `
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
        )
      `
    });

    // Create default admin user if it doesn't exist
    const { data: existingAdmin } = await supabase
      .from('user')
      .select('username')
      .eq('username', 'admin')
      .single();

    if (!existingAdmin) {
      await supabase
        .from('user')
        .insert([
          { account_name: 'admin', username: 'admin', password: 'admin' }
        ]);
      console.log('✅ Default admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing Supabase tables:', error);
    // If RPC doesn't work, we'll rely on manual table creation via Supabase dashboard
    console.log('ℹ️ Please create tables manually in Supabase dashboard using the provided SQL script');
  }
}

async function initializeTables(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  // Create user table
  await db.run(`
    CREATE TABLE IF NOT EXISTS user (
      account_id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create customers table
  await db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      middle_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      contact TEXT NOT NULL,
      address TEXT NOT NULL,
      birthdate TEXT NOT NULL,
      status TEXT DEFAULT "Recently Added",
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create loan table
  await db.run(`
    CREATE TABLE IF NOT EXISTS loan (
      loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    )
  `);

  // Create receipt table
  await db.run(`
    CREATE TABLE IF NOT EXISTS receipt (
      pay_id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      to_pay REAL NOT NULL,
      original_to_pay REAL,
      schedule TEXT NOT NULL,
      amount REAL NOT NULL,
      transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'Not Paid',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_loan FOREIGN KEY (loan_id) REFERENCES loan(loan_id) ON DELETE CASCADE
    )
  `);

  // Create payment_history table
  await db.run(`
    CREATE TABLE IF NOT EXISTS payment_history (
      history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      pay_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT NOT NULL,
      transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_payment_loan FOREIGN KEY (loan_id) REFERENCES loan(loan_id) ON DELETE CASCADE,
      CONSTRAINT fk_payment_receipt FOREIGN KEY (pay_id) REFERENCES receipt(pay_id) ON DELETE CASCADE
    )
  `);

  // Create default admin user if it doesn't exist
  const existingAdmin = await db.get<User>(
    'SELECT username FROM user WHERE username = ?',
    ['admin']
  );

  if (!existingAdmin) {
    await db.run(
      'INSERT INTO user (account_name, username, password) VALUES (?, ?, ?)',
      ['admin', 'admin', 'admin']
    );
    console.log('✅ Default admin user created');
  } else {
    console.log('✅ Admin user already exists');
  }
}

// Supabase Database Service
export class SupabaseDatabaseService {
  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) return undefined;
    return data as User;
  }

  async createUser(userData: Omit<User, 'account_id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('user')
      .insert([userData])
      .select('account_id')
      .single();
    
    if (error) throw error;
    return data.account_id;
  }

  async getAllCustomers(): Promise<Customer[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Customer[];
  }

  async getCustomerById(customerId: number): Promise<Customer | undefined> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_id', customerId)
      .single();
    
    if (error) return undefined;
    return data as Customer;
  }

  async createCustomer(customerData: Omit<Customer, 'customer_id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select('customer_id')
      .single();
    
    if (error) throw error;
    return data.customer_id;
  }

  async updateCustomer(customerId: number, customerData: Partial<Omit<Customer, 'customer_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('customers')
      .update({ ...customerData, updated_at: new Date().toISOString() })
      .eq('customer_id', customerId);
    
    if (error) throw error;
  }

  async deleteCustomer(customerId: number): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('customer_id', customerId);
    
    if (error) throw error;
  }

  async getAllLoans(): Promise<Loan[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('loan')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Loan[];
  }

  async getLoanById(loanId: number): Promise<Loan | undefined> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('loan')
      .select('*')
      .eq('loan_id', loanId)
      .single();
    
    if (error) return undefined;
    return data as Loan;
  }

  async getLoansByCustomerId(customerId: number): Promise<Loan[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('loan')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Loan[];
  }

  async createLoan(loanData: Omit<Loan, 'loan_id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('loan')
      .insert([loanData])
      .select('loan_id')
      .single();
    
    if (error) throw error;
    return data.loan_id;
  }

  async updateLoan(loanId: number, loanData: Partial<Omit<Loan, 'loan_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('loan')
      .update({ ...loanData, updated_at: new Date().toISOString() })
      .eq('loan_id', loanId);
    
    if (error) throw error;
  }

  async deleteLoan(loanId: number): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('loan')
      .delete()
      .eq('loan_id', loanId);
    
    if (error) throw error;
  }

  async getReceiptsByLoanId(loanId: number): Promise<Receipt[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('receipt')
      .select('*')
      .eq('loan_id', loanId)
      .order('transaction_time', { ascending: true });
    
    if (error) throw error;
    return data as Receipt[];
  }

  async createReceipt(receiptData: Omit<Receipt, 'pay_id' | 'transaction_time' | 'updated_at'>): Promise<number> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('receipt')
      .insert([receiptData])
      .select('pay_id')
      .single();
    
    if (error) throw error;
    return data.pay_id;
  }

  async updateReceipt(payId: number, receiptData: Partial<Omit<Receipt, 'pay_id' | 'transaction_time' | 'updated_at'>>): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('receipt')
      .update({ ...receiptData, updated_at: new Date().toISOString() })
      .eq('pay_id', payId);
    
    if (error) throw error;
  }

  async getAllReceipts(): Promise<Receipt[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('receipt')
      .select('*')
      .order('transaction_time', { ascending: false });
    
    if (error) throw error;
    return data as Receipt[];
  }

  async deleteReceipt(payId: number): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('receipt')
      .delete()
      .eq('pay_id', payId);
    
    if (error) throw error;
  }

  async getPaymentHistoryByLoanId(loanId: number): Promise<PaymentHistory[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('loan_id', loanId)
      .order('transaction_time', { ascending: false });
    
    if (error) throw error;
    return data as PaymentHistory[];
  }

  async createPaymentHistory(paymentData: Omit<PaymentHistory, 'history_id' | 'transaction_time'>): Promise<number> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('payment_history')
      .insert([paymentData])
      .select('history_id')
      .single();
    
    if (error) throw error;
    return data.history_id;
  }

  async getAllPayments(): Promise<PaymentHistory[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .order('transaction_time', { ascending: false });
    
    if (error) throw error;
    return data as PaymentHistory[];
  }

  async getPaymentById(paymentId: number): Promise<PaymentHistory | undefined> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('history_id', paymentId)
      .single();
    
    if (error) return undefined;
    return data as PaymentHistory;
  }

  async createPayment(paymentData: Omit<PaymentHistory, 'history_id' | 'transaction_time'>): Promise<number> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('payment_history')
      .insert([paymentData])
      .select('history_id')
      .single();
    
    if (error) throw error;
    return data.history_id;
  }
}

// SQLite Database Service
export class DatabaseService {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return await this.db.get('SELECT * FROM user WHERE username = ?', [username]) as User | undefined;
  }

  async createUser(userData: Omit<User, 'account_id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO user (account_name, username, password) VALUES (?, ?, ?)',
      [userData.account_name, userData.username, userData.password]
    );
    return result.lastID!;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await this.db.all('SELECT * FROM customers ORDER BY created_at DESC') as Customer[];
  }

  async getCustomerById(customerId: number): Promise<Customer | undefined> {
    return await this.db.get('SELECT * FROM customers WHERE customer_id = ?', [customerId.toString()]) as Customer | undefined;
  }

  async createCustomer(customerData: Omit<Customer, 'customer_id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO customers (first_name, middle_name, last_name, contact, address, birthdate, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customerData.first_name, customerData.middle_name, customerData.last_name, customerData.contact, customerData.address, customerData.birthdate, customerData.status]
    );
    return result.lastID!;
  }

  async updateCustomer(customerId: number, customerData: Partial<Omit<Customer, 'customer_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = Object.keys(customerData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(customerData);
    values.push(customerId.toString());
    
    await this.db.run(
      `UPDATE customers SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?`,
      values
    );
  }

  async deleteCustomer(customerId: number): Promise<void> {
    await this.db.run('DELETE FROM customers WHERE customer_id = ?', [customerId.toString()]);
  }

  // Loan operations
  async getAllLoans(): Promise<Loan[]> {
      return await this.db.all('SELECT * FROM loan ORDER BY created_at DESC') as Loan[];
  }

  async getLoanById(loanId: number): Promise<Loan | undefined> {
    return await this.db.get('SELECT * FROM loan WHERE loan_id = ?', [loanId.toString()]) as Loan | undefined;
  }

  async getLoansByCustomerId(customerId: number): Promise<Loan[]> {
    return await this.db.all('SELECT * FROM loan WHERE customer_id = ? ORDER BY created_at DESC', [customerId.toString()]) as Loan[];
  }

  async createLoan(loanData: Omit<Loan, 'loan_id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await this.db.run(
      `INSERT INTO loan (
        customer_id, loan_start, months, loan_end, transaction_date, 
        loan_amount, interest, gross_receivable, payday_payment, 
        service, balance, adjustment, overall_balance, penalty, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loanData.customer_id, loanData.loan_start, loanData.months, loanData.loan_end, loanData.transaction_date,
        loanData.loan_amount, loanData.interest, loanData.gross_receivable, loanData.payday_payment,
        loanData.service, loanData.balance, loanData.adjustment, loanData.overall_balance, loanData.penalty, loanData.status
      ]
    );
    return result.lastID!;
  }

  async updateLoan(loanId: number, loanData: Partial<Omit<Loan, 'loan_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = Object.keys(loanData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(loanData);
    values.push(loanId.toString());
    
    await this.db.run(
      `UPDATE loan SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE loan_id = ?`,
      values
    );
  }

  async deleteLoan(loanId: number): Promise<void> {
    await this.db.run('DELETE FROM loan WHERE loan_id = ?', [loanId.toString()]);
  }

  // Receipt operations
  async getReceiptsByLoanId(loanId: number): Promise<Receipt[]> {
    return await this.db.all('SELECT * FROM receipt WHERE loan_id = ? ORDER BY transaction_time', [loanId.toString()]) as Receipt[];  
  }

  async createReceipt(receiptData: Omit<Receipt, 'pay_id' | 'transaction_time' | 'updated_at'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO receipt (loan_id, to_pay, original_to_pay, schedule, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [receiptData.loan_id, receiptData.to_pay, receiptData.original_to_pay, receiptData.schedule, receiptData.amount, receiptData.status]
    );
    return result.lastID!;
  }

  async updateReceipt(payId: number, receiptData: Partial<Omit<Receipt, 'pay_id' | 'transaction_time' | 'updated_at'>>): Promise<void> {
    const fields = Object.keys(receiptData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(receiptData);
    values.push(payId.toString());
    
    await this.db.run(
      `UPDATE receipt SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE pay_id = ?`,
      values
    );
  }

  async getAllReceipts(): Promise<Receipt[]> {
    return await this.db.all('SELECT * FROM receipt ORDER BY transaction_time DESC') as Receipt[];
  }

  async deleteReceipt(payId: number): Promise<void> {
    await this.db.run('DELETE FROM receipt WHERE pay_id = ?', [payId.toString()]);
  }

  // Payment History operations
  async getPaymentHistoryByLoanId(loanId: number): Promise<PaymentHistory[]> {
    return await this.db.all('SELECT * FROM payment_history WHERE loan_id = ? ORDER BY transaction_time DESC', [loanId.toString()]) as PaymentHistory[];  
  }

  async createPaymentHistory(paymentData: Omit<PaymentHistory, 'history_id' | 'transaction_time'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO payment_history (loan_id, pay_id, amount, payment_method, notes) VALUES (?, ?, ?, ?, ?)',
      [paymentData.loan_id, paymentData.pay_id, paymentData.amount, paymentData.payment_method, paymentData.notes]
    );
    return result.lastID!;
  }

  async getAllPayments(): Promise<PaymentHistory[]> {
    return await this.db.all('SELECT * FROM payment_history ORDER BY transaction_time DESC') as PaymentHistory[];
  }

  async getPaymentById(paymentId: number): Promise<PaymentHistory | undefined> {
    return await this.db.get('SELECT * FROM payment_history WHERE history_id = ?', [paymentId.toString()]) as PaymentHistory | undefined;
  }

  async createPayment(paymentData: Omit<PaymentHistory, 'history_id' | 'transaction_time'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO payment_history (loan_id, pay_id, amount, payment_method, notes) VALUES (?, ?, ?, ?, ?)',
      [paymentData.loan_id, paymentData.pay_id, paymentData.amount, paymentData.payment_method, paymentData.notes]
    );
    return result.lastID!;
  }
}

export async function getDatabaseService(): Promise<DatabaseService | SupabaseDatabaseService> {
  if (isProduction) {
    // Initialize Supabase tables if they don't exist
    await initializeSupabaseTables();
    return new SupabaseDatabaseService();
  } else {
    // Use SQLite for development
    const database = await getDatabase();
    return new DatabaseService(database);
  }
} 