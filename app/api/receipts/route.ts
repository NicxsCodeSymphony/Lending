import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// GET all receipts
export async function GET() {
  try {
    const dbService = await getDatabaseService();
    const receipts = await dbService.getAllReceipts();
    
    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new receipt
export async function POST(request: NextRequest) {
  try {
    const receiptData = await request.json();
    
    // Validate required fields
    const requiredFields = ['loan_id', 'to_pay', 'schedule', 'amount'];
    for (const field of requiredFields) {
      if (receiptData[field] === undefined || receiptData[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const dbService = await getDatabaseService();
    const receiptId = await dbService.createReceipt({
      ...receiptData,
      status: receiptData.status || 'Not Paid'
    });

    // Get the created receipt
    const receipts = await dbService.getReceiptsByLoanId(receiptData.loan_id);
    const newReceipt = receipts.find(r => r.pay_id === receiptId);
    
    return NextResponse.json(newReceipt, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 