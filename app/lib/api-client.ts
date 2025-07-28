import { Customer, Loan, Receipt, PaymentHistory } from './database';

const API_BASE = '/api';

// Generic API client functions
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    return apiRequest<{ success: boolean; user: { account_id: number; account_name: string; username: string } }>('/auth', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
};

// Customer API
export const customerAPI = {
  getAll: () => apiRequest<Customer[]>('/customers'),
  
  getById: (id: number) => apiRequest<Customer>(`/customers/${id}`),
  
  create: (customerData: Omit<Customer, 'customer_id' | 'created_at' | 'updated_at'>) =>
    apiRequest<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }),
  
  update: (id: number, customerData: Partial<Omit<Customer, 'customer_id' | 'created_at' | 'updated_at'>>) =>
    apiRequest<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    }),
  
  delete: (id: number) =>
    apiRequest<{ message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// Loan API
export const loanAPI = {
  getAll: () => apiRequest<Loan[]>('/loans'),
  
  getById: (id: number) => apiRequest<Loan>(`/loans/${id}`),
  
  getByCustomerId: (customerId: number) => apiRequest<Loan[]>(`/loans/customer/${customerId}`),
  
  create: (loanData: Omit<Loan, 'loan_id' | 'created_at' | 'updated_at'>) =>
    apiRequest<Loan>('/loans', {
      method: 'POST',
      body: JSON.stringify(loanData),
    }),
  
  update: (id: number, loanData: Partial<Omit<Loan, 'loan_id' | 'created_at' | 'updated_at'>>) =>
    apiRequest<Loan>(`/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(loanData),
    }),
};

// Receipt API
export const receiptAPI = {
  getByLoanId: (loanId: number) => apiRequest<Receipt[]>(`/receipts/loan/${loanId}`),
  
  create: (receiptData: Omit<Receipt, 'pay_id' | 'transaction_time' | 'updated_at'>) =>
    apiRequest<Receipt>('/receipts', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    }),
};

// Payment History API
export const paymentAPI = {
  getByLoanId: (loanId: number) => apiRequest<PaymentHistory[]>(`/payments/loan/${loanId}`),
  
  create: (paymentData: Omit<PaymentHistory, 'history_id' | 'transaction_time'>) =>
    apiRequest<PaymentHistory>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
};

// Dashboard API (for aggregated data)
export const dashboardAPI = {
  getStats: async () => {
    const [customers, loans] = await Promise.all([
      customerAPI.getAll(),
      loanAPI.getAll(),
    ]);

    const totalCustomers = customers.length;
    const totalLoans = loans.length;
    const activeLoans = loans.filter(loan => loan.status === 'Active').length;
    const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.loan_amount, 0);

    return {
      totalCustomers,
      totalLoans,
      activeLoans,
      totalLoanAmount,
    };
  },
}; 