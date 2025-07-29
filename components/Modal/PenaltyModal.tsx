"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Loader2, DollarSign, Calendar, Info, Save, X } from "lucide-react"
import { type LendingData } from "@/lib/LendingServer"
import { toManilaTime } from "@/lib/utils"
import { auditServer } from "@/lib/AuditServer"

interface PenaltyModalProps {
  loan: LendingData
  onPenaltyUpdated: () => void
}

interface PenaltyFormData {
  penalty_amount: string
  penalty_reason: string
  penalty_date: string
  notes: string
}

export default function PenaltyModal({ loan, onPenaltyUpdated }: PenaltyModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PenaltyFormData>({
    penalty_amount: loan.penalty?.toString() || "0",
    penalty_reason: "",
    penalty_date: toManilaTime().split('T')[0],
    notes: ""
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleInputChange = (field: keyof PenaltyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateNewBalance = () => {
    const currentBalance = loan.overall_balance || 0
    const currentPenalty = loan.penalty || 0
    const newPenalty = parseFloat(formData.penalty_amount) || 0
    const penaltyDifference = newPenalty - currentPenalty
    
    return currentBalance + penaltyDifference
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const penaltyAmount = parseFloat(formData.penalty_amount) || 0
      const newBalance = calculateNewBalance()

      const updateData = {
        loan_id: loan.loan_id,
        penalty: penaltyAmount,
        overall_balance: newBalance,
        updated_at: toManilaTime()
      }

      console.log("Updating loan penalty:", updateData)

      const response = await fetch('/api/lending', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update penalty')
      }

      const updatedLoan = await response.json()
      console.log("Penalty updated successfully:", updatedLoan)

      // Log the audit trail
      try {
        const oldPenalty = loan.penalty || 0
        const newPenalty = penaltyAmount
        const penaltyChange = newPenalty - oldPenalty
        
        await auditServer.logLoanAction(
          1, // actor_id - you might want to get this from user context
          'admin', // actor_role - you might want to get this from user context
          'update',
          loan.loan_id,
          `Penalty ${penaltyChange > 0 ? 'increased' : penaltyChange < 0 ? 'decreased' : 'updated'}: ₱${oldPenalty} → ₱${newPenalty}${formData.penalty_reason ? ` (Reason: ${formData.penalty_reason})` : ''}`
        );
      } catch (auditError) {
        // Log audit error but don't fail the penalty update
        console.error('Failed to log audit trail:', auditError);
      }

      // Reset form and close modal
      setFormData({
        penalty_amount: updatedLoan.penalty?.toString() || "0",
        penalty_reason: "",
        penalty_date: toManilaTime().split('T')[0],
        notes: ""
      })
      setOpen(false)
      onPenaltyUpdated()

    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error updating penalty:', err.message)
        alert(`Error updating penalty: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      penalty_amount: loan.penalty?.toString() || "0",
      penalty_reason: "",
      penalty_date: toManilaTime().split('T')[0],
      notes: ""
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <AlertTriangle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Manage Penalty
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loan Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loan Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer</Label>
                  <p className="text-sm font-medium">{loan.first_name} {loan.last_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Loan ID</Label>
                  <p className="text-sm font-medium">#{loan.loan_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Original Amount</Label>
                  <p className="text-sm font-medium">{formatCurrency(loan.loan_amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Balance</Label>
                  <p className="text-sm font-medium">{formatCurrency(loan.overall_balance)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Penalty</Label>
                  <p className="text-sm font-medium text-orange-600">{formatCurrency(loan.penalty)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Due Date</Label>
                  <p className="text-sm font-medium">{formatDate(loan.loan_end)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Penalty Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="penalty_amount">Penalty Amount (PHP)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="penalty_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.penalty_amount}
                    onChange={(e) => handleInputChange('penalty_amount', e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="penalty_date">Penalty Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="penalty_date"
                    type="date"
                    value={formData.penalty_date}
                    onChange={(e) => handleInputChange('penalty_date', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="penalty_reason">Penalty Reason</Label>
              <Input
                id="penalty_reason"
                value={formData.penalty_reason}
                onChange={(e) => handleInputChange('penalty_reason', e.target.value)}
                placeholder="e.g., Late payment, Default, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes about the penalty..."
                rows={3}
              />
            </div>

            {/* Balance Preview */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Balance Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Balance:</span>
                  <span>{formatCurrency(loan.overall_balance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Current Penalty:</span>
                  <span className="text-orange-600">{formatCurrency(loan.penalty)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New Penalty:</span>
                  <span className="text-orange-600">{formatCurrency(parseFloat(formData.penalty_amount) || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>New Total Balance:</span>
                  <span className={calculateNewBalance() > loan.overall_balance ? "text-red-600" : "text-green-600"}>
                    {formatCurrency(calculateNewBalance())}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Penalty
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}