import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// POST create new payment history
export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json();
    
    // Validate required fields
    const requiredFields = ['loan_id', 'pay_id', 'amount', 'payment_method', 'notes'];
    for (const field of requiredFields) {
      if (!paymentData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const dbService = await getDatabaseService();
    const historyId = await dbService.createPaymentHistory(paymentData);

    // Get the created payment history
    const paymentHistory = await dbService.getPaymentHistoryByLoanId(paymentData.loan_id);
    const newPayment = paymentHistory.find(p => p.history_id === historyId);
    
    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 