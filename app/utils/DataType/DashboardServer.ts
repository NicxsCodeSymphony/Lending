import axios from 'axios'
import { getLoans } from './LoanServer'
import { getCustomers } from './CustomerServer'
import { fetchReceipt } from './ReceiptServer'
import type { Loan } from './Loans'
import type { Receipts } from './Receipt'
import type { Customer } from './Customers'

const url = "/api"

export interface DashboardStats {
  // Financial Stats
  total_loans_amount: number
  total_interest_earned: number
  total_collected: number
  total_outstanding: number
  total_penalties: number
  collection_rate: number
  
  // Loan Stats
  total_loans: number
  active_loans: number
  completed_loans: number
  overdue_loans: number
  pending_loans: number
  
  // Customer Stats
  total_customers: number
  active_customers: number
  
  // Recent Activity
  recent_loans: Loan[]
  recent_payments: Receipts[]
  
  // Monthly trends for chart
  monthly_trends: MonthlyTrend[]
}

export interface MonthlyTrend {
  month: string
  loans_amount: number
  payments_collected: number
  new_customers: number
}

export interface SystemStatus {
  database_connected: boolean
  api_status: 'online' | 'error' | 'offline'
  last_sync: string
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Fetch all data in parallel
    const [loans, customers, receipts] = await Promise.all([
      getLoans(),
      getCustomers(),
      fetchReceipt()
    ])

    // Calculate financial stats
    const total_loans_amount = loans.reduce((sum, loan) => sum + loan.loan_amount, 0)
    const total_interest_earned = loans.reduce((sum, loan) => sum + loan.interest_amount, 0)
    const total_outstanding = loans.reduce((sum, loan) => {
      // Completed loans should have 0 balance
      const effectiveBalance = loan.status.toLowerCase() === 'completed' ? 0 : loan.balance
      return sum + effectiveBalance
    }, 0)
    const total_penalties = loans.reduce((sum, loan) => sum + loan.penalty, 0)
    const total_collected = total_loans_amount + total_interest_earned - total_outstanding
    const collection_rate = (total_loans_amount + total_interest_earned) > 0 
      ? (total_collected / (total_loans_amount + total_interest_earned)) * 100 
      : 0

    // Calculate loan stats
    const total_loans = loans.length
    const active_loans = loans.filter(l => l.status.toLowerCase() === 'active').length
    const completed_loans = loans.filter(l => l.status.toLowerCase() === 'completed').length
    const overdue_loans = loans.filter(l => l.status.toLowerCase() === 'overdue').length
    const pending_loans = loans.filter(l => l.status.toLowerCase() === 'pending').length

    // Calculate customer stats
    const total_customers = customers.length
    const active_customers = customers.filter(c => c.status.toLowerCase() === 'active').length

    // Get recent activity (last 5 items)
    const recent_loans = loans
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    const recent_payments = receipts
      .sort((a, b) => new Date(b.transaction_time).getTime() - new Date(a.transaction_time).getTime())
      .slice(0, 5)

    // Calculate monthly trends (last 6 months)
    const monthly_trends = calculateMonthlyTrends(loans, receipts, customers)

    return {
      total_loans_amount,
      total_interest_earned,
      total_collected,
      total_outstanding,
      total_penalties,
      collection_rate,
      total_loans,
      active_loans,
      completed_loans,
      overdue_loans,
      pending_loans,
      total_customers,
      active_customers,
      recent_loans,
      recent_payments,
      monthly_trends
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

const calculateMonthlyTrends = (loans: Loan[], receipts: Receipts[], customers: Customer[]): MonthlyTrend[] => {
  const trends: MonthlyTrend[] = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
    
    const monthLoans = loans.filter(loan => 
      new Date(loan.created_at).toISOString().slice(0, 7) === monthKey
    )
    
    const monthPayments = receipts.filter(receipt => 
      new Date(receipt.transaction_time).toISOString().slice(0, 7) === monthKey
    )
    
    const monthCustomers = customers.filter(customer => 
      new Date(customer.created_at).toISOString().slice(0, 7) === monthKey
    )
    
    trends.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      loans_amount: monthLoans.reduce((sum, loan) => sum + loan.loan_amount, 0),
      payments_collected: monthPayments.reduce((sum, receipt) => sum + receipt.amount, 0),
      new_customers: monthCustomers.length
    })
  }
  
  return trends
}

export const getSystemStatus = async (): Promise<SystemStatus> => {
  try {
    // Test API connectivity
    await axios.get(`${url}/loans`, { timeout: 5000 })
    
    return {
      database_connected: true,
      api_status: 'online',
      last_sync: new Date().toISOString()
    }
  } catch {
    return {
      database_connected: false,
      api_status: 'error',
      last_sync: new Date().toISOString()
    }
  }
} 