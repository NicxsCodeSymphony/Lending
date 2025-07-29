export interface PaymentHistory {
  history_id: number;
  loan_id: number;
  receipt_id: number;
  amount: number;
  payment_method: string;
  notes: string;
  transaction_time: string;
  created_at: string;
  updated_at: string;
  // Joined fields from loan and customer
  customer_name?: string;
  loan_amount?: number;
  payment_type?: string;
}

export interface PaymentHistoryFormData {
  loan_id: number;
  receipt_id: number;
  amount: number;
  payment_method: string;
  notes: string;
  transaction_time: string;
}

export interface PaymentHistoryUpdateData extends PaymentHistoryFormData {
  history_id: number;
}

export interface PaymentHistoryStats {
  totalTransactions: number;
  totalAmount: number;
  completedTransactions: number;
  pendingTransactions: number;
  totalPayments: number;
  totalDisbursements: number;
  monthlyStats: {
    month: string;
    total: number;
    count: number;
  }[];
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

class PaymentHistoryServer {
  private baseUrl = '/api/payment-history';

  async getAllPaymentHistory(): Promise<PaymentHistory[]> {
    try {
      const response = await fetch(this.baseUrl);
      const result: ApiResponse<PaymentHistory[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payment history');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching payment history');
    }
  }

  async getPaymentHistoryById(history_id: number): Promise<PaymentHistory> {
    try {
      const response = await fetch(`${this.baseUrl}/${history_id}`);
      const result: ApiResponse<PaymentHistory> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payment history record');
      }

      if (!result.data) {
        throw new Error('Payment history record not found');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching payment history record');
    }
  }

  async getPaymentHistoryByLoanId(loan_id: number): Promise<PaymentHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/loan/${loan_id}`);
      const result: ApiResponse<PaymentHistory[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payment history for loan');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching payment history for loan');
    }
  }

  async createPaymentHistory(paymentData: PaymentHistoryFormData): Promise<PaymentHistory> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result: ApiResponse<PaymentHistory> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment history record');
      }

      if (!result.data) {
        throw new Error('Failed to create payment history record');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while creating payment history record');
    }
  }

  async updatePaymentHistory(updateData: PaymentHistoryUpdateData): Promise<PaymentHistory> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result: ApiResponse<PaymentHistory> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update payment history record');
      }

      if (!result.data) {
        throw new Error('Failed to update payment history record');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while updating payment history record');
    }
  }

  async deletePaymentHistory(history_id: number): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history_id }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete payment history record');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while deleting payment history record');
    }
  }

  async searchPaymentHistory(query: string): Promise<PaymentHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      const result: ApiResponse<PaymentHistory[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to search payment history');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while searching payment history');
    }
  }

  async getPaymentHistoryByDateRange(startDate: string, endDate: string): Promise<PaymentHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/date-range?start=${startDate}&end=${endDate}`);
      const result: ApiResponse<PaymentHistory[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payment history by date range');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching payment history by date range');
    }
  }

  async getPaymentHistoryStats(): Promise<PaymentHistoryStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      const result: ApiResponse<PaymentHistoryStats> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payment history statistics');
      }

      if (!result.data) {
        throw new Error('Failed to fetch payment history statistics');
      }

      return result.data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching payment history statistics');
    }
  }

  async getPaymentHistoryByMethod(payment_method: string): Promise<PaymentHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/method/${payment_method}`);
      const result: ApiResponse<PaymentHistory[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payment history by method');
      }

      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('An unexpected error occurred while fetching payment history by method');
    }
  }
}

export const paymentHistoryServer = new PaymentHistoryServer(); 