import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

// PUT update receipt by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receiptId = parseInt(id);
    
    if (isNaN(receiptId)) {
      return NextResponse.json(
        { error: 'Invalid receipt ID' },
        { status: 400 }
      );
    }

    const paymentData = await request.json();
    const dbService = await getDatabaseService();
    
    const receipts = await dbService.getAllReceipts();
    const currentReceipt = receipts.find(r => r.pay_id === receiptId);
    
    if (!currentReceipt) {
      return NextResponse.json(
        { error: `Receipt with ID ${receiptId} not found. Available receipts: ${receipts.map(r => r.pay_id).join(', ')}` },
        { status: 404 }
      );
    }

    const loanReceipts = receipts.filter(r => r.loan_id === currentReceipt.loan_id);
    const paymentAmount = paymentData.amount || 0;
    
    // Sort receipts by schedule date to process in chronological order
    loanReceipts.sort((a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime());
    
    // Find the current receipt index
    const currentReceiptIndex = loanReceipts.findIndex(r => r.pay_id === receiptId);
    
    if (currentReceiptIndex === -1) {
      return NextResponse.json(
        { error: 'Current receipt not found in loan receipts' },
        { status: 404 }
      );
    }

    // Process payment distribution
    let remainingPayment = paymentAmount;
    const updatedReceipts: Array<{ pay_id: number; amount: number; status: string }> = [];
    
    // Start from the current receipt and distribute payment forward
    for (let i = currentReceiptIndex; i < loanReceipts.length && remainingPayment > 0; i++) {
      const receipt = loanReceipts[i];
      const currentAmount = receipt.amount || 0;
      const toPay = receipt.to_pay || 0;
      const remainingForThisReceipt = Math.max(0, toPay - currentAmount);
      
      if (remainingForThisReceipt > 0) {
        const paymentForThisReceipt = Math.min(remainingPayment, remainingForThisReceipt);
        const newAmount = currentAmount + paymentForThisReceipt;
        const newStatus = newAmount >= toPay ? 'Paid' : 'Partial';
        
        // Update the receipt
        await dbService.updateReceipt(receipt.pay_id, {
          amount: newAmount,
          status: newStatus
        });
        
        // Create payment history record for this receipt
        await dbService.createPaymentHistory({
          loan_id: receipt.loan_id,
          pay_id: receipt.pay_id,
          amount: paymentForThisReceipt,
          payment_method: paymentData.method || 'Cash',
          notes: paymentData.notes || ''
        });
        
        remainingPayment -= paymentForThisReceipt;
        updatedReceipts.push({ pay_id: receipt.pay_id, amount: newAmount, status: newStatus });
      }
    }

    // Update loan balance and status
    const loan = await dbService.getLoanById(currentReceipt.loan_id);
    if (loan) {
      // Calculate new balance based on actual payments vs. total receivable
      const totalPaid = loanReceipts.reduce((sum, receipt) => {
        const updatedReceipt = updatedReceipts.find(ur => ur.pay_id === receipt.pay_id);
        return sum + (updatedReceipt?.amount || receipt.amount || 0);
      }, 0);
      
      const totalToPay = loanReceipts.reduce((sum, receipt) => sum + (receipt.to_pay || 0), 0);
      const newBalance = Math.max(0, totalToPay - totalPaid);
      const isFullyPaid = totalPaid >= totalToPay;
      
      await dbService.updateLoan(currentReceipt.loan_id, {
        overall_balance: newBalance,
        balance: newBalance,
        status: isFullyPaid ? 'Completed' : loan.status
      });
    }

    // Get the updated receipt
    const updatedReceiptsAll = await dbService.getAllReceipts();
    const updatedReceipt = updatedReceiptsAll.find(r => r.pay_id === receiptId);
    
    return NextResponse.json({
      receipt: updatedReceipt,
      totalPaymentApplied: paymentAmount - remainingPayment,
      remainingPayment: remainingPayment,
      message: remainingPayment > 0 
        ? `Payment of ${paymentAmount} applied. ${remainingPayment} returned as overpayment.`
        : `Payment of ${paymentAmount} successfully applied to ${updatedReceipts.length} receipt(s).`
    });
  } catch (error) {
    console.error('Error updating receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE receipt by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receiptId = parseInt(id);
    
    if (isNaN(receiptId)) {
      return NextResponse.json(
        { error: 'Invalid receipt ID' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    await dbService.deleteReceipt(receiptId);
    
    return NextResponse.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 