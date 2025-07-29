import { type PaymentHistory, type PaymentHistoryStats, type PaymentHistoryFormData, type PaymentHistoryUpdateData } from "./PaymentHistoryServer";

export interface HistoryFilters {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  dateRange: string;
  paymentMethod: string;
}

export interface HistorySort {
  field: keyof PaymentHistory;
  direction: 'asc' | 'desc';
}

export interface HistoryData {
  transactions: PaymentHistory[];
  stats: PaymentHistoryStats | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

export interface HistoryActions {
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;
  searchTransactions: (query: string) => Promise<PaymentHistory[]>;
  filterByDateRange: (startDate: string, endDate: string) => Promise<PaymentHistory[]>;
  filterByPaymentMethod: (method: string) => Promise<PaymentHistory[]>;
  getTransactionsByLoan: (loanId: number) => Promise<PaymentHistory[]>;
  createTransaction: (data: PaymentHistoryFormData) => Promise<PaymentHistory>;
  updateTransaction: (id: number, data: PaymentHistoryFormData) => Promise<PaymentHistory>;
  deleteTransaction: (id: number) => Promise<void>;
  getTransactionById: (id: number) => Promise<PaymentHistory>;
  exportTransactions: (filters?: HistoryFilters) => Promise<string>;
  getTransactionStats: () => Promise<PaymentHistoryStats>;
}

class HistoryServer {
  private baseUrl = '/api/payment-history';

  // Main data fetching
  async fetchAllData(): Promise<{ transactions: PaymentHistory[]; stats: PaymentHistoryStats }> {
    try {
      const [transactionsResponse, statsResponse] = await Promise.all([
        fetch(this.baseUrl),
        fetch(`${this.baseUrl}/stats`)
      ]);

      if (!transactionsResponse.ok) {
        throw new Error(`Failed to fetch transactions: ${transactionsResponse.statusText}`);
      }

      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.statusText}`);
      }

      const transactionsData = await transactionsResponse.json();
      const statsData = await statsResponse.json();

      return {
        transactions: transactionsData.data || [],
        stats: statsData.data || null
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to fetch history data: ${err.message}`);
      }
      throw new Error('An unexpected error occurred while fetching history data');
    }
  }

  // Search functionality
  async searchTransactions(query: string): Promise<PaymentHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to search transactions');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while searching transactions');
    }
  }

  // Date range filtering
  async filterByDateRange(startDate: string, endDate: string): Promise<PaymentHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/date-range?start=${startDate}&end=${endDate}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to filter by date range');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while filtering by date range');
    }
  }

  // Payment method filtering
  async filterByPaymentMethod(method: string): Promise<PaymentHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/method/${method}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to filter by payment method');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while filtering by payment method');
    }
  }

  // Get transactions by loan ID
  async getTransactionsByLoan(loanId: number): Promise<PaymentHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/loan/${loanId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch loan transactions');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching loan transactions');
    }
  }

  // CRUD Operations
  async createTransaction(data: PaymentHistoryFormData): Promise<PaymentHistory> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create transaction');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while creating transaction');
    }
  }

  async updateTransaction(id: number, data: PaymentHistoryFormData): Promise<PaymentHistory> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_history_id: id, ...data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update transaction');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while updating transaction');
    }
  }

  async deleteTransaction(id: number): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_history_id: id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete transaction');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while deleting transaction');
    }
  }

  async getTransactionById(id: number): Promise<PaymentHistory> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch transaction');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching transaction');
    }
  }

  // Statistics
  async getTransactionStats(): Promise<PaymentHistoryStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch transaction statistics');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching transaction statistics');
    }
  }

  // Export functionality
  async exportTransactions(filters?: HistoryFilters): Promise<string> {
    try {
      let url = `${this.baseUrl}/export`;
      const params = new URLSearchParams();

      if (filters) {
        if (filters.searchTerm) params.append('search', filters.searchTerm);
        if (filters.dateRange !== 'all') params.append('dateRange', filters.dateRange);
        if (filters.paymentMethod !== 'all') params.append('method', filters.paymentMethod);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const blob = await response.blob();

      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return 'Export completed successfully';
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while exporting transactions');
    }
  }

  // Utility functions for client-side operations
  filterAndSortTransactions(
    transactions: PaymentHistory[],
    filters: HistoryFilters,
    sort: HistorySort
  ): PaymentHistory[] {
    let filtered = [...transactions];

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(transaction =>
        transaction.customer_name?.toLowerCase().includes(searchLower) ||
        transaction.notes?.toLowerCase().includes(searchLower) ||
        transaction.payment_method.toLowerCase().includes(searchLower) ||
        transaction.amount.toString().includes(searchLower)
      );
    }

    // Apply payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(transaction =>
        transaction.payment_method === filters.paymentMethod
      );
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const transactionDate = new Date();
      
      filtered = filtered.filter(transaction => {
        transactionDate.setTime(new Date(transaction.transaction_time).getTime());
        
        switch (filters.dateRange) {
          case 'today':
            return transactionDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transactionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            return transactionDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            return transactionDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }

  // Format utilities
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Status and type utilities
  getStatusBadge(transaction: PaymentHistory): { label: string; variant: string; className: string } {
    // Determine status based on transaction data
    const isPayment = transaction.amount > 0;
    const isRecent = new Date(transaction.transaction_time) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (isPayment) {
      return {
        label: 'Completed',
        variant: 'secondary',
        className: 'bg-green-100 text-green-800'
      };
    }

    if (isRecent) {
      return {
        label: 'Pending',
        variant: 'secondary',
        className: 'bg-yellow-100 text-yellow-800'
      };
    }

    return {
      label: 'Processed',
      variant: 'secondary',
      className: 'bg-blue-100 text-blue-800'
    };
  }

  getTypeIcon(transaction: PaymentHistory): { icon: string; className: string } {
    const notes = transaction.notes?.toLowerCase() || '';
    
    if (notes.includes('penalty')) {
      return { icon: '⚠️', className: 'text-red-600' };
    }
    
    if (notes.includes('loan')) {
      return { icon: '💰', className: 'text-green-600' };
    }
    
    return { icon: '📊', className: 'text-blue-600' };
  }

  // Validation utilities
  validateTransactionData(data: PaymentHistoryFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.loan_id || typeof data.loan_id !== 'number') {
      errors.push('Loan ID is required and must be a number');
    }

    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      errors.push('Amount is required and must be a positive number');
    }

    if (!data.payment_method || typeof data.payment_method !== 'string') {
      errors.push('Payment method is required');
    }

    if (!data.transaction_time) {
      errors.push('Transaction time is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const historyServer = new HistoryServer(); 