import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// PUT add penalty to loan
export async function PUT(request: NextRequest) {
  try {
    const penaltyData = await request.json();
    
    // Validate required fields
    const requiredFields = ['loan_id', 'penalty_amount', 'reason', 'transaction_date'];
    for (const field of requiredFields) {
      if (penaltyData[field] === undefined || penaltyData[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate data types and values
    const loanId = parseInt(penaltyData.loan_id);
    const penaltyAmount = parseFloat(penaltyData.penalty_amount);
    
    if (isNaN(loanId) || loanId <= 0) {
      return NextResponse.json(
        { error: 'Invalid loan ID' },
        { status: 400 }
      );
    }

    if (isNaN(penaltyAmount) || penaltyAmount <= 0) {
      return NextResponse.json(
        { error: 'Penalty amount must be a positive number' },
        { status: 400 }
      );
    }

    if (penaltyAmount > 1000000) {
      return NextResponse.json(
        { error: 'Penalty amount cannot exceed ₱1,000,000' },
        { status: 400 }
      );
    }

    if (!penaltyData.reason.trim()) {
      return NextResponse.json(
        { error: 'Reason for penalty is required' },
        { status: 400 }
      );
    }

    if (penaltyData.reason.length > 500) {
      return NextResponse.json(
        { error: 'Reason cannot exceed 500 characters' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    
    // Check if loan exists
    const existingLoan = await dbService.getLoanById(loanId);
    if (!existingLoan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Check if loan is in a valid state for penalties
    const validStatuses = ['Active', 'Pending', 'Overdue'];
    if (!validStatuses.includes(existingLoan.status)) {
      return NextResponse.json(
        { error: `Cannot add penalty to loan with status: ${existingLoan.status}` },
        { status: 400 }
      );
    }

    // Add penalty to existing penalty amount
    const newPenaltyAmount = (existingLoan.penalty || 0) + penaltyAmount;
    
    // Update the loan with new penalty amount
    await dbService.updateLoan(loanId, {
      penalty: newPenaltyAmount
    });

    // Get the updated loan
    const updatedLoan = await dbService.getLoanById(loanId);
    
    return NextResponse.json({
      message: 'Penalty added successfully',
      loan: updatedLoan,
      penaltyAdded: penaltyAmount,
      totalPenalty: newPenaltyAmount
    });
  } catch (error) {
    console.error('Error adding penalty:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 