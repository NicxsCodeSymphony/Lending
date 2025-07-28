import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// GET all customers
export async function GET() {
  try {
    const dbService = await getDatabaseService();
    const customers = await dbService.getAllCustomers();
    
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new customer
export async function POST(request: NextRequest) {
  try {
    const customerData = await request.json();
    
    // Validate required fields
    const requiredFields = ['first_name', 'middle_name', 'last_name', 'contact', 'address', 'birthdate'];
    for (const field of requiredFields) {
      if (!customerData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const dbService = await getDatabaseService();
    const customerId = await dbService.createCustomer({
      ...customerData,
      status: customerData.status || 'Recently Added'
    });

    const newCustomer = await dbService.getCustomerById(customerId);
    
    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 