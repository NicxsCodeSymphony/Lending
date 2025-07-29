import { toManilaTime } from './utils'

export interface ReceiptRecord {
  receipt_id: number;
  loan_id: number;
  to_pay: number;
  original_to_pay: number;
  schedule: string;
  amount: number;
  transaction_time: string;
  status: string;
  payment_number: number;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistoryData {
  history_id?: number;
  loan_id: number;
  receipt_id: number;
  amount: number;
  payment_method: string;
  notes: string;
  transaction_time: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoanUpdateData {
  loan_id: number;
  overall_balance?: number;
  penalty?: number;
  status?: string;
}

export interface ReceiptUpdateData {
  amount: number;
  transaction_time: string;
  status: string;
}

export interface PaymentDistribution {
  totalPayment: number;
  payments: Array<{
    receipt_id: number;
    paymentNumber: number;
    dueDate: Date;
    originalAmount: number;
    appliedAmount: number;
    remainingAmount: number;
    status: string;
  }>;
  remainingBalance: number;
  isPenaltyPayment: boolean;
}

// API Response types
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface LoanApiResponse {
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

interface PaymentHistoryApiResponse {
  history_id: number;
  loan_id: number;
  receipt_id: number;
  amount: number;
  payment_method: string;
  notes: string;
  transaction_time: string;
  created_at: string;
  updated_at: string;
}

class PaymentServer {
  private baseUrl = '/api';

  /**
   * Fetch all receipts for a specific loan
   */
  async getReceiptsByLoanId(loanId: number): Promise<ReceiptRecord[]> {
    try {
      console.log(`Fetching receipts for loan ${loanId}...`);
      
      const response = await fetch(`${this.baseUrl}/receipts/loan/${loanId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch receipts:', response.status, response.statusText, errorData);
        throw new Error(`Failed to fetch receipts: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Received ${data.length} receipts:`, data);
      return data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching receipts:', err.message);
      }
      throw new Error('Failed to fetch receipts');
    }
  }

  /**
   * Update a specific receipt
   */
  async updateReceipt(receiptId: number, updateData: ReceiptUpdateData): Promise<ReceiptRecord> {
    try {
      console.log(`Updating receipt ${receiptId} with data:`, updateData);

      const response = await fetch(`${this.baseUrl}/receipts/${receiptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`Failed to update receipt ${receiptId}:`, error);
        throw new Error(`Failed to update receipt ${receiptId}: ${error.error}`);
      }

      const result = await response.json();
      console.log(`Successfully updated receipt ${receiptId}:`, result);
      return result;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error updating receipt:', err.message);
      }
      throw new Error(`Failed to update receipt ${receiptId}`);
    }
  }

  /**
   * Update loan data (balance, penalty, status)
   */
  async updateLoan(updateData: LoanUpdateData): Promise<LoanApiResponse> {
    try {
      console.log('Updating loan with data:', updateData);

      const response = await fetch(`${this.baseUrl}/lending`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to update loan: ${error.error}`);
      }

      const result = await response.json();
      console.log('Successfully updated loan:', result);
      return result;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error updating loan:', err.message);
      }
      throw new Error('Failed to update loan');
    }
  }

  async createPaymentHistory(paymentData: PaymentHistoryData): Promise<PaymentHistoryApiResponse> {
    try {
      console.log('Creating payment history with data:', paymentData);

      const response = await fetch(`${this.baseUrl}/payment-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to record payment history:', error);
        throw new Error(`Failed to record payment history: ${error.error}`);
      }

      const result = await response.json();
      console.log('Payment history recorded successfully:', result);
      return result;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error creating payment history:', err.message);
      }
      throw new Error('Failed to create payment history');
    }
  }

  /**
   * Process a penalty payment
   */
  async processPenaltyPayment(
    loanId: number,
    paymentAmount: number,
    paymentMethod: string,
    notes: string
  ): Promise<void> {
    try {
      // First, get current loan data to calculate new values
      const loanResponse = await fetch(`${this.baseUrl}/lending`);
      if (!loanResponse.ok) {
        throw new Error('Failed to fetch loan data');
      }
      
      const loans = await loanResponse.json() as LoanApiResponse[];
      const currentLoan = loans.find((loan: LoanApiResponse) => loan.loan_id === loanId);
      
      if (!currentLoan) {
        throw new Error('Loan not found');
      }

      const newPenalty = Math.max(0, currentLoan.penalty - paymentAmount);
      const newBalance = currentLoan.overall_balance - paymentAmount;

      // Update loan
      await this.updateLoan({
        loan_id: loanId,
        penalty: newPenalty,
        overall_balance: Math.max(0, newBalance),
        status: newBalance <= 0 ? 'Completed' : 'Ongoing'
      });

      // Record payment history
      await this.createPaymentHistory({
        loan_id: loanId,
        receipt_id: 0, // Penalty payments don't have receipt_id
        amount: paymentAmount,
        payment_method: paymentMethod,
        notes: notes || `Penalty payment`,
        transaction_time: toManilaTime()
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error processing penalty payment:', err.message);
      }
      throw new Error('Failed to process penalty payment');
    }
  }

  /**
   * Process a loan payment with distribution across receipts
   */
  async processLoanPayment(
    loanId: number,
    paymentAmount: number,
    paymentMethod: string,
    notes: string,
    receipts: ReceiptRecord[]
  ): Promise<void> {
    try {
      // Calculate payment distribution
      const paymentDistribution = this.calculatePaymentDistribution(paymentAmount, receipts);
      
      if (!paymentDistribution || (!paymentDistribution.isPenaltyPayment && (!paymentDistribution.payments || paymentDistribution.payments.length === 0))) {
        throw new Error('No payment distribution available. Please try again.');
      }

      // Update receipts
      if (paymentDistribution.payments && paymentDistribution.payments.length > 0) {
        const updatePromises = paymentDistribution.payments.map(async (payment) => {
          const currentReceipt = receipts.find(r => r.receipt_id === payment.receipt_id);
          const existingAmount = currentReceipt?.amount || 0;
          const newTotalAmount = existingAmount + payment.appliedAmount;

          const updateData: ReceiptUpdateData = {
            amount: newTotalAmount,
            transaction_time: toManilaTime(),
            status: payment.remainingAmount === 0 ? 'Paid' : 'Partial'
          };

          return this.updateReceipt(payment.receipt_id, updateData);
        });

        await Promise.all(updatePromises);
      }

      // Update loan balance and status
      const newBalance = paymentDistribution.remainingBalance;
      const newStatus = newBalance <= 0 ? 'Completed' : 'Ongoing';

      await this.updateLoan({
        loan_id: loanId,
        overall_balance: Math.max(0, newBalance),
        status: newStatus
      });

      // Record payment history
      await this.createPaymentHistory({
        loan_id: loanId,
        receipt_id: paymentDistribution.payments[0]?.receipt_id || 0,
        amount: paymentAmount,
        payment_method: paymentMethod,
        notes: notes || `Loan payment`,
        transaction_time: toManilaTime()
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error processing loan payment:', err.message);
      }
      throw new Error('Failed to process loan payment');
    }
  }

  /**
   * Calculate payment distribution across receipts
   */
  private calculatePaymentDistribution(paymentAmount: number, receipts: ReceiptRecord[]): PaymentDistribution | null {
    const nextUnpaidReceipt = receipts.find(receipt => 
      receipt.status === 'Pending' || receipt.status === 'Overdue' || receipt.status === 'Partial'
    );

    if (!nextUnpaidReceipt) {
      return null;
    }

    let remainingPayment = paymentAmount;
    const payments: Array<{
      receipt_id: number;
      paymentNumber: number;
      dueDate: Date;
      originalAmount: number;
      appliedAmount: number;
      remainingAmount: number;
      status: string;
    }> = [];

    for (const receipt of receipts) {
      if (remainingPayment <= 0) break;

      const alreadyPaid = receipt.amount || 0;
      const paymentDue = receipt.to_pay;
      const stillNeeded = paymentDue - alreadyPaid;
      
      if (stillNeeded <= 0) continue;

      const appliedAmount = Math.min(remainingPayment, stillNeeded);
      const remainingAmount = stillNeeded - appliedAmount;

      payments.push({
        receipt_id: receipt.receipt_id,
        paymentNumber: receipt.payment_number,
        dueDate: new Date(receipt.due_date),
        originalAmount: paymentDue,
        appliedAmount,
        remainingAmount,
        status: remainingAmount === 0 ? 'fully_paid' : 'partially_paid'
      });

      remainingPayment -= appliedAmount;
    }

    return {
      totalPayment: paymentAmount,
      payments,
      remainingBalance: Math.max(0, receipts.reduce((sum, r) => sum + (r.to_pay - (r.amount || 0)), 0) - paymentAmount),
      isPenaltyPayment: false
    };
  }
 
  async getPaymentHistoryByLoanId(loanId: number): Promise<PaymentHistoryData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payment-history`);
      if (!response.ok) {
        throw new Error(`Failed to fetch payment history: ${response.status}`);
      }

      const result = await response.json();
      const allHistory = result.data || [];
      
      // Filter by loan_id
      return allHistory.filter((history: PaymentHistoryData) => history.loan_id === loanId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching payment history:', err.message);
      }
      throw new Error('Failed to fetch payment history');
    }
  }

  async getAllPaymentHistory(): Promise<PaymentHistoryData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payment-history`);
      if (!response.ok) {
        throw new Error(`Failed to fetch payment history: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching payment history:', err.message);
      }
      throw new Error('Failed to fetch payment history');
    }
  }


  async getLoanPaymentStats(loanId: number): Promise<{
    totalPaid: number;
    totalReceipts: number;
    paidReceipts: number;
    pendingReceipts: number;
    overdueReceipts: number;
    partialReceipts: number;
  }> {
    try {
      const receipts = await this.getReceiptsByLoanId(loanId);
      const paymentHistory = await this.getPaymentHistoryByLoanId(loanId);

      const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
      const totalReceipts = receipts.length;
      const paidReceipts = receipts.filter(r => r.status === 'Paid').length;
      const pendingReceipts = receipts.filter(r => r.status === 'Pending').length;
      const overdueReceipts = receipts.filter(r => r.status === 'Overdue').length;
      const partialReceipts = receipts.filter(r => r.status === 'Partial').length;

      return {
        totalPaid,
        totalReceipts,
        paidReceipts,
        pendingReceipts,
        overdueReceipts,
        partialReceipts
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error getting loan payment stats:', err.message);
      }
      throw new Error('Failed to get loan payment stats');
    }
  }

  validatePaymentAmount(
    paymentAmount: number,
    paymentType: string,
    loanBalance: number,
    loanPenalty: number
  ): { isValid: boolean; error?: string } {
    if (paymentAmount <= 0) {
      return { isValid: false, error: 'Payment amount must be greater than 0' };
    }

    if (paymentType === 'penalty_payment') {
      if (paymentAmount > loanPenalty) {
        return { isValid: false, error: 'Penalty payment amount cannot exceed the current penalty amount' };
      }
    } else {
      if (paymentAmount > loanBalance) {
        return { isValid: false, error: 'Payment amount cannot exceed the total outstanding balance' };
      }
    }

    return { isValid: true };
  }
  getQuickPaymentSuggestions(receipts: ReceiptRecord[], loanBalance: number, loanPenalty: number): {
    nextDue: number;
    allPending: number;
    fullBalance: number;
    fullPenalty: number;
    halfPenalty: number;
    quarterPenalty: number;
  } {
    const recentPartial = receipts
      .filter(r => r.status === 'Partial')
      .sort((a, b) => b.payment_number - a.payment_number)[0];

    const nextUnpaid = receipts.find(r => r.status === 'Pending' || r.status === 'Overdue');
    
    const nextDue = recentPartial 
      ? recentPartial.to_pay - recentPartial.amount
      : nextUnpaid 
        ? nextUnpaid.to_pay - nextUnpaid.amount
        : 0;

    const allPending = receipts
      .filter(r => r.status === 'Pending' || r.status === 'Overdue' || r.status === 'Partial')
      .reduce((sum, r) => sum + (r.to_pay - r.amount), 0);

    return {
      nextDue,
      allPending,
      fullBalance: loanBalance,
      fullPenalty: loanPenalty,
      halfPenalty: loanPenalty * 0.5,
      quarterPenalty: loanPenalty * 0.25
    };
  }
}

export const paymentServer = new PaymentServer();
export default PaymentServer; 