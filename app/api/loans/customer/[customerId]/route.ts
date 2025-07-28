import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// GET loans by customer ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const customerIdNum = parseInt(customerId);
    
    if (isNaN(customerIdNum)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    const loans = await dbService.getLoansByCustomerId(customerIdNum);
    
    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching customer loans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 