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
import { 
  Clock, 
  FileText, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Copy, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Percent, 
  PiggyBank, 
  Users
} from "lucide-react"
import { LucideIcon } from "lucide-react"

// Types
interface Stats {
  totalLoans: number
  totalDisbursed: number
  outstanding: number
  collectionRate: string
  totalCollected: number
  totalNotesReceivable: number
  totalLoansThisMonth: number
  pendingLoans: number
  completedLoans: number
  overdueLoans: number
}

// Constants
const FILTER_OPTIONS = ["All", "Pending", "Overdue", "Ongoing", "Finished"] as const
type FilterType = typeof FILTER_OPTIONS[number]

// Utility functions
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

// Components
const StatusBadge = ({ status }: { status: string }) => {
  const getBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'not paid':
        return "bg-orange-100 text-orange-800"
      case 'completed':
        return "bg-green-100 text-green-800"
      case 'overdue':
        return "bg-red-100 text-red-800"
      case 'ongoing':
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Badge variant="secondary" className={getBadgeStyle(status)}>
      {status || 'Unknown'}
    </Badge>
  )
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  valueColor, 
  subtitle, 
  trendIcon: TrendIcon,
  delay 
}: {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  valueColor: string
  subtitle: string
  trendIcon: LucideIcon
  delay: number
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay }}
    whileHover={{ scale: 1.02, y: -2 }}
    className="h-full"
  >
    <Card className="h-36 hover:shadow-md transition-shadow">
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
        <div className={`flex items-center text-xs ${valueColor} mt-1`}>
          <TrendIcon className="w-3 h-3 mr-1" />
          {subtitle}
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

const FilterTabs = ({ activeFilter, onFilterChange }: { 
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void 
}) => (
  <motion.div 
    className="flex flex-wrap gap-1 border-b overflow-x-auto"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
  >
    {FILTER_OPTIONS.map((filter, index) => (
      <motion.button
        key={filter}
        onClick={() => onFilterChange(filter)}
        className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
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
)

const LoanTable = ({ 
  loans, 
  selectedLoans, 
  onSelectLoan, 
  onSelectAll, 
  onLoanAdded 
}: {
  loans: LendingData[]
  selectedLoans: number[]
  onSelectLoan: (loanId: number, checked: boolean | string) => void
  onSelectAll: (checked: boolean) => void
  onLoanAdded: () => void
}) => {
  const isAllSelected = selectedLoans.length === loans.length && loans.length > 0

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Loan ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden sm:table-cell">Amount</TableHead>
            <TableHead className="hidden lg:table-cell">Interest</TableHead>
            <TableHead className="hidden xl:table-cell">Notes Receivable</TableHead>
            <TableHead className="hidden lg:table-cell">Balance</TableHead>
            <TableHead className="hidden xl:table-cell">Collected</TableHead>
            <TableHead className="hidden xl:table-cell">Penalty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Next Due Date</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-8">
                <motion.div 
                  className="flex flex-col items-center space-y-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <FileText className="w-12 h-12 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">No loans found</p>
                  <p className="text-sm text-gray-400">Get started by adding your first loan</p>
                  <AddLoanModal onLoanAdded={onLoanAdded} />
                </motion.div>
              </TableCell>
            </TableRow>
          ) : (
            <AnimatePresence>
              {loans.map((loan, index) => (
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
                      onCheckedChange={(checked) => onSelectLoan(loan.loan_id, checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">#{loan.loan_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                        {loan.first_name.charAt(0)}{loan.last_name.charAt(0)}
                      </div>
                      <span className="hidden sm:inline">{loan.first_name} {loan.last_name}</span>
                      <span className="sm:hidden">{loan.first_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{formatCurrency(loan.loan_amount)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{loan.interest}%</TableCell>
                  <TableCell className="hidden xl:table-cell">{formatCurrency(loan.gross_receivable)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatCurrency(loan.overall_balance)}</TableCell>
                  <TableCell className="hidden xl:table-cell text-emerald-600 font-semibold">
                    {formatCurrency(loan.gross_receivable - loan.overall_balance)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{formatCurrency(loan.penalty)}</TableCell>
                  <TableCell><StatusBadge status={loan.status} /></TableCell>
                  <TableCell className="hidden sm:table-cell">{formatDate(loan.loan_end)}</TableCell>
                  <TableCell>
                    <LoanActions loan={loan} onLoanAdded={onLoanAdded} />
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

const LoanActions = ({ loan, onLoanAdded }: { loan: LendingData; onLoanAdded: () => void }) => {
  const status = loan.status?.toLowerCase()

  if (status === 'completed') {
    return <span className="text-sm text-gray-500">No actions</span>
  }

  return (
    <div className="flex space-x-1">
      {status === 'ongoing' ? (
        <>
          <PaymentModal loan={loan} onPaymentRecorded={onLoanAdded} />
          <PenaltyModal loan={loan} onPenaltyUpdated={onLoanAdded} />
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <PaymentModal loan={loan} onPaymentRecorded={onLoanAdded} />
          <PenaltyModal loan={loan} onPenaltyUpdated={onLoanAdded} />
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  )
}

const BulkActionsBar = ({ 
  selectedCount, 
  onClearSelection 
}: { 
  selectedCount: number
  onClearSelection: () => void 
}) => (
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

const Pagination = ({ totalItems }: { totalItems: number }) => (
  <motion.div 
    className="flex flex-col sm:flex-row items-center justify-between gap-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.6 }}
  >
    <div className="text-sm text-gray-600">
      Showing 1-{totalItems} of {totalItems} entries
    </div>
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" disabled>Previous</Button>
      <Button variant="default" size="sm">1</Button>
      <Button variant="outline" size="sm">2</Button>
      <Button variant="outline" size="sm">3</Button>
      <span className="px-2">...</span>
      <Button variant="outline" size="sm">12</Button>
      <Button variant="outline" size="sm">Next</Button>
    </div>
  </motion.div>
)

// Main Component
export default function Lending() {
  const [lendingData, setLendingData] = useState<LendingData[]>([])
  const [stats, setStats] = useState<Stats>({
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
  const [activeFilter, setActiveFilter] = useState<FilterType>("All")
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

  const totalCollected = lendingData.reduce((total, loan) => total + (loan.gross_receivable - loan.overall_balance), 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold">All Loans</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Bulk Update Status</span>
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export Loans</span>
          </Button>
          <AddLoanModal onLoanAdded={handleLoanAdded} />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <StatCard
          title="Total Loans"
          value={stats.totalLoans}
          icon={Users}
          iconColor="text-gray-400"
          valueColor="text-gray-900"
          subtitle="All time loans"
          trendIcon={TrendingUp}
          delay={0.3}
        />
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(stats.totalDisbursed)}
          icon={DollarSign}
          iconColor="text-green-500"
          valueColor="text-green-600"
          subtitle="Total amount lent"
          trendIcon={TrendingUp}
          delay={0.4}
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(totalCollected)}
          icon={DollarSign}
          iconColor="text-emerald-500"
          valueColor="text-emerald-600"
          subtitle="Total amount collected"
          trendIcon={TrendingUp}
          delay={0.5}
        />
        <StatCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          icon={Percent}
          iconColor="text-blue-500"
          valueColor="text-blue-600"
          subtitle="Success rate"
          trendIcon={TrendingUp}
          delay={0.6}
        />
        <StatCard
          title="Notes Receivable"
          value={formatCurrency(stats.totalNotesReceivable)}
          icon={FileText}
          iconColor="text-indigo-500"
          valueColor="text-indigo-600"
          subtitle="Total receivable"
          trendIcon={TrendingUp}
          delay={0.7}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstanding)}
          icon={CreditCard}
          iconColor="text-orange-500"
          valueColor="text-orange-600"
          subtitle="Amount to collect"
          trendIcon={TrendingDown}
          delay={0.8}
        />
        <StatCard
          title="This Month"
          value={stats.totalLoansThisMonth}
          icon={PiggyBank}
          iconColor="text-purple-500"
          valueColor="text-purple-600"
          subtitle="New loans"
          trendIcon={TrendingUp}
          delay={0.9}
        />
        <StatCard
          title="Pending Loans"
          value={stats.pendingLoans}
          icon={Clock}
          iconColor="text-yellow-500"
          valueColor="text-yellow-600"
          subtitle="Awaiting approval"
          trendIcon={TrendingDown}
          delay={1.0}
        />
      </motion.div>

      {/* Filter Tabs */}
      <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardContent className="p-0">
            <LoanTable
              loans={filteredData}
              selectedLoans={selectedLoans}
              onSelectLoan={handleSelectLoan}
              onSelectAll={handleSelectAll}
              onLoanAdded={handleLoanAdded}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar 
        selectedCount={selectedLoans.length}
        onClearSelection={() => setSelectedLoans([])}
      />

      {/* Pagination */}
      <Pagination totalItems={filteredData.length} />
    </motion.div>
  )
}