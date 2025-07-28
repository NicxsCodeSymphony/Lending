import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET customer by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const customerId = parseInt(params.id);
    
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    const customer = await dbService.getCustomerById(customerId);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update customer
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const customerId = parseInt(params.id);
    
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    const dbService = await getDatabaseService();
    
    // Check if customer exists
    const existingCustomer = await dbService.getCustomerById(customerId);
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    await dbService.updateCustomer(customerId, updateData);
    const updatedCustomer = await dbService.getCustomerById(customerId);

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE customer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const customerId = parseInt(params.id);
    
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    
    // Check if customer exists
    const existingCustomer = await dbService.getCustomerById(customerId);
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    await dbService.deleteCustomer(customerId);

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 