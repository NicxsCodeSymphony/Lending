import { NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// POST generate receipts for existing loans
export async function POST() {
  try {
    const dbService = await getDatabaseService();
    
    // Get all loans
    const loans = await dbService.getAllLoans();
    let generatedCount = 0;
    
    for (const loan of loans) {
      // Check if this loan already has receipts
      const existingReceipts = await dbService.getReceiptsByLoanId(loan.loan_id);
      
      if (existingReceipts.length === 0) {
        // Generate receipts for this loan
        const paymentAmount = loan.payday_payment;
        const totalPayments = loan.months;
        
        for (let i = 0; i < totalPayments; i++) {
          const paymentDate = new Date(loan.loan_start);
          paymentDate.setMonth(paymentDate.getMonth() + i + 1);
          
          await dbService.createReceipt({
            loan_id: loan.loan_id,
            to_pay: paymentAmount,
            original_to_pay: paymentAmount,
            schedule: paymentDate.toISOString().split('T')[0],
            amount: 0, // No payment made yet
            status: 'Not Paid'
          });
        }
        
        generatedCount++;
        console.log(`Generated ${totalPayments} receipts for loan ${loan.loan_id}`);
      }
    }
    
    return NextResponse.json({
      message: `Generated receipts for ${generatedCount} loans`,
      totalLoans: loans.length,
      loansWithReceipts: generatedCount
    });
    
  } catch (error) {
    console.error('Error generating receipts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 