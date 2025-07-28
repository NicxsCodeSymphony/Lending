import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

interface RouteParams {
  params: {
    loanId: string;
  };
}

// GET receipts by loan ID
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
    const receipts = await dbService.getReceiptsByLoanId(loanId);
    
    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching loan receipts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 