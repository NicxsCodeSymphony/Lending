import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

interface RouteParams {
  params: {
    customerId: string;
  };
}

// GET loans by customer ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const customerId = parseInt(params.customerId);
    
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    const loans = await dbService.getLoansByCustomerId(customerId);
    
    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching customer loans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 