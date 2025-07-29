"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn, toManilaTime } from "@/lib/utils"
import { createLoan, type CreateLoanData } from "@/lib/LendingServer"
import { useToast } from "@/components/ui/toast"
import { auditServer } from "@/lib/AuditServer"

interface Customer {
  id: number
  first_name: string
  middle_name: string
  last_name: string
  customer_id?: number
}

interface AddLoanModalProps {
  onLoanAdded: () => void
}

const PAYMENT_SCHEDULES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "semester", label: "Semester" },
  { value: "annually", label: "Annually" }
]

export default function AddLoanModal({ onLoanAdded }: AddLoanModalProps) {
  const { addToast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    customer_id: "",
    loan_amount: "",
    interest: "5",
    payment_schedule: "monthly",
    terms: "",
    start_date: null as Date | null,
    adjustments: ""
  })

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setCustomersLoading(true)
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const result = await response.json()
        // The API returns { data: [...] }, so we need to extract the data property
        setCustomers(result.data || [])
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching customers:', err.message)
      }
      setCustomers([])
    } finally {
      setCustomersLoading(false)
    }
  }

  const calculateLoanDetails = () => {
    const amount = parseFloat(formData.loan_amount) || 0
    const interestRate = parseFloat(formData.interest) || 0
    const terms = parseInt(formData.terms) || 0
    const adjustments = parseFloat(formData.adjustments) || 0

    if (!amount || !interestRate || !terms || !formData.start_date) {
      return null
    }

    const interestAmount = (amount * interestRate) / 100
    const grossReceivable = amount + interestAmount
    const paydayPayment = grossReceivable / terms
    const balance = grossReceivable
    const overallBalance = balance + adjustments

    // Calculate end date based on payment schedule and terms
    const endDate = new Date(formData.start_date)
    switch (formData.payment_schedule) {
      case 'daily':
        endDate.setDate(endDate.getDate() + terms)
        break
      case 'weekly':
        endDate.setDate(endDate.getDate() + (terms * 7))
        break
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + terms)
        break
      case 'semester':
        endDate.setMonth(endDate.getMonth() + (terms * 6))
        break
      case 'annually':
        endDate.setFullYear(endDate.getFullYear() + terms)
        break
    }

    return {
      loan_start: formData.start_date.toISOString().split('T')[0],
      loan_end: endDate.toISOString().split('T')[0],
      months: terms,
      transaction_date: toManilaTime().split('T')[0],
      loan_amount: amount,
      interest: interestRate,
      gross_receivable: grossReceivable,
      payday_payment: paydayPayment,
      service: 0,
      balance: balance,
      adjustment: adjustments,
      overall_balance: overallBalance,
      penalty: 0
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.customer_id || !formData.loan_amount || !formData.terms || !formData.start_date) {
      alert('Please fill in all required fields marked with *')
      return
    }

    const loanDetails = calculateLoanDetails()
    if (!loanDetails) {
      alert('Please fill in all required fields')
      return
    }

    const requestData: CreateLoanData = {
      customer_id: parseInt(formData.customer_id),
      payment_schedule: formData.payment_schedule,
      ...loanDetails
    }

    console.log("Sending loan creation request:", requestData)

    setLoading(true)
    try {
      const newLoan = await createLoan(requestData)
      console.log("Loan created successfully")

      try {
        await auditServer.logLoanAction(
          1, 
          'admin',
          'create',
          newLoan.loan_id,
          `New loan created: ₱${requestData.loan_amount} for customer ID ${requestData.customer_id}`
        );
      } catch (auditError) {
        // Log audit error but don't fail the loan creation
        console.error('Failed to log audit trail:', auditError);
      }

      setOpen(false)
      resetForm()
      onLoanAdded()
      addToast({
        type: "success",
        title: "Loan Created Successfully",
        message: "The new loan has been created and added to the system."
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error creating loan:', err.message)
        addToast({
          type: "error",
          title: "Failed to Create Loan",
          message: err.message
        })
      } else {
        addToast({
          type: "error",
          title: "Failed to Create Loan",
          message: "An unexpected error occurred. Please try again."
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customer_id: "",
      loan_amount: "",
      interest: "5",
      payment_schedule: "monthly",
      terms: "",
      start_date: null,
      adjustments: ""
    })
  }

  const loanDetails = calculateLoanDetails()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New Loan</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer" className="flex items-center">
              Customer <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              disabled={customersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={customersLoading ? "Loading customers..." : "Select a customer"} />
              </SelectTrigger>
              <SelectContent>
                {customersLoading ? (
                  <SelectItem value="" disabled>Loading customers...</SelectItem>
                ) : customers && customers.length > 0 ? (
                  customers.map((customer) => {
                    const customerId = customer.id || customer.customer_id
                    return customerId ? (   
                      <SelectItem key={customerId} value={customerId.toString()}>
                        {customer.first_name} {customer.middle_name} {customer.last_name}
                      </SelectItem>
                    ) : null
                  })
                ) : (
                  <SelectItem value="" disabled>No customers available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Loan Amount and Interest */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan_amount" className="flex items-center">
                Loan Amount (₱) <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="loan_amount"
                type="number"
                placeholder="0.00"
                value={formData.loan_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, loan_amount: e.target.value }))}
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest" className="flex items-center">
                Interest Rate (%) <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="interest"
                type="number"
                placeholder="0.00"
                value={formData.interest}
                onChange={(e) => setFormData(prev => ({ ...prev, interest: e.target.value }))}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Payment Schedule and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_schedule" className="flex items-center">
                Payment Schedule <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.payment_schedule}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_schedule: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment schedule" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_SCHEDULES.map((schedule) => (
                    <SelectItem key={schedule.value} value={schedule.value}>
                      {schedule.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms" className="flex items-center">
                Terms (Number of payments) <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="terms"
                type="number"
                placeholder="12"
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                min="1"
              />
            </div>
          </div>

          {/* Start Date and Adjustments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="flex items-center">
                Start Date <span className="text-red-500 ml-1">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustments">Adjustments (₱)</Label>
              <Input
                id="adjustments"
                type="number"
                placeholder="0.00"
                value={formData.adjustments}
                onChange={(e) => setFormData(prev => ({ ...prev, adjustments: e.target.value }))}
                step="0.01"
              />
            </div>
          </div>

          {/* Calculated Details Preview */}
          {loanDetails && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-900">Loan Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Interest Amount:</span>
                  <div className="font-medium">₱{(loanDetails.loan_amount * loanDetails.interest / 100).toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Gross Receivable:</span>
                  <div className="font-medium">₱{loanDetails.gross_receivable.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Payment per Term:</span>
                  <div className="font-medium">₱{loanDetails.payday_payment.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-600">End Date:</span>
                  <div className="font-medium">{format(new Date(loanDetails.loan_end), "MMM dd, yyyy")}</div>
                </div>
              </div>
            </div>
          )}

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
            <Button type="submit" disabled={loading || !loanDetails}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Loan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}