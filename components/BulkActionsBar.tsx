"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Copy, Printer, Trash2, DollarSign, AlertTriangle } from "lucide-react"
import PaymentModal from "@/components/Modal/PaymentModal"
import PenaltyModal from "@/components/Modal/PenaltyModal"
import { type LendingData } from "@/lib/LendingServer"

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  selectedLoans: number[]
  lendingData: LendingData[]
  onLoanAdded: () => void
}

export default function BulkActionsBar({ 
  selectedCount, 
  onClearSelection,
  selectedLoans,
  lendingData,
  onLoanAdded
}: BulkActionsBarProps) {
  const selectedLoanData = lendingData.filter(loan => selectedLoans.includes(loan.loan_id))
  const hasOngoingLoans = selectedLoanData.some(loan => 
    loan.status?.toLowerCase() === 'ongoing' || loan.status?.toLowerCase() === 'not paid'
  )

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div 
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg px-4 py-3 flex items-center space-x-2 z-50"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-sm font-medium">{selectedCount} Selected</span>
          {hasOngoingLoans && selectedLoanData.length === 1 && (
            <>
              <PaymentModal 
                loan={selectedLoanData[0]} 
                onPaymentRecorded={onLoanAdded}
              />
              <PenaltyModal 
                loan={selectedLoanData[0]} 
                onPenaltyUpdated={onLoanAdded}
              />
            </>
          )}
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Duplicate</span>
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>×</Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
