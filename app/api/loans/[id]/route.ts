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

    let dbUpdateData = updateData;
    
    // If the update data contains frontend field names, transform them
    if (updateData.interest_rate !== undefined || updateData.terms_months !== undefined) {
      const interestAmount = (updateData.loan_amount * updateData.interest_rate) / 100;
      const grossReceivable = updateData.loan_amount + interestAmount;
      const monthlyPayment = updateData.terms_months > 0 ? grossReceivable / updateData.terms_months : 0;
      
      dbUpdateData = {
        customer_id: updateData.customer_id,
        loan_start: updateData.start_date,
        months: updateData.terms_months,
        loan_end: updateData.due_date,
        loan_amount: updateData.loan_amount,
        interest: updateData.interest_rate,
        gross_receivable: grossReceivable,
        payday_payment: monthlyPayment,
        status: updateData.status
      };
    }

    await dbService.updateLoan(loanId, dbUpdateData);
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

// DELETE loan by ID
export async function DELETE(
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
    await dbService.deleteLoan(loanId);
    
    return NextResponse.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH recalculate loan balance
export async function PATCH(
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
    
    // Get the loan
    const loan = await dbService.getLoanById(loanId);
    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Get all receipts for this loan
    const receipts = await dbService.getReceiptsByLoanId(loanId);
    
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
    await dbService.updateLoan(loanId, {
      overall_balance: newBalance,
      balance: newBalance,
      status: newStatus
    });

    const updatedLoan = await dbService.getLoanById(loanId);
    
    return NextResponse.json({
      loan: updatedLoan,
      totalToPay,
      totalPaid,
      newBalance,
      newStatus,
      message: 'Loan balance recalculated successfully'
    });
  } catch (error) {
    console.error('Error recalculating loan balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 