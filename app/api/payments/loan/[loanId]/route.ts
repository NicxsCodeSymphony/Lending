import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// GET payment history by loan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ loanId: string }> }
) {
  try {
    const { loanId } = await params;
    const loanIdNum = parseInt(loanId);
    
    if (isNaN(loanIdNum)) {
      return NextResponse.json(
        { error: 'Invalid loan ID' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    const paymentHistory = await dbService.getPaymentHistoryByLoanId(loanIdNum);
    
    return NextResponse.json(paymentHistory);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 