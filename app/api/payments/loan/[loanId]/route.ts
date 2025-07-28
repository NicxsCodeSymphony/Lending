import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

interface RouteParams {
  params: {
    loanId: string;
  };
}

// GET payment history by loan ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const loanId = parseInt(params.loanId);
    
    if (isNaN(loanId)) {
      return NextResponse.json(
        { error: 'Invalid loan ID' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    const paymentHistory = await dbService.getPaymentHistoryByLoanId(loanId);
    
    return NextResponse.json(paymentHistory);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 