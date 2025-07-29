"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Wallet, Loader2, Calendar, DollarSign, CreditCard, AlertCircle, CheckCircle, Info } from "lucide-react"
import { format } from "date-fns"
import { type LendingData } from "@/lib/LendingServer"
import { paymentServer, type ReceiptRecord } from "@/lib/PaymentServer"
import PaymentPreview from "./PaymentPreview"
import { auditServer } from "@/lib/AuditServer"

interface PaymentModalProps {
  loan: LendingData
  onPaymentRecorded: () => void
}



const PAYMENT_TYPES = [
  { value: "loan_payment", label: "Loan Payment" },
  { value: "penalty_payment", label: "Penalty Payment" }
]

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "gcash", label: "GCash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "paymaya", label: "PayMaya" }
]

export default function PaymentModal({ loan, onPaymentRecorded }: PaymentModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [receiptsLoading, setReceiptsLoading] = useState(false)
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState({
    payment_amount: "",
    payment_type: "loan_payment",
    payment_method: "cash",
    notes: ""
  })

  // Fetch receipts when modal opens
  useEffect(() => {
    if (open) {
      fetchReceipts()
    }
  }, [open, loan.loan_id])

  const fetchReceipts = async () => {
    setReceiptsLoading(true)
    try {
      const data = await paymentServer.getReceiptsByLoanId(loan.loan_id)
      setReceipts(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching receipts:', err.message)
      }
      setReceipts([])
    } finally {
      setReceiptsLoading(false)
    }
  }

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

  const handlePaymentAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, payment_amount: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.payment_amount || !formData.payment_type || !formData.payment_method) {
      alert('Please fill in all required fields')
      return
    }

    const paymentAmount = parseFloat(formData.payment_amount)
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than 0')
      return
    }

    if (formData.payment_type === 'penalty_payment') {
      if (paymentAmount > loan.penalty) {
        alert('Penalty payment amount cannot exceed the current penalty amount')
        return
      }
    } else {
      if (paymentAmount > loan.overall_balance) {
        alert('Payment amount cannot exceed the total outstanding balance')
        return
      }
    }

    setShowPreview(true)
  }

  const generateDefaultNotes = (paymentAmount: number): string => {
    if (formData.payment_type === 'penalty_payment') {
      return `Penalty payment - ${formatCurrency(paymentAmount)}`
    }

    // For loan payments, determine which payment schedules are being paid
    const paymentDistribution = calculatePaymentDistribution(paymentAmount)
    
    if (!paymentDistribution || !paymentDistribution.payments || paymentDistribution.payments.length === 0) {
      return `Loan payment - ${formatCurrency(paymentAmount)}`
    }

    const paidSchedules = paymentDistribution.payments.map(payment => {
      const receipt = receipts.find(r => r.receipt_id === payment.receipt_id)
      if (!receipt) return null
      
      const dueDate = formatDate(receipt.due_date)
      const status = payment.remainingAmount === 0 ? 'Fully paid' : 'Partially paid'
      return `Payment #${receipt.payment_number} (${dueDate}) - ${status}`
    }).filter(Boolean)

    if (paidSchedules.length === 0) {
      return `Loan payment - ${formatCurrency(paymentAmount)}`
    }

    if (paidSchedules.length === 1) {
      return `Loan payment - ${paidSchedules[0]}`
    }

    return `Loan payment - Multiple schedules: ${paidSchedules.join(', ')}`
  }

  const calculatePaymentDistribution = (paymentAmount: number) => {
    const nextUnpaidReceipt = receipts.find(receipt => 
      receipt.status === 'Pending' || receipt.status === 'Overdue' || receipt.status === 'Partial'
    )

    if (!nextUnpaidReceipt) {
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

    for (const receipt of receipts) {
      if (remainingPayment <= 0) break

      const alreadyPaid = receipt.amount || 0
      const paymentDue = receipt.to_pay
      const stillNeeded = paymentDue - alreadyPaid
      
      if (stillNeeded <= 0) continue

      const appliedAmount = Math.min(remainingPayment, stillNeeded)
      const remainingAmount = stillNeeded - appliedAmount

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

    return {
      totalPayment: paymentAmount,
      payments,
      remainingBalance: Math.max(0, receipts.reduce((sum, r) => sum + (r.to_pay - (r.amount || 0)), 0) - paymentAmount),
      isPenaltyPayment: false
    }
  }

  const handleConfirmPayment = async () => {
    setLoading(true)
    try {
      const paymentAmount = parseFloat(formData.payment_amount)
      
      // Generate default notes if user didn't provide any
      const notes = formData.notes.trim() || generateDefaultNotes(paymentAmount)
      
      let paymentResult;
      
      if (formData.payment_type === 'penalty_payment') {
        paymentResult = await paymentServer.processPenaltyPayment(
          loan.loan_id,
          paymentAmount,
          formData.payment_method,
          notes
        )
      } else {
        paymentResult = await paymentServer.processLoanPayment(
          loan.loan_id,
          paymentAmount,
          formData.payment_method,
          notes,
          receipts
        )
      }
      
      // Log the audit trail
      try {
        await auditServer.logLoanAction(
          1, // actor_id - you might want to get this from user context
          'admin', // actor_role - you might want to get this from user context
          'payment',
          loan.loan_id,
          `${formData.payment_type === 'penalty_payment' ? 'Penalty' : 'Loan'} payment recorded: ₱${paymentAmount} via ${formData.payment_method}`
        );
      } catch (auditError) {
        // Log audit error but don't fail the payment recording
        console.error('Failed to log audit trail:', auditError);
      }
      
      setOpen(false)
      resetForm()
      onPaymentRecorded()
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error recording payment:', err.message)
        alert(`Failed to record payment: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      payment_amount: "",
      payment_type: "loan_payment",
      payment_method: "cash",
      notes: ""
    })
    setShowPreview(false)
  }

  const maxPaymentAmount = formData.payment_type === 'penalty_payment' ? loan.penalty : loan.overall_balance

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Wallet className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Record Payment</DialogTitle>
            <p className="text-gray-600">Make a payment for loan #{loan.loan_id}</p>
          </DialogHeader>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Loan Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <div className="font-medium">{loan.first_name} {loan.last_name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Loan Amount:</span>
                  <div className="font-medium">{formatCurrency(loan.loan_amount)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Interest Rate:</span>
                  <div className="font-medium">{loan.interest}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Gross Receivable:</span>
                  <div className="font-medium">{formatCurrency(loan.gross_receivable)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Current Balance:</span>
                  <div className="font-medium text-orange-600">{formatCurrency(loan.overall_balance)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Penalty:</span>
                  <div className="font-medium text-red-600">{formatCurrency(loan.penalty)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Start Date:</span>
                  <div className="font-medium">{formatDate(loan.loan_start)}</div>
                </div>
                <div>
                  <span className="text-gray-600">End Date:</span>
                  <div className="font-medium">{formatDate(loan.loan_end)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment_amount" className="flex items-center">
                        Payment Amount (₱) <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="payment_amount"
                        type="number"
                        placeholder="Enter payment amount (e.g., 5000.00)"
                        value={formData.payment_amount}
                        onChange={(e) => handlePaymentAmountChange(e.target.value)}
                        step="0.01"
                        min="0"
                        max={maxPaymentAmount}
                        className={!formData.payment_amount ? "border-red-300" : ""}
                      />
                      {receipts.length > 0 && formData.payment_type === 'loan_payment' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Quick Payment Options:</p>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const recentPartial = receipts
                                .filter(r => r.status === 'Partial')
                                .sort((a, b) => b.payment_number - a.payment_number)[0];
                              
                              if (recentPartial) {
                                const remainingAmount = recentPartial.to_pay - recentPartial.amount;
                                return (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePaymentAmountChange(remainingAmount.toString())}
                                    className="text-xs"
                                  >
                                    Next Due: {formatCurrency(remainingAmount)}
                                  </Button>
                                );
                              }
                              
                              const nextUnpaid = receipts.find(r => r.status === 'Pending' || r.status === 'Overdue');
                              if (nextUnpaid) {
                                const remainingAmount = nextUnpaid.to_pay - nextUnpaid.amount;
                                return (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePaymentAmountChange(remainingAmount.toString())}
                                    className="text-xs"
                                  >
                                    Next Due: {formatCurrency(remainingAmount)}
                                  </Button>
                                );
                              }
                              
                              return null;
                            })()}
                            
                            {/* All pending amounts */}
                            {(() => {
                              const pendingAmount = receipts
                                .filter(r => r.status === 'Pending' || r.status === 'Overdue' || r.status === 'Partial')
                                .reduce((sum, r) => sum + (r.to_pay - r.amount), 0);
                              if (pendingAmount > 0) {
                                return (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePaymentAmountChange(pendingAmount.toString())}
                                    className="text-xs"
                                  >
                                    All Pending: {formatCurrency(pendingAmount)}
                                  </Button>
                                );
                              }
                              return null;
                            })()}
                            
                            {/* Full balance */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePaymentAmountChange(loan.overall_balance.toString())}
                              className="text-xs"
                            >
                              Full Balance: {formatCurrency(loan.overall_balance)}
                            </Button>
                          </div>
                        </div>
                      )}

                      {formData.payment_type === 'penalty_payment' && loan.penalty > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Quick Penalty Payment Options:</p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePaymentAmountChange(loan.penalty.toString())}
                              className="text-xs"
                            >
                              Full Penalty: {formatCurrency(loan.penalty)}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePaymentAmountChange((loan.penalty * 0.5).toString())}
                              className="text-xs"
                            >
                              Half Penalty: {formatCurrency(loan.penalty * 0.5)}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePaymentAmountChange((loan.penalty * 0.25).toString())}
                              className="text-xs"
                            >
                              Quarter Penalty: {formatCurrency(loan.penalty * 0.25)}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Type */}
                    <div className="space-y-2">
                      <Label htmlFor="payment_type" className="flex items-center">
                        Payment Type <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select
                        value={formData.payment_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, payment_type: value }))}
                      >
                        <SelectTrigger className={!formData.payment_type ? "border-red-300" : ""}>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label htmlFor="payment_method" className="flex items-center">
                        Payment Method <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select
                        value={formData.payment_method}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                      >
                        <SelectTrigger className={!formData.payment_method ? "border-red-300" : ""}>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any additional notes about this payment. If left empty, automatic notes will be generated based on payment schedules."
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading || !formData.payment_amount || !formData.payment_type || !formData.payment_method}>
                        Preview Payment
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Payment Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Payment Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {receiptsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Loading payment schedule...</span>
                  </div>
                ) : receipts.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {receipts
                      .sort((a, b) => {
                        // Sort by status priority: Partial > Overdue > Pending > Paid
                        const statusPriority = { 'Partial': 0, 'Overdue': 1, 'Pending': 2, 'Paid': 3 };
                        const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 4;
                        const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 4;
                        
                        if (aPriority !== bPriority) {
                          return aPriority - bPriority;
                        }
                        
                        // If same status, sort by payment number
                        return a.payment_number - b.payment_number;
                      })
                      .map((receipt) => {
                        const remainingBalance = receipt.to_pay - receipt.amount;
                        const _isFullyPaid = receipt.status === 'Paid';
                        const isPartiallyPaid = receipt.amount > 0 && receipt.amount < receipt.to_pay;
                        
                        return (
                          <div key={receipt.receipt_id} className={`flex items-center justify-between p-3 border rounded-lg ${
                            receipt.status === 'Partial' ? 'bg-orange-50 border-orange-200' :
                            receipt.status === 'Overdue' ? 'bg-red-50 border-red-200' :
                            receipt.status === 'Pending' ? 'bg-blue-50 border-blue-200' :
                            'bg-green-50 border-green-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                receipt.status === 'Partial' ? 'bg-orange-100 text-orange-800' :
                                receipt.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                                receipt.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {receipt.payment_number}
                              </div>
                              <div>
                                <div className="font-medium">{formatDate(receipt.due_date)}</div>
                                <div className="text-sm text-gray-600">
                                  {formatCurrency(receipt.to_pay)}
                                  {isPartiallyPaid && (
                                    <span className="text-orange-600 ml-2">
                                      (Paid: {formatCurrency(receipt.amount)})
                                    </span>
                                  )}
                                </div>
                                {isPartiallyPaid && (
                                  <div className="text-xs text-orange-600 font-medium">
                                    Balance: {formatCurrency(remainingBalance)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {receipt.status === 'Paid' && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Paid
                                </Badge>
                              )}
                              {receipt.status === 'Overdue' && (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                              {receipt.status === 'Pending' && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  Pending
                                </Badge>
                              )}
                              {receipt.status === 'Partial' && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                  Partial
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Calendar className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium">No payment schedule found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Receipt records may not have been created for this loan.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={fetchReceipts}
                    >
                      <Loader2 className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Preview Component */}
      <PaymentPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        loan={loan}
        receipts={receipts}
        formData={formData}
        onConfirmPayment={handleConfirmPayment}
        loading={loading}
      />
    </>
  )
}