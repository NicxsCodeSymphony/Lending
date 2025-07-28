import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// GET all loans
export async function GET() {
  try {
    const dbService = await getDatabaseService();
    const loans = await dbService.getAllLoans();
    const customers = await dbService.getAllCustomers();
    
    // Join loans with customer data
    const loansWithCustomers = loans.map(loan => {
      const customer = customers.find(c => c.customer_id === loan.customer_id);
      return {
        ...loan,
        first_name: customer?.first_name || '',
        middle_name: customer?.middle_name || '',
        last_name: customer?.last_name || ''
      };
    });
    
    return NextResponse.json(loansWithCustomers);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new loan
export async function POST(request: NextRequest) {
  try {
    const loanData = await request.json();
    
    // Validate required fields from frontend
    const requiredFields = [
      'customer_id', 'loan_amount', 'interest_rate', 'payment_schedule',
      'terms_months', 'start_date', 'due_date'
    ];
    
    for (const field of requiredFields) {
      if (loanData[field] === undefined || loanData[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Transform frontend data to database schema
    const interestAmount = (loanData.loan_amount * loanData.interest_rate) / 100;
    const grossReceivable = loanData.loan_amount + interestAmount;
    const monthlyPayment = loanData.terms_months > 0 ? grossReceivable / loanData.terms_months : 0;
    
    const dbLoanData = {
      customer_id: loanData.customer_id,
      loan_start: loanData.start_date,
      months: loanData.terms_months,
      loan_end: loanData.due_date,
      transaction_date: loanData.start_date, // Use start date as transaction date
      loan_amount: loanData.loan_amount,
      interest: loanData.interest_rate,
      gross_receivable: grossReceivable,
      payday_payment: monthlyPayment,
      service: 0, // Default service fee
      balance: grossReceivable, // Initial balance equals gross receivable
      adjustment: 0, // Default adjustment
      overall_balance: grossReceivable, // Initial overall balance equals gross receivable
      penalty: 0, // Default penalty
      status: 'Pending' // Default status
    };

    const dbService = await getDatabaseService();
    const loanId = await dbService.createLoan(dbLoanData);

    // Generate receipt records for the payment schedule
    const paymentAmount = dbLoanData.payday_payment;
    const totalPayments = dbLoanData.months;
    
    for (let i = 0; i < totalPayments; i++) {
      const paymentDate = new Date(dbLoanData.loan_start);
      paymentDate.setMonth(paymentDate.getMonth() + i + 1);
      
      await dbService.createReceipt({
        loan_id: loanId,
        to_pay: paymentAmount,
        original_to_pay: paymentAmount,
        schedule: paymentDate.toISOString().split('T')[0],
        amount: 0, // No payment made yet
        status: 'Not Paid'
      });
    }

    const newLoan = await dbService.getLoanById(loanId);
    
    return NextResponse.json(newLoan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 