import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

export async function PUT(request: NextRequest) {
  try {
    const paymentData = await request.json();
    
    // Validate required fields
    const requiredFields = ['loan_id', 'payment_amount', 'reason', 'transaction_date'];
    for (const field of requiredFields) {
      if (paymentData[field] === undefined || paymentData[field] === null) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const loanId = parseInt(paymentData.loan_id);
    const paymentAmount = parseFloat(paymentData.payment_amount);
    const reason = paymentData.reason.trim();
    const transactionDate = paymentData.transaction_date;

    // Validate loan ID
    if (isNaN(loanId) || loanId <= 0) {
      return NextResponse.json({ error: 'Invalid loan ID' }, { status: 400 });
    }

    // Validate payment amount
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be a positive number' }, { status: 400 });
    }

    // Validate reason
    if (reason.length < 3) {
      return NextResponse.json({ error: 'Reason must be at least 3 characters long' }, { status: 400 });
    }

    // Validate transaction date
    if (!transactionDate || isNaN(new Date(transactionDate).getTime())) {
      return NextResponse.json({ error: 'Invalid transaction date' }, { status: 400 });
    }

    const dbService = await getDatabaseService();
    
    // Get the existing loan
    const existingLoan = await dbService.getLoanById(loanId);
    if (!existingLoan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Check if loan status allows penalty payments
    const validStatuses = ['Active', 'Pending', 'Overdue'];
    if (!validStatuses.includes(existingLoan.status)) {
      return NextResponse.json({ 
        error: `Cannot pay penalty for loan with status: ${existingLoan.status}` 
      }, { status: 400 });
    }

    // Check if there's a penalty to pay
    const currentPenalty = existingLoan.penalty || 0;
    if (currentPenalty <= 0) {
      return NextResponse.json({ error: 'No penalty to pay' }, { status: 400 });
    }

    // Check if payment amount exceeds the penalty
    if (paymentAmount > currentPenalty) {
      return NextResponse.json({ 
        error: `Payment amount (₱${paymentAmount.toLocaleString()}) cannot exceed current penalty (₱${currentPenalty.toLocaleString()})` 
      }, { status: 400 });
    }

    // Calculate new penalty amount (reduce the penalty)
    const newPenaltyAmount = Math.max(0, currentPenalty - paymentAmount);

    // Update the loan with reduced penalty
    await dbService.updateLoan(loanId, { penalty: newPenaltyAmount });

    // Get the updated loan
    const updatedLoan = await dbService.getLoanById(loanId);

    return NextResponse.json({
      message: 'Penalty payment processed successfully',
      loan: updatedLoan,
      paymentAmount: paymentAmount,
      penaltyReduced: paymentAmount,
      remainingPenalty: newPenaltyAmount,
      previousPenalty: currentPenalty
    });

  } catch (error) {
    console.error('Error processing penalty payment:', error);
    return NextResponse.json({ 
      error: 'Internal server error while processing penalty payment' 
    }, { status: 500 });
  }
} 