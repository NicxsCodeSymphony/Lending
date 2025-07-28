import { NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// GET loan statistics
export async function GET() {
  try {
    const dbService = await getDatabaseService();
    const loans = await dbService.getAllLoans();
    
    // Calculate statistics
    const stats = {
      total_loans: loans.length,
      active_loans: loans.filter(loan => loan.status === 'Active').length,
      pending_loans: loans.filter(loan => loan.status === 'Pending').length,
      completed_loans: loans.filter(loan => loan.status === 'Completed').length,
      overdue_loans: loans.filter(loan => loan.status === 'Overdue').length,
      cancelled_loans: loans.filter(loan => loan.status === 'Cancelled').length,
      total_amount_disbursed: loans.reduce((sum, loan) => sum + (loan.loan_amount || 0), 0),
      total_outstanding_balance: loans.reduce((sum, loan) => sum + (loan.overall_balance || loan.balance || 0), 0),
      total_interest_earned: loans.reduce((sum, loan) => sum + ((loan.gross_receivable || 0) - (loan.loan_amount || 0)), 0),
      total_penalties: loans.reduce((sum, loan) => sum + (loan.penalty || 0), 0),
      collection_rate: 0 // Will be calculated below
    };
    
    // Calculate collection rate
    const totalReceivable = loans.reduce((sum, loan) => sum + (loan.gross_receivable || 0), 0);
    const totalCollected = totalReceivable - stats.total_outstanding_balance;
    stats.collection_rate = totalReceivable > 0 ? (totalCollected / totalReceivable) * 100 : 0;
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching loan stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 