export interface LendingData {
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
  first_name: string;
  middle_name: string;
  last_name: string;
}

export interface CreateLoanData {
  customer_id: number;
  payment_schedule: string;
  loan_start: string;
  loan_end: string;
  months: number;
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
}

export async function getLendingData(): Promise<LendingData[]> {
  try {
    const response = await fetch('/api/lending', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error fetching lending data:', err.message);
    }
    throw new Error('Failed to fetch lending data');
  }
}

export async function createLoan(loanData: CreateLoanData): Promise<LendingData> {
  try {
    const response = await fetch('/api/lending', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loanData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error creating loan:', err.message);
      throw err;
    }
    throw new Error('Failed to create loan');
  }
}

export function getLendingStats(data: LendingData[]) {
  if (!data || data.length === 0) {
    return {
      totalLoans: 0,
      totalDisbursed: 0,
      outstanding: 0,
      collectionRate: '0.0',
      totalCollected: 0,
      totalNotesReceivable: 0,
      totalLoansThisMonth: 0,
      pendingLoans: 0,
      completedLoans: 0,
      overdueLoans: 0
    };
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const today = new Date();
  
  const totalLoans = data.length;
  const totalDisbursed = data.reduce((sum, loan) => sum + (loan.loan_amount || 0), 0);
  const outstanding = data.reduce((sum, loan) => sum + (loan.overall_balance || 0), 0);
  const totalCollected = totalDisbursed - outstanding;
  const totalNotesReceivable = data.reduce((sum, loan) => sum + (loan.gross_receivable || 0), 0);
  const collectionRate = totalDisbursed > 0 ? ((totalCollected / totalDisbursed) * 100).toFixed(1) : '0.0';
  
  const totalLoansThisMonth = data.filter(loan => {
    if (!loan.transaction_date) return false;
    const loanDate = new Date(loan.transaction_date);
    return loanDate.getMonth() === currentMonth && loanDate.getFullYear() === currentYear;
  }).length;
  
  const pendingLoans = data.filter(loan => loan.status === 'Pending' || loan.status === 'not paid').length;
  const completedLoans = data.filter(loan => loan.status === 'Completed' || loan.status === 'completed').length;
  const overdueLoans = data.filter(loan => {
    if (!loan.loan_end || loan.status === 'Completed' || loan.status === 'completed') return false;
    const loanEnd = new Date(loan.loan_end);
    return loanEnd < today && (loan.status === 'Pending' || loan.status === 'not paid');
  }).length;
  
  return {
    totalLoans,
    totalDisbursed,
    outstanding,
    collectionRate,
    totalCollected,
    totalNotesReceivable,
    totalLoansThisMonth,
    pendingLoans,
    completedLoans,
    overdueLoans
  };
}