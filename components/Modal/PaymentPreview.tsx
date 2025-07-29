"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Info, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { type LendingData } from "@/lib/LendingServer"
import { type ReceiptRecord } from "@/lib/PaymentServer"
import { useToast } from "@/components/ui/toast"



interface PaymentPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loan: LendingData
  receipts: ReceiptRecord[]
  formData: {
    payment_amount: string
    payment_type: string
    payment_method: string
    notes: string
  }
  onConfirmPayment: () => Promise<void>
  loading: boolean
}

interface PaymentDistribution {
  totalPayment: number
  payments: Array<{
    receipt_id: number
    paymentNumber: number
    dueDate: Date
    originalAmount: number
    appliedAmount: number
    remainingAmount: number
    status: string
  }>
  remainingBalance: number
  isPenaltyPayment: boolean
}

export default function PaymentPreview({ 
  open, 
  onOpenChange, 
  loan, 
  receipts, 
  formData, 
  onConfirmPayment, 
  loading 
}: PaymentPreviewProps) {
  const { addToast } = useToast()
  const [paymentPreview, setPaymentPreview] = useState<PaymentDistribution | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const calculatePaymentDistribution = (paymentAmount: number): PaymentDistribution | null => {
    const _today = new Date()
    
    console.log('Calculating payment distribution for amount:', paymentAmount)
    console.log('Payment type:', formData.payment_type)
    console.log('Available receipts:', receipts.map(r => ({
      id: r.receipt_id,
      number: r.payment_number,
      status: r.status,
      amount: r.amount,
      to_pay: r.to_pay,
      still_needed: r.to_pay - (r.amount || 0)
    })))
    
    // Handle penalty payment differently
    if (formData.payment_type === 'penalty_payment') {
      console.log('Processing penalty payment')
      return {
        totalPayment: paymentAmount,
        payments: [], // No receipt payments for penalty
        remainingBalance: loan.overall_balance - paymentAmount,
        isPenaltyPayment: true
      }
    }
    
    // Find the next unpaid receipt
    const nextUnpaidReceipt = receipts.find(receipt => 
      receipt.status === 'Pending' || receipt.status === 'Overdue' || receipt.status === 'Partial'
    )

    if (!nextUnpaidReceipt) {
      console.log('No unpaid receipts found. All receipts statuses:', receipts.map(r => r.status))
      return null
    }

    let remainingPayment = paymentAmount
    const payments: Array<{
      receipt_id: number
      paymentNumber: number
      dueDate: Date
      originalAmount: number
      appliedAmount: number
      remainingAmount: number
      status: string
    }> = []

    // Process all receipts that need payment (Pending, Overdue, or Partial)
    for (const receipt of receipts) {
      if (remainingPayment <= 0) {
        console.log('No remaining payment, breaking')
        break
      }

      // Calculate how much more is needed for this receipt
      const alreadyPaid = receipt.amount || 0
      const paymentDue = receipt.to_pay
      const stillNeeded = paymentDue - alreadyPaid
      
      console.log(`Receipt ${receipt.receipt_id}: already paid ${alreadyPaid}, due ${paymentDue}, still needed ${stillNeeded}`)
      
      // Skip if this receipt is already fully paid
      if (stillNeeded <= 0) {
        console.log(`Receipt ${receipt.receipt_id} is fully paid, skipping`)
        continue
      }

      const appliedAmount = Math.min(remainingPayment, stillNeeded)
      const remainingAmount = stillNeeded - appliedAmount

      console.log(`Receipt ${receipt.receipt_id}: applying ${appliedAmount}, remaining after this receipt: ${remainingAmount}`)

      payments.push({
        receipt_id: receipt.receipt_id,
        paymentNumber: receipt.payment_number,
        dueDate: new Date(receipt.due_date),
        originalAmount: paymentDue,
        appliedAmount,
        remainingAmount,
        status: remainingAmount === 0 ? 'fully_paid' : 'partially_paid'
      })

      remainingPayment -= appliedAmount
    }

    const remainingBalance = loan.overall_balance - paymentAmount

    console.log('Final payment distribution:', payments)
    console.log('Remaining balance:', remainingBalance)

    return {
      totalPayment: paymentAmount,
      payments,
      remainingBalance: Math.max(0, remainingBalance),
      isPenaltyPayment: false
    }
  }

  // Recalculate payment preview when modal opens or form data changes
  useEffect(() => {
    if (open) {
      const currentPaymentAmount = parseFloat(formData.payment_amount) || 0
      const preview = currentPaymentAmount > 0 ? calculatePaymentDistribution(currentPaymentAmount) : null
      setPaymentPreview(preview)
    }
  }, [open, formData.payment_amount, formData.payment_type, receipts])

  const handleConfirmPayment = async () => {
    try {
      await onConfirmPayment()
      addToast({
        type: "success",
        title: "Payment Recorded Successfully",
        message: `Payment of ${formatCurrency(parseFloat(formData.payment_amount) || 0)} has been recorded for loan #${loan.loan_id}.`
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        addToast({
          type: "error",
          title: "Failed to Record Payment",
          message: err.message
        })
      } else {
        addToast({
          type: "error",
          title: "Failed to Record Payment",
          message: "An unexpected error occurred. Please try again."
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Payment Preview</DialogTitle>
          <p className="text-gray-600">Review payment details for loan #{loan.loan_id}</p>
        </DialogHeader>
        
        {paymentPreview && (
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Total Payment:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(paymentPreview.totalPayment)}</span>
                  </div>
                  
                  {paymentPreview.isPenaltyPayment ? (
                    // Penalty Payment Display
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Penalty Payment Details:</h4>
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Current Penalty:</span>
                          <span className="text-orange-600 font-medium">{formatCurrency(loan.penalty)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Payment Amount:</span>
                          <span className="text-green-600 font-medium">{formatCurrency(paymentPreview.totalPayment)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Remaining Penalty:</span>
                          <span className="text-orange-600 font-medium">{formatCurrency(Math.max(0, loan.penalty - paymentPreview.totalPayment))}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Regular Loan Payment Display
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Payment Distribution:</h4>
                      {paymentPreview.payments && paymentPreview.payments.length > 0 ? (
                        paymentPreview.payments.map((payment, index) => {
                          console.log(`Rendering payment ${index}:`, payment)
                          return (
                            <div key={index} className={`flex justify-between items-center p-3 border rounded text-sm ${
                              payment.status === 'fully_paid' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                            }`}>
                              <div>
                                <span className="font-medium">Payment #{payment.paymentNumber}</span>
                                <div className="text-gray-600">{formatDate(payment.dueDate.toISOString())}</div>
                                <div className="text-xs text-gray-500">
                                  Original: {formatCurrency(payment.originalAmount)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium ${
                                  payment.status === 'fully_paid' ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {formatCurrency(payment.appliedAmount)}
                                </div>
                                {payment.remainingAmount > 0 && (
                                  <div className="text-orange-600 text-xs">
                                    Remaining: {formatCurrency(payment.remainingAmount)}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">
                                  {payment.status === 'fully_paid' ? 'Paid' : 'Partially Paid'}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-sm text-gray-500 p-2 border rounded">
                          No payment distribution calculated. This might be because:
                          <ul className="list-disc list-inside mt-1 text-xs">
                            <li>All receipts are already fully paid</li>
                            <li>Payment amount is 0</li>
                            <li>No receipts found for this loan</li>
                          </ul>
                          <div className="mt-2 text-xs">
                            <strong>Debug Info:</strong>
                            <br />Payment Amount: {formatCurrency(parseFloat(formData.payment_amount) || 0)}
                            <br />Total Receipts: {receipts.length}
                            <br />Receipts with pending/partial: {receipts.filter(r => r.status === 'Pending' || r.status === 'Overdue' || r.status === 'Partial').length}
                            <br />Receipt Statuses: {receipts.map(r => r.status).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Remaining Balance:</span>
                    <span className="font-bold text-gray-600">{formatCurrency(paymentPreview.remainingBalance)}</span>
                  </div>

                  {paymentPreview.remainingBalance > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-yellow-800">
                        <strong>Note:</strong> This payment will partially cover the outstanding balance. 
                        {paymentPreview.remainingBalance > 0 && (
                          <span> {formatCurrency(paymentPreview.remainingBalance)} will remain unpaid.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Back to Form
              </Button>
              <Button 
                type="button"
                onClick={handleConfirmPayment}
                disabled={loading || (!paymentPreview?.isPenaltyPayment && (!paymentPreview?.payments || paymentPreview.payments.length === 0))}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording Payment...
                  </>
                ) : (
                  'Confirm & Record Payment'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 