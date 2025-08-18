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

// Types
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

interface FormData {
  customer_id: string
  loan_amount: string
  interest: string
  payment_schedule: string
  terms: string
  start_date: Date | null
  service_fee: string
}

interface LoanDetails {
  loan_start: string
  loan_end: string
  months: number
  transaction_date: string
  loan_amount: number
  interest: number
  gross_receivable: number
  payday_payment: number
  service: number
  balance: number
  adjustment: number
  overall_balance: number
  penalty: number
}

// Constants
const PAYMENT_SCHEDULES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "5th_20th", label: "5th & 20th" },
  { value: "15th_30th", label: "15th & 30th" },
  { value: "10th_25th", label: "10th & 25th" }
] as const

const DEFAULT_FORM_DATA: FormData = {
  customer_id: "",
  loan_amount: "",
  interest: "1",
  payment_schedule: "monthly",
  terms: "",
  start_date: null,
  service_fee: "1"
}

// Custom hooks
const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const result = await response.json()
        setCustomers(result.data || [])
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching customers:', err.message)
      }
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  return { customers, loading, refetch: fetchCustomers }
}

// Utility functions
const calculateEndDate = (startDate: Date, terms: number, schedule: string): Date => {
  const endDate = new Date(startDate)
  
  switch (schedule) {
    case 'weekly':
      endDate.setDate(endDate.getDate() + (terms * 7))
      break
    case 'monthly':
    case '5th_20th':
    case '15th_30th':
    case '10th_25th':
      endDate.setMonth(endDate.getMonth() + terms)
      break
  }
  
  return endDate
}

const calculateLoanDetails = (formData: FormData): LoanDetails | null => {
  const amount = parseFloat(formData.loan_amount) || 0
  const interestRate = parseFloat(formData.interest) || 0
  const terms = parseInt(formData.terms) || 0
  const serviceFeeRate = parseFloat(formData.service_fee) || 0

  if (!amount || !interestRate || !terms || !formData.start_date) {
    return null
  }

  const interestAmount = (amount * interestRate) / 100
  const totalInterest = interestAmount * terms
  const serviceFee = (amount * serviceFeeRate) / 100
  const grossReceivable = amount + totalInterest + serviceFee
  const paydayPayment = grossReceivable / terms
  const endDate = calculateEndDate(formData.start_date, terms, formData.payment_schedule)

  return {
    loan_start: formData.start_date.toISOString().split('T')[0],
    loan_end: endDate.toISOString().split('T')[0],
    months: terms,
    transaction_date: toManilaTime().split('T')[0],
    loan_amount: amount,
    interest: interestRate,
    gross_receivable: grossReceivable,
    payday_payment: paydayPayment,
    service: serviceFee,
    balance: grossReceivable,
    adjustment: 0,
    overall_balance: grossReceivable,
    penalty: 0
  }
}

// Components
const CustomerSelect = ({ 
  value, 
  onValueChange, 
  customers, 
  loading 
}: { 
  value: string
  onValueChange: (value: string) => void
  customers: Customer[]
  loading: boolean
}) => (
  <Select value={value} onValueChange={onValueChange} disabled={loading}>
    <SelectTrigger>
      <SelectValue placeholder={loading ? "Loading customers..." : "Select a customer"} />
    </SelectTrigger>
    <SelectContent>
      {loading ? (
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
)

const LoanSummary = ({ 
  loanDetails, 
  serviceFeeRate 
}: { 
  loanDetails: LoanDetails
  serviceFeeRate: number
}) => (
  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
    <h3 className="font-semibold text-gray-900">Loan Summary</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-gray-600">Interest Amount:</span>
        <div className="font-medium">₱{(loanDetails.loan_amount * loanDetails.interest / 100).toFixed(2)}</div>
      </div>
      <div>
        <span className="text-gray-600">Total Interest:</span>
        <div className="font-medium">₱{((loanDetails.loan_amount * loanDetails.interest / 100) * loanDetails.months).toFixed(2)}</div>
      </div>
      <div>
        <span className="text-gray-600">Service Fee:</span>
        <div className="font-medium">₱{((loanDetails.loan_amount * serviceFeeRate / 100)).toFixed(2)}</div>
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
)

const FormField = ({ 
  label, 
  required = false, 
  children 
}: { 
  label: string
  required?: boolean
  children: React.ReactNode
}) => (
  <div className="space-y-2">
    <Label className="flex items-center">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    {children}
  </div>
)

// Main component
export default function AddLoanModal({ onLoanAdded }: AddLoanModalProps) {
  const { addToast } = useToast()
  const { customers, loading: customersLoading } = useCustomers()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA)

  const updateFormData = (field: keyof FormData, value: string | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customer_id || !formData.loan_amount || !formData.terms || !formData.start_date) {
      alert('Please fill in all required fields marked with *')
      return
    }

    const loanDetails = calculateLoanDetails(formData)
    if (!loanDetails) {
      alert('Please fill in all required fields')
      return
    }

    const requestData: CreateLoanData = {
      customer_id: parseInt(formData.customer_id),
      payment_schedule: formData.payment_schedule,
      ...loanDetails
    }

    setLoading(true)
    try {
      const newLoan = await createLoan(requestData)
      try {
        await auditServer.logLoanAction(
          1, 
          'admin',
          'create',
          newLoan.loan_id,
          `New loan created: ₱${requestData.loan_amount} for customer ID ${requestData.customer_id}`
        )
      } catch (auditError) {
        console.error('Failed to log audit trail:', auditError)
      }

      setOpen(false)
      setFormData(DEFAULT_FORM_DATA)
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

  const loanDetails = calculateLoanDetails(formData)

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
          <FormField label="Customer" required>
            <CustomerSelect
              value={formData.customer_id}
              onValueChange={(value) => updateFormData('customer_id', value)}
              customers={customers}
              loading={customersLoading}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Loan Amount (₱)" required>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.loan_amount}
                onChange={(e) => updateFormData('loan_amount', e.target.value)}
                step="0.01"
                min="0"
              />
            </FormField>
            <FormField label="Interest Rate (%)" required>
              <Input
                type="number"
                placeholder="1"
                value={formData.interest}
                onChange={(e) => updateFormData('interest', e.target.value)}
                step="1"
                min="1"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Payment Schedule" required>
              <Select
                value={formData.payment_schedule}
                onValueChange={(value) => updateFormData('payment_schedule', value)}
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
            </FormField>
            <FormField label="Terms (Number of payments)" required>
              <Input
                type="number"
                placeholder="12"
                value={formData.terms}
                onChange={(e) => updateFormData('terms', e.target.value)}
                min="1"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Start Date" required>
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
                      onSelect={(date) => updateFormData('start_date', date || null)}
                      initialFocus
                    />
                </PopoverContent>
              </Popover>
            </FormField>
            <FormField label="Service Fee (%)">
              <Input
                type="number"
                placeholder="1"
                value={formData.service_fee}
                onChange={(e) => updateFormData('service_fee', e.target.value)}
                step="1"
                min="1"
              />
            </FormField>
          </div>

          {loanDetails && (
            <LoanSummary 
              loanDetails={loanDetails} 
              serviceFeeRate={parseFloat(formData.service_fee)} 
            />
          )}

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