import { NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// POST sync all loan balances
export async function POST() {
  try {
    const dbService = await getDatabaseService();
    
    // Get all loans
    const loans = await dbService.getAllLoans();
    let syncedCount = 0;
    const errors: string[] = [];
    
    for (const loan of loans) {
      try {
        // Get all receipts for this loan
        const receipts = await dbService.getReceiptsByLoanId(loan.loan_id);
        
        // Calculate actual balance based on receipts
        const totalToPay = receipts.reduce((sum, receipt) => sum + (receipt.to_pay || 0), 0);
        const totalPaid = receipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);
        const newBalance = Math.max(0, totalToPay - totalPaid);
        
        // Determine loan status
        let newStatus = loan.status;
        if (totalPaid >= totalToPay) {
          newStatus = 'Completed';
        } else if (loan.status === 'Completed' && totalPaid < totalToPay) {
          newStatus = 'Active';
        }

        // Update loan with recalculated balance
        await dbService.updateLoan(loan.loan_id, {
          overall_balance: newBalance,
          balance: newBalance,
          status: newStatus
        });
        
        syncedCount++;
        console.log(`Synced balance for loan ${loan.loan_id}: ${newBalance} (was ${loan.balance})`);
      } catch (error) {
        console.error(`Error syncing loan ${loan.loan_id}:`, error);
        errors.push(`Loan ${loan.loan_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return NextResponse.json({
      message: `Successfully synced ${syncedCount} out of ${loans.length} loans`,
      syncedCount,
      totalLoans: loans.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error syncing loan balances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 