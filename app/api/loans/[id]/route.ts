import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// GET loan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loanId = parseInt(id);
    
    if (isNaN(loanId)) {
      return NextResponse.json(
        { error: 'Invalid loan ID' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    const loan = await dbService.getLoanById(loanId);

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(loan);
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update loan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loanId = parseInt(id);
    
    if (isNaN(loanId)) {
      return NextResponse.json(
        { error: 'Invalid loan ID' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    const dbService = await getDatabaseService();
    
    // Check if loan exists
    const existingLoan = await dbService.getLoanById(loanId);
    if (!existingLoan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    await dbService.updateLoan(loanId, updateData);
    const updatedLoan = await dbService.getLoanById(loanId);

    return NextResponse.json(updatedLoan);
  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 