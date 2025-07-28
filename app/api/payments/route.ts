import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService, PaymentHistory } from '@/app/lib/database';

// GET all payments
export async function GET() {
  try {
    const dbService = await getDatabaseService();
    const payments = await dbService.getAllPayments();
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new payment
export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json();
    
    // Validate required fields
    const requiredFields = ['loan_id', 'pay_id', 'amount', 'payment_method'];
    for (const field of requiredFields) {
      if (paymentData[field] === undefined || paymentData[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const dbService = await getDatabaseService();
    const paymentId = await dbService.createPayment({
      ...paymentData,
      notes: paymentData.notes || ''
    });

    // Get the created payment
    const payments = await dbService.getAllPayments();
    const newPayment = payments.find((p: PaymentHistory) => p.history_id === paymentId);
    
    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 