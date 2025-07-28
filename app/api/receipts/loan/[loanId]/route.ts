import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// GET receipts by loan ID
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
    const receipts = await dbService.getReceiptsByLoanId(loanIdNum);
    
    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching loan receipts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 