"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { getLendingData, getLendingStats, type LendingData } from "@/lib/LendingServer"
import AddLoanModal from "@/components/Modal/AddLoanModal"
import PaymentModal from "@/components/Modal/PaymentModal"
import PenaltyModal from "@/components/Modal/PenaltyModal"
import { Clock, FileText, Edit, Trash2, MoreHorizontal, Copy, Printer, TrendingUp, TrendingDown, DollarSign, CreditCard, Percent, PiggyBank, Users } from "lucide-react"

export default function Lending() {
  const [lendingData, setLendingData] = useState<LendingData[]>([])
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalDisbursed: 0,
    outstanding: 0,
    collectionRate: '0.0',
    totalCollected: 0,
    totalNotesReceivable: 0,
    totalLoansThisMonth: 0,
    pendingLoans: 0,
    completedLoans: 0,
    overdueLoans: 0
  })
  const [selectedLoans, setSelectedLoans] = useState<number[]>([])
  const [activeFilter, setActiveFilter] = useState("All")
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const data = await getLendingData()
      setLendingData(data)
      setStats(getLendingStats(data))
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching lending data:', err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLoanAdded = () => {
    fetchData()
  }

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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'not paid':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'overdue':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'ongoing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Ongoing</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const handleSelectLoan = (loanId: number, checked: boolean | string) => {
    if (checked === true) {
      setSelectedLoans(prev => [...prev, loanId])
    } else {
      setSelectedLoans(prev => prev.filter(id => id !== loanId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLoans(lendingData.map(loan => loan.loan_id))
    } else {
      setSelectedLoans([])
    }
  }

  const filteredData = lendingData.filter(loan => {
    if (activeFilter === "All") return true
    if (activeFilter === "Pending") return loan.status?.toLowerCase() === "pending" || loan.status?.toLowerCase() === "not paid"
    if (activeFilter === "Overdue") {
      const loanEnd = new Date(loan.loan_end)
      const today = new Date()
      return loanEnd < today && (loan.status?.toLowerCase() === "pending" || loan.status?.toLowerCase() === "not paid")
    }
    if (activeFilter === "Ongoing") return loan.status?.toLowerCase() === "ongoing" || loan.status?.toLowerCase() === "not paid"
    if (activeFilter === "Finished") return loan.status?.toLowerCase() === "completed"
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading lending data...</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold">All Loans</h1>
        <div className="flex gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Bulk Update Status
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Export Loans
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AddLoanModal onLoanAdded={handleLoanAdded} />
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Row 1 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="h-full"
        >
          <Card className="h-36 hover:shadow-md transition-shadow">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Loans</CardTitle>
              <Users className="w-5 h-5 text-gray-400" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{stats.totalLoans}</div>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                All time loans
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="h-full"
        >
          <Card className="h-36 hover:shadow-md transition-shadow">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Disbursed</CardTitle>
              <DollarSign className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalDisbursed)}</div>
              <div className="flex items-center text-xs text-green-500 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Total amount lent
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="h-full"
        >
          <Card className="h-36 hover:shadow-md transition-shadow">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Collected</CardTitle>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(lendingData.reduce((total, loan) => total + (loan.gross_receivable - loan.overall_balance), 0))}</div>
              <div className="flex items-center text-xs text-emerald-500 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Total amount collected
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="h-full"
        >
          <Card className="h-36 hover:shadow-md transition-shadow">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Collection Rate</CardTitle>
              <Percent className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">{stats.collectionRate}%</div>
              <div className="flex items-center text-xs text-blue-500 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Success rate
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Row 2 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="h-full"
        >
          <Card className="h-36 hover:shadow-md transition-shadow">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Notes Receivable</CardTitle>
              <FileText className="w-5 h-5 text-indigo-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.totalNotesReceivable)}</div>
              <div className="flex items-center text-xs text-indigo-500 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Total receivable
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="h-full"
        >
          <Card className="h-36 hover:shadow-md transition-shadow">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Outstanding</CardTitle>
              <CreditCard className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.outstanding)}</div>
              <div className="flex items-center text-xs text-orange-500 mt-1">
                <TrendingDown className="w-3 h-3 mr-1" />
                Amount to collect
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="h-full"
        >
          <Card className="h-36 hover:shadow-md transition-shadow">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
              <PiggyBank className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-600">{stats.totalLoansThisMonth}</div>
              <div className="flex items-center text-xs text-purple-500 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                New loans
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 1.0 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="h-full"
        >
          <Card className="h-36 hover:shadow-md transition-shadow">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Loans</CardTitle>
              <Clock className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingLoans}</div>
              <div className="flex items-center text-xs text-yellow-500 mt-1">
                <TrendingDown className="w-3 h-3 mr-1" />
                Awaiting approval
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>


      <motion.div 
        className="flex space-x-1 border-b"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {["All", "Pending", "Overdue", "Ongoing", "Finished"].map((filter, index) => (
          <motion.button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeFilter === filter
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {filter}
          </motion.button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLoans.length === lendingData.length && lendingData.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Notes Receivable</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Penalty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Due Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
                              {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <motion.div 
                        className="flex flex-col items-center space-y-2"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          <FileText className="w-12 h-12 text-gray-300" />
                        </motion.div>
                        <motion.p 
                          className="text-lg font-medium text-gray-500"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          No loans found
                        </motion.p>
                        <motion.p 
                          className="text-sm text-gray-400"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                        >
                          {activeFilter === "All" 
                            ? "Get started by adding your first loan" 
                            : `No loans match the "${activeFilter}" filter`}
                        </motion.p>
                        {activeFilter === "All" && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <AddLoanModal onLoanAdded={handleLoanAdded} />
                          </motion.div>
                        )}
                      </motion.div>
                    </TableCell>
                  </TableRow>
              ) : (
                <AnimatePresence>
                  {filteredData.map((loan, index) => (
                    <motion.tr
                      key={loan.loan_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                      className="border-b"
                    >
                    <TableCell>
                      <Checkbox
                        checked={selectedLoans.includes(loan.loan_id)}
                        onCheckedChange={(checked: boolean | string) => handleSelectLoan(loan.loan_id, checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">#{loan.loan_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {loan.first_name.charAt(0)}{loan.last_name.charAt(0)}
                        </div>
                        <span>{loan.first_name} {loan.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(loan.loan_amount)}</TableCell>
                    <TableCell>{loan.interest}%</TableCell>
                                         <TableCell>{formatCurrency(loan.gross_receivable)}</TableCell>
                     <TableCell>{formatCurrency(loan.overall_balance)}</TableCell>
                     <TableCell className="text-emerald-600 font-semibold">{formatCurrency(loan.gross_receivable - loan.overall_balance)}</TableCell>
                     <TableCell>{formatCurrency(loan.penalty)}</TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell>{formatDate(loan.loan_end)}</TableCell>
                    <TableCell>
                      {loan.status?.toLowerCase() === 'completed' ? (
                        <span className="text-sm text-gray-500">No actions available</span>
                      ) : loan.status?.toLowerCase() === 'ongoing' ? (
                        <div className="flex space-x-1">
                          <PaymentModal loan={loan} onPaymentRecorded={handleLoanAdded} />
                          <PenaltyModal loan={loan} onPenaltyUpdated={handleLoanAdded} />
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <PaymentModal loan={loan} onPaymentRecorded={handleLoanAdded} />
                          <PenaltyModal loan={loan} onPenaltyUpdated={handleLoanAdded} />
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedLoans.length > 0 && (
          <motion.div 
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg px-4 py-3 flex items-center space-x-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-sm font-medium">{selectedLoans.length} Selected</span>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLoans([])}
              >
                ×
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="text-sm text-gray-600">
          Showing 1-{filteredData.length} of {lendingData.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="default" size="sm">1</Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm">2</Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm">3</Button>
          </motion.div>
          <span className="px-2">...</span>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm">12</Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </motion.div>
        </div>
      </motion.div>

      
    </motion.div>
  )
}