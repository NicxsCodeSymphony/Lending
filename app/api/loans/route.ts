import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// GET all loans
export async function GET() {
  try {
    const dbService = await getDatabaseService();
    const loans = await dbService.getAllLoans();
    
    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new loan
export async function POST(request: NextRequest) {
  try {
    const loanData = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'customer_id', 'loan_start', 'months', 'loan_end', 'transaction_date',
      'loan_amount', 'interest', 'gross_receivable', 'payday_payment',
      'service', 'balance', 'adjustment', 'overall_balance', 'status'
    ];
    
    for (const field of requiredFields) {
      if (loanData[field] === undefined || loanData[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const dbService = await getDatabaseService();
    const loanId = await dbService.createLoan({
      ...loanData,
      penalty: loanData.penalty || 0
    });

    const newLoan = await dbService.getLoanById(loanId);
    
    return NextResponse.json(newLoan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 