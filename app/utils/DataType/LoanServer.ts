import axios from 'axios'
import type { Loan, AddLoan, EditLoan, LoanStats, LoanPayment } from './Loans'

const url = "/api"

export const getLoans = async (): Promise<Loan[]> => {
  try {
    const res = await axios.get(`${url}/loans`)
    console.log('🔍 Raw loans data from API:', res.data)
    
    // Transform API response to match our Loan interface
    const transformedLoans: Loan[] = res.data.map((apiLoan: Record<string, unknown>) => ({
      loan_id: apiLoan.loan_id as number,
      customer_id: apiLoan.customer_id as number,
      customer_name: `${apiLoan.first_name as string} ${apiLoan.middle_name ? (apiLoan.middle_name as string) + ' ' : ''}${apiLoan.last_name as string}`.trim(),
      loan_amount: apiLoan.loan_amount as number,
      interest_rate: apiLoan.interest as number,
      interest_amount: (apiLoan.gross_receivable as number) - (apiLoan.loan_amount as number), // Calculate interest amount
      notes_receivable: apiLoan.gross_receivable as number,
      balance: (apiLoan.overall_balance as number) || (apiLoan.balance as number), // Use overall_balance (calculated from receipts) or fallback to balance
      penalty: apiLoan.penalty as number,
      status: apiLoan.status as 'Active' | 'Completed' | 'Overdue' | 'Pending' | 'Cancelled',
      start_date: apiLoan.loan_start as string,
      due_date: apiLoan.loan_end as string,
      created_at: apiLoan.created_at as string,
      updated_at: apiLoan.updated_at as string,
      payment_schedule: 'Monthly',
      terms_months: apiLoan.months as number
    }))
    
    return transformedLoans
  } catch (err) {
    console.error("Failed to fetch loans: ", err)
    throw err
  }
}

export const getLoanById = async (id: number): Promise<Loan> => {
  try {
    const res = await axios.get(`${url}/loans/${id}`)
    return res.data
  } catch (err) {
    console.error("Failed to fetch loan: ", err)
    throw err
  }
}

export const addLoan = async (data: AddLoan): Promise<Loan> => {
  try {
    const res = await axios.post(`${url}/loans`, data)
    return res.data
  } catch (err) {
    console.error("Failed to add loan: ", err)
    throw err
  }
}

export const updateLoan = async (id: number, data: EditLoan): Promise<Loan> => {
  try {
    const res = await axios.put(`${url}/loans/${id}`, data)
    return res.data
  } catch (err) {
    console.error("Failed to update loan: ", err)
    throw err
  }
}

export const deleteLoan = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${url}/loans/${id}`)
  } catch (err) {
    console.error("Failed to delete loan: ", err)
    throw err
  }
}

export const getLoansByCustomer = async (customerId: number): Promise<Loan[]> => {
  try {
    const res = await axios.get(`${url}/loans/customer/${customerId}`)
    return res.data
  } catch (err) {
    console.error("Failed to fetch customer loans: ", err)
    throw err
  }
}

export const getLoanStats = async (): Promise<LoanStats> => {
  try {
    const res = await axios.get(`${url}/loans/stats`)
    return res.data
  } catch (err) {
    console.error("Failed to fetch loan stats: ", err)
    throw err
  }
}

export const makeLoanPayment = async (loanId: number, payment: LoanPayment): Promise<void> => {
  try {
    await axios.post(`${url}/loans/${loanId}/payments`, payment)
  } catch (err) {
    console.error("Failed to make loan payment: ", err)
    throw err
  }
}

