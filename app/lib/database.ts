import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

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

let db: Database | null = null;

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
    console.log('ℹ️  Admin user already exists');
  }
}

// Database service functions
export class DatabaseService {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  // User operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    return await this.db.get<User>('SELECT * FROM user WHERE username = ?', [username]);
  }

  async createUser(userData: Omit<User, 'account_id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO user (account_name, username, password) VALUES (?, ?, ?)',
      [userData.account_name, userData.username, userData.password]
    );
    return result.lastID!;
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return await this.db.all<Customer>('SELECT * FROM customers ORDER BY created_at DESC');
  }

  async getCustomerById(customerId: number): Promise<Customer | undefined> {
    return await this.db.get<Customer>('SELECT * FROM customers WHERE customer_id = ?', [customerId]);
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
    values.push(customerId);
    
    await this.db.run(
      `UPDATE customers SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?`,
      values
    );
  }

  async deleteCustomer(customerId: number): Promise<void> {
    await this.db.run('DELETE FROM customers WHERE customer_id = ?', [customerId]);
  }

  // Loan operations
  async getAllLoans(): Promise<Loan[]> {
    return await this.db.all<Loan>('SELECT * FROM loan ORDER BY created_at DESC');
  }

  async getLoanById(loanId: number): Promise<Loan | undefined> {
    return await this.db.get<Loan>('SELECT * FROM loan WHERE loan_id = ?', [loanId]);
  }

  async getLoansByCustomerId(customerId: number): Promise<Loan[]> {
    return await this.db.all<Loan>('SELECT * FROM loan WHERE customer_id = ? ORDER BY created_at DESC', [customerId]);
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
    values.push(loanId);
    
    await this.db.run(
      `UPDATE loan SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE loan_id = ?`,
      values
    );
  }

  // Receipt operations
  async getReceiptsByLoanId(loanId: number): Promise<Receipt[]> {
    return await this.db.all<Receipt>('SELECT * FROM receipt WHERE loan_id = ? ORDER BY transaction_time', [loanId]);
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
    values.push(payId);
    
    await this.db.run(
      `UPDATE receipt SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE pay_id = ?`,
      values
    );
  }

  // Payment History operations
  async getPaymentHistoryByLoanId(loanId: number): Promise<PaymentHistory[]> {
    return await this.db.all<PaymentHistory>('SELECT * FROM payment_history WHERE loan_id = ? ORDER BY transaction_time DESC', [loanId]);
  }

  async createPaymentHistory(paymentData: Omit<PaymentHistory, 'history_id' | 'transaction_time'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO payment_history (loan_id, pay_id, amount, payment_method, notes) VALUES (?, ?, ?, ?, ?)',
      [paymentData.loan_id, paymentData.pay_id, paymentData.amount, paymentData.payment_method, paymentData.notes]
    );
    return result.lastID!;
  }
}

export async function getDatabaseService(): Promise<DatabaseService> {
  const database = await getDatabase();
  return new DatabaseService(database);
} 